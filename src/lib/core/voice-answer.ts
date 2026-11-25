// Turns a spoken answer (speech-recognition transcript) into a form answer. Pure, no I/O.
// Handles numbers ("35", "thirty five"), amounts ("50 हज़ार", "1.5 lakh a year", "8000 a month"),
// yes/no in several languages, and option names with common synonyms ("kisan", "गाँव", "BPL").
import type { FieldDef } from "./fields";
import type { Answer, Lang } from "./types";

export type VoiceResult = { value: Answer } | { skip: true } | null;

const DIGITS: [number, number][] = [
  [0x0966, 0x096f], // Devanagari
  [0x09e6, 0x09ef], // Bengali
  [0x0be6, 0x0bef], // Tamil
];

export function normalize(s: string): string {
  let out = "";
  for (const ch of s.toLowerCase()) {
    const c = ch.codePointAt(0)!;
    const block = DIGITS.find(([a, b]) => c >= a && c <= b);
    out += block ? String(c - block[0]) : ch;
  }
  return out.replace(/[,]/g, "").replace(/\s+/g, " ").trim();
}

const UNITS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
};
const TENS: Record<string, number> = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };

/** First number in the text: digits ("35", "1.5") or English words ("thirty five", "a hundred"). */
export function firstNumber(text: string): number | undefined {
  const d = text.match(/\d+(?:\.\d+)?/);
  if (d) return Number(d[0]);
  const words = text.split(/[\s-]+/);
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (w in TENS) return TENS[w] + (UNITS[words[i + 1]] && UNITS[words[i + 1]] < 10 ? UNITS[words[i + 1]] : 0);
    if (w in UNITS) return UNITS[w];
    if (w === "hundred") return 100;
  }
  return undefined;
}

const LAKH = /lakh|lac|लाख|লাখ|லட்சம்|लक्ष/;
const THOUSAND = /thousand|hazaar|hazar|हज़ार|हजार|হাজার|ஆயிரம்/;
const MONTH = /month|mahina|mahine|महीना|महीने|महिना|মাস|மாதம்|मासिक/;

/** Rupee amount per year from speech, e.g. "50 हज़ार", "1.5 lakh", "8000 a month". */
export function spokenAmount(text: string): number | undefined {
  const n = firstNumber(text);
  if (n === undefined) return undefined;
  let amount = LAKH.test(text) ? n * 100000 : THOUSAND.test(text) ? n * 1000 : n;
  if (amount < 1000) return undefined; // a bare "5" is too ambiguous to be money
  if (MONTH.test(text)) amount *= 12;
  return amount;
}

const SKIP = /\bskip\b|don'?t know|do not know|not sure|pata nahi|pata nahin|पता नहीं|मालूम नहीं|नहीं पता|छोड़|জানি না|माहीत नाही|माहिती नाही|தெரியாது|தெரியலை/;
// \b only understands Latin letters, so short Indic words use whitespace boundaries instead.
const YES = /\b(yes|yeah|yep|haan|han|ha|ji)\b|हाँ|हां|होय|(?:^|\s)हो(?:\s|$)|হ্যাঁ|হাঁ|ஆம்|ஆமா/;
const NO = /\b(no|nope|nahi|nahin|na)\b|नहीं|नही|नाही|(?:^|\s)ना(?:\s|$)|না|নেই|இல்லை|இல்ல/;

