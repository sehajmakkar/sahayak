// Turns OCR text from a photographed document (ration card, income / caste / disability
// certificate) into profile answers. Pure and on-device: the text is never stored or sent anywhere,
// and long ID-like numbers (Aadhaar, account numbers) are stripped before anything else runs.
import { FIELD_MAP, STATES } from "./fields";
import type { Answer, FieldKey } from "./types";

export type Extracted = Partial<Record<FieldKey, Answer>>;

const DEVANAGARI_DIGITS = "०१२३४५६७८९";

/** Normalise digits and spacing, and drop any 9+ digit run (Aadhaar, bank, ration card numbers). */
export function sanitize(raw: string): string {
  return raw
    .replace(/[०-९]/g, (d) => String(DEVANAGARI_DIGITS.indexOf(d)))
    .replace(/\b\d{4}[ -]?\d{4}[ -]?\d{4}\b/g, " ") // Aadhaar-shaped (1234 5678 9012)
    .replace(/\d{9,}/g, " ") // account / card numbers
    .replace(/[ \t]+/g, " ")
    .toLowerCase();
}

function bucket(key: FieldKey, n: number): string | undefined {
  const def = FIELD_MAP[key];
  if (def.kind !== "range") return undefined;
  return def.options.find((o) => o.range && n >= o.range[0] && n <= o.range[1])?.id;
}

function ageFrom(text: string, now: Date): number | undefined {
  const dob = text.match(
    /(?:dob|d\.o\.b|date of birth|birth date|जन्म\s*(?:तिथि|तारीख|दिनांक))[^0-9]{0,25}(\d{1,2})\s*[/\-.]\s*(\d{1,2})\s*[/\-.]\s*(\d{4})/,
  );
  if (dob) {
    const [d, m, y] = [Number(dob[1]), Number(dob[2]), Number(dob[3])];
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12) {
      let age = now.getFullYear() - y;
      if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age--;
      if (age >= 0 && age <= 120) return age;
    }
  }
  const yob = text.match(/(?:year of birth|yob|जन्म\s*वर्ष)[^0-9]{0,15}(\d{4})/);
  if (yob) {
    const age = now.getFullYear() - Number(yob[1]);
    if (age >= 0 && age <= 120) return age;
  }
  const age = text.match(/(?:\bage\b|आयु|उम्र)[^0-9]{0,10}(\d{1,3})\s*(?:years|yrs|वर्ष|साल)?/);
  if (age) {
    const n = Number(age[1]);
    if (n > 0 && n <= 120) return n;
  }
  return undefined;
}

/** Only answer gender when the document names exactly one (a ration card lists the whole family). */
function genderFrom(text: string): string | undefined {
  const found = new Set<string>();
  if (/\bfemale\b|महिला|स्त्री/.test(text)) found.add("female");
  if (/\bmale\b|पुरुष/.test(text)) found.add("male");
  if (/transgender|ट्रांसजेंडर|किन्नर/.test(text)) found.add("transgender");
  return found.size === 1 ? [...found][0] : undefined;
}

function categoryFrom(text: string): string | undefined {
  if (/scheduled tribe|अनुसूचित\s*जनजाति/.test(text)) return "st";
  if (/scheduled caste|अनुसूचित\s*जाति/.test(text)) return "sc";
  if (/other backward|\bobc\b|पिछड़ा\s*वर्ग|पिछडा\s*वर्ग/.test(text)) return "obc";
  if (/economically weaker|\bews\b|आर्थिक\s*रूप\s*से\s*कमज़?ोर/.test(text)) return "general";
  return undefined;
}

function rationFrom(text: string): string | undefined {
  if (/antyodaya|अंत्योदय|अन्त्योदय|\baay\b/.test(text)) return "aay";
  if (/\bphh\b|priority household|पात्र\s*गृहस्थी|प्राथमिकता\s*(?:वाले)?\s*परिवार|\bbpl\b|गरीबी\s*रेखा\s*से\s*नीचे/.test(text)) return "phh";
  if (/\bapl\b|गरीबी\s*रेखा\s*से\s*ऊपर/.test(text)) return "none";
  return undefined;
}

function incomeFrom(text: string): number | undefined {
  const lakh = text.match(/(?:income|आय)[^0-9]{0,40}(\d+(?:\.\d+)?)\s*(?:lakh|lac|लाख)/);
  if (lakh) return Math.round(Number(lakh[1]) * 100000);
  const m = text.match(/(?:annual income|family income|income|वार्षिक\s*आय|कुल\s*आय|आय)[^0-9]{0,40}(\d{1,3}(?:,\d{2,3})+|\d{4,8})(?:\.\d+)?/);
  if (!m) return undefined;
  const n = Number(m[1].replace(/,/g, ""));
  return n >= 1000 && n <= 1e8 ? n : undefined;
}

function disabilityFrom(text: string): number | undefined {
  if (!/disab|दिव्यांग|विकलांग|udid/.test(text)) return undefined;
  const m = text.match(/(\d{1,3})\s*%/) ?? text.match(/(\d{1,3})\s*(?:percent|प्रतिशत)/);
  if (!m) return undefined;
  const n = Number(m[1]);
  return n >= 1 && n <= 100 ? n : undefined;
}

function stateFrom(text: string): string | undefined {
  const aliases: Record<string, string[]> = { OD: ["orissa", "उड़ीसा"], UK: ["uttaranchal"], TS: ["telengana"] };
  const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\&]/g, "\\$&");
  // \b only works for Latin script, so Devanagari names use a plain substring match.
  const has = (n: string) => (/^[\x00-\x7f]+$/.test(n) ? new RegExp(`\\b${esc(n.toLowerCase())}\\b`).test(text) : text.includes(n));
  const found = STATES.filter((s) => [s.name.en, s.name.hi, ...(aliases[s.code] ?? [])].some(has)).map((s) => s.code);
  // A document can name two states (issuing office and address). Only trust a single hit.
  return found.length === 1 ? found[0] : undefined;
}

function areaFrom(text: string): string | undefined {
  const rural = /\bvillage\b|\bvill\.|ग्राम\s*पंचायत|\bgram panchayat\b|ग्राम[:\s]/.test(text);
  const urban = /municipal|nagar nigam|नगर\s*निगम|नगर\s*पालिका|\bward no/.test(text);
  if (rural && !urban) return "rural";
  if (urban && !rural) return "urban";
  return undefined;
}

/** Profile answers found in OCR text. Only fields it is confident about are returned. */
export function extractFromText(raw: string, now = new Date()): Extracted {
  const text = sanitize(raw);
  const out: Extracted = {};
  const age = ageFrom(text, now);
  if (age !== undefined) out.age = age;
  const gender = genderFrom(text);
  if (gender) out.gender = gender;
  const category = categoryFrom(text);
  if (category) out.category = category;
  const ration = rationFrom(text);
  if (ration) out.rationCard = ration;
  const income = incomeFrom(text);
  if (income !== undefined) out.income = bucket("income", income);
  const disability = disabilityFrom(text);
  if (disability !== undefined) out.disability = bucket("disability", disability);
  const state = stateFrom(text);
  if (state) out.state = state;
  const area = areaFrom(text);
  if (area) out.area = area;
  for (const k of Object.keys(out) as FieldKey[]) if (out[k] === undefined) delete out[k];
  return out;
}