/** Extra words people say for an option, beyond its printed label. */
const SYNONYMS: Record<string, Record<string, string[]>> = {
  area: { rural: ["village", "gaon", "gaanv", "गाँव", "गांव", "ग्राम", "देहात", "গ্রাম", "गाव", "கிராமம்"], urban: ["city", "town", "shahar", "शहर", "कस्बा", "नगर", "শহর", "शहरात", "நகரம்"] },
  gender: {
    female: ["woman", "female", "lady", "mahila", "aurat", "महिला", "औरत", "स्त्री", "মহিলা", "মেয়ে", "स्त्री", "பெண்"],
    male: ["man", "male", "purush", "aadmi", "पुरुष", "आदमी", "পুরুষ", "पुरुष", "ஆண்"],
    transgender: ["transgender", "kinnar", "किन्नर", "ट्रांसजेंडर", "হিজড়া", "திருநங்கை"],
  },
  category: {
    sc: ["sc", "scheduled caste", "अनुसूचित जाति", "dalit", "दलित", "তফসিলি জাতি", "अनुसूचित जाती", "பட்டியல் சாதி"],
    st: ["st", "tribe", "tribal", "adivasi", "जनजाति", "आदिवासी", "উপজাতি", "आदिवासी", "பழங்குடி"],
    obc: ["obc", "backward", "पिछड़ा", "पिछड़ी", "ओबीसी", "অনগ্রসর", "इतर मागास", "பிற்படுத்தப்பட்ட"],
    general: ["general", "ews", "सामान्य", "जनरल", "সাধারণ", "खुला", "பொது"],
  },
  rationCard: {
    aay: ["antyodaya", "aay", "अंत्योदय", "अन्त्योदय", "অন্ত্যোদয়", "அந்தியோதயா"],
    phh: ["bpl", "phh", "priority", "बीपीएल", "गरीबी", "पात्र गृहस्थी", "प्राथमिकता", "বিপিএল", "प्राधान्य", "முன்னுரிமை"],
    none: ["apl", "no card", "कोई कार्ड नहीं", "कार्ड नहीं", "এপিএল", "कार्ड नाही", "அட்டை இல்லை"],
  },
  maritalStatus: {
    married: ["married", "shaadi", "शादीशुदा", "विवाहित", "বিবাহিত", "विवाहित", "திருமணமான"],
    unmarried: ["unmarried", "single", "not married", "अविवाहित", "कुंवारा", "कुंवारी", "অবিবাহিত", "अविवाहित", "திருமணமாகாத"],
    widowed: ["widow", "widower", "विधवा", "विधुर", "বিধবা", "विधवा", "விதவை"],
    separated: ["divorced", "separated", "talaq", "तलाक", "अलग", "তালাক", "घटस्फोट", "விவாகரத்து"],
  },
  house: {
    pucca: ["pucca", "pakka", "पक्का", "पक्के", "পাকা", "पक्के घर", "கான்கிரீட்"],
    kutcha: ["kutcha", "kachcha", "kaccha", "कच्चा", "मिट्टी", "छप्पर", "কাঁচা", "कच्चे", "குடிசை"],
    none: ["rented", "rent", "kiraya", "किराए", "किराये", "भाड़े", "ভাড়া", "भाड्याने", "வாடகை"],
  },
  occupation: {
    farmer: ["farmer", "kisan", "किसान", "खेती", "कृषक", "কৃষক", "शेतकरी", "விவசாயி"],
    tenant_farmer: ["batai", "बटाई", "ठेके", "rented land", "বর্গা", "कुळ", "குத்தகை"],
    agri_labourer: ["farm labourer", "khet mazdoor", "खेत मज़दूर", "खेत मजदूर", "खेतिहर", "ক্ষেতমজুর", "शेतमजूर", "விவசாயக் கூலி"],
    daily_wage: ["daily", "dihadi", "labour", "labourer", "mazdoor", "दिहाड़ी", "मज़दूरी", "मजदूरी", "construction", "দিনমজুর", "मजूर", "கூலி"],
    street_vendor: ["vendor", "hawker", "rehdi", "thela", "रेहड़ी", "ठेला", "फेरी", "হকার", "फेरीवाला", "தெருவோர"],
    artisan: ["carpenter", "tailor", "potter", "weaver", "lohar", "बढ़ई", "दर्ज़ी", "दर्जी", "कुम्हार", "कारीगर", "बुनकर", "কারিগর", "कारागीर", "கைவினை"],
    fisher: ["fisher", "fisherman", "fish", "मछुआरा", "मछली", "জেলে", "मच्छीमार", "மீனவர்"],
    livestock: ["dairy", "cattle", "goat", "पशु", "डेयरी", "गाय", "भैंस", "बकरी", "পশুপালন", "पशुपालन", "கால்நடை"],
    self_employed: ["shop", "business", "dukan", "दुकान", "व्यापार", "धंधा", "দোকান", "व्यवसाय", "கடை"],
    private_job: ["private", "company", "प्राइवेट", "निजी", "প্রাইভেট", "खाजगी", "தனியார்"],
    govt_job: ["government", "sarkari", "सरकारी", "সরকারি", "सरकारी नोकरी", "அரசு"],
    student: ["student", "studying", "padhai", "विद्यार्थी", "छात्र", "पढ़ाई", "ছাত্র", "विद्यार्थी", "மாணவர்"],
    homemaker: ["housewife", "homemaker", "गृहिणी", "घर का काम", "গৃহিণী", "गृहिणी", "இல்லத்தரசி"],
    unemployed: ["unemployed", "no work", "jobless", "बेरोज़गार", "बेरोजगार", "कोई काम नहीं", "বেকার", "बेरोजगार", "வேலையில்லை"],
    retired: ["retired", "old", "रिटायर", "सेवानिवृत्त", "बुज़ुर्ग", "অবসর", "निवृत्त", "ஓய்வு"],
  },
  education: {
    college: ["college", "iti", "diploma", "graduation", "कॉलेज", "कालेज", "डिप्लोमा", "কলেজ", "महाविद्यालय", "கல்லூரி"],
    none: ["not studying", "no study", "पढ़ाई नहीं", "नहीं पढ़", "পড়ি না", "शिकत नाही", "படிக்கவில்லை"],
  },
};

const tokens = (s: string) => (s.match(/[\p{L}\p{M}\p{N}]+/gu) ?? []).filter((w) => w.length >= 2);

function matchOption(def: FieldDef & { options: { id: string; label: Record<string, string | undefined> }[] }, text: string, lang: Lang): string | undefined {
  // Phrases per option: printed labels (current language, English, Hindi) plus synonyms.
  const phrases = def.options.map((o) => [o.label[lang], o.label.en, o.label.hi, ...(SYNONYMS[def.key]?.[o.id] ?? [])].filter(Boolean).map((p) => normalize(p!)));
  // 1) Whole synonym / label phrase heard: strongest signal. Prefer the longest phrase.
  let best: { id: string; len: number } | undefined;
  let tie = false;
  def.options.forEach((o, i) => {
    for (const p of phrases[i]) {
      const hit = /^[\x00-\x7f]+$/.test(p) ? new RegExp(`\\b${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(text) : text.includes(p);
      if (!hit) continue;
      if (!best || p.length > best.len) {
        tie = best !== undefined && best.id !== o.id && p.length === best.len;
        best = { id: o.id, len: p.length };
      } else if (p.length === best.len && best.id !== o.id) tie = true;
    }
  });
  if (best && !tie) return best.id;
  // 2) Distinctive label words (words used by only one option).
  const words = phrases.map((ps) => new Set(ps.flatMap(tokens)));
  const counts = new Map<string, number>();
  for (const set of words) for (const w of set) counts.set(w, (counts.get(w) ?? 0) + 1);
  const heard = new Set(tokens(text));
  const scores = words.map((set) => [...set].filter((w) => counts.get(w) === 1 && (heard.has(w) || (!/^[\x00-\x7f]+$/.test(w) && text.includes(w)))).length);
  const top = Math.max(...scores);
  if (top === 0 || scores.filter((s) => s === top).length > 1) return undefined;
  return def.options[scores.indexOf(top)].id;
}

function inRange(def: FieldDef, n: number): string | undefined {
  if (def.kind !== "range") return undefined;
  return def.options.find((o) => o.range && n >= o.range[0] && n <= o.range[1])?.id;
}

/** Best answer for one question from a transcript ("a | b | c" = recogniser alternatives). */
export function matchSpoken(def: FieldDef, transcript: string, lang: Lang): VoiceResult {
  for (const alt of transcript.split("|").map(normalize).filter(Boolean)) {
    if (SKIP.test(alt)) return { skip: true };

    if (def.kind === "bool") {
      const yes = YES.test(alt);
      const no = NO.test(alt);
      if (yes !== no) return { value: yes };
      continue;
    }

    if (def.kind === "number") {
      const n = firstNumber(alt);
      if (n !== undefined && n >= def.min && n <= def.max) return { value: Math.round(n) };
      continue;
    }

    if (def.kind === "range") {
      if (def.unit === "rupees") {
        const amt = spokenAmount(alt);
        const id = amt !== undefined ? inRange(def, amt) : undefined;
        if (id) return { value: id };
      } else if (def.unit === "percent") {
        const n = firstNumber(alt);
        if (n !== undefined && n > 0) {
          const id = inRange(def, n);
          if (id) return { value: id };
        }
        if (NO.test(alt)) return { value: "none" };
      } else if (def.unit === "hectares") {
        const n = firstNumber(alt);
        if (n !== undefined) {
          const ha = /hectare|हेक्टेयर|হেক্টর|ஹெக்டேர்/.test(alt) ? n : n / 2.47; // acres by default
          const id = n === 0 ? "none" : inRange(def, Math.max(ha, 0.01));
          if (id) return { value: id };
        }
        if (NO.test(alt)) return { value: "none" };
      }
    }

    if (def.key === "education") {
      const n = firstNumber(alt);
      if (n !== undefined && n >= 1 && n <= 12) return { value: n <= 8 ? "class1to8" : n <= 10 ? "class9to10" : "class11to12" };
    }

    if (def.kind === "enum" || def.kind === "range") {
      const id = matchOption(def as never, alt, lang);
      if (id) return { value: id };
    }
  }
  return null;
}
