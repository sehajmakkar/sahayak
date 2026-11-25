// Yojana Setu WhatsApp bot: the same eligibility flow as the website, as a chat.
//
// Stateless by design (no database, nothing stored about the user): every button and list row
// carries the answers so far in its reply id, e.g. "0|en~st=UP~ar=rural~ag=2". WhatsApp sends that id
// back when the user taps, so the next question can be worked out from the id alone.
// Pure module: input is what the user sent, output is the messages to send back.
import { CATEGORY_INFO, CHANNEL_INFO, DOCUMENTS } from "../core/labels";
import { FIELD_MAP, STATES } from "../core/fields";
import { scoreMatch, type Match } from "../core/match";
import { evaluate } from "../core/rules";
import { CATEGORIES, type Answer, type Category, type FieldKey, type Lang, type Profile, type Text } from "../core/types";
import { reasonsFor } from "../explain";
import { isOfficialUrl, SCHEME_BY_ID, SCHEMES } from "../schemes";

// ---------- Outgoing message shapes (mapped to the Cloud API in cloud.ts) ----------
export type Row = { id: string; title: string; description?: string };
export type OutMsg =
  | { type: "text"; body: string }
  | { type: "buttons"; body: string; buttons: { id: string; title: string }[] }
  | { type: "list"; body: string; button: string; rows: Row[] };

/** What the user sent: a tapped reply id, or typed text. */
export type InMsg = { kind: "reply"; id: string } | { kind: "text"; text: string };

// WhatsApp limits.
const ROW_TITLE = 24;
const ROW_DESC = 72;
const BUTTON_TITLE = 20;
const MAX_ROWS = 10;
const TOP_N = 5;

const cut = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, n - 1).trimEnd()}…`);

// ---------- Conversation state ----------
type Key = "st" | "ar" | "ag" | "g" | "c" | "in" | "oc" | "rc" | "ms" | "nd";
/** The bot speaks English and Hindi. */
type BotLang = Extract<Lang, "en" | "hi">;
type State = { lang: BotLang; a: Partial<Record<Key, string>> };
const SKIP = "_";

export function encode(s: State): string {
  return [s.lang, ...Object.entries(s.a).map(([k, v]) => `${k}=${v}`)].join("~");
}
export function decode(raw: string): State | null {
  const [lang, ...pairs] = raw.split("~");
  if (lang !== "en" && lang !== "hi") return null;
  const a: State["a"] = {};
  for (const p of pairs) {
    const [k, v] = p.split("=");
    if (k && v) a[k as Key] = v;
  }
  return { lang, a };
}

// ---------- Questions ----------
type Opt = { id: string; label: Text };
const opts = (key: FieldKey): Opt[] => {
  const d = FIELD_MAP[key];
  return d.kind === "enum" || d.kind === "range" ? d.options.map((o) => ({ id: o.id, label: o.label })) : [];
};

/** Age bands. A scheme only counts as a pass if it passes for the whole band. */
const AGE_BANDS: { id: string; lo: number; hi: number; label: Text }[] = [
  { id: "0", lo: 10, hi: 17, label: { en: "Under 18", hi: "18 से कम" } },
  { id: "1", lo: 18, hi: 39, label: { en: "18 – 39", hi: "18 – 39" } },
  { id: "2", lo: 40, hi: 59, label: { en: "40 – 59", hi: "40 – 59" } },
  { id: "3", lo: 60, hi: 79, label: { en: "60 – 79", hi: "60 – 79" } },
  { id: "4", lo: 80, hi: 110, label: { en: "80 or older", hi: "80 या ज़्यादा" } },
];

/** Most populous states first, so most people find theirs without paging; then the rest A–Z. */
const BIG_STATES = ["UP", "MH", "BR", "WB", "MP", "TN", "RJ", "KA"];
const STATE_OPTIONS: Opt[] = [
  ...BIG_STATES.map((c) => STATES.find((s) => s.code === c)!),
  ...STATES.filter((s) => !BIG_STATES.includes(s.code)),
].map((s) => ({ id: s.code, label: s.name }));

type Question = { key: Key; ask: Text; options: Opt[]; showIf?: (a: State["a"]) => boolean };

const QUESTIONS: Question[] = [
  { key: "st", ask: { en: "Which state do you live in?", hi: "आप किस राज्य में रहते हैं?" }, options: STATE_OPTIONS },
  { key: "ar", ask: FIELD_MAP.area.question, options: opts("area") },
  { key: "ag", ask: { en: "How old are you?", hi: "आपकी उम्र कितनी है?" }, options: AGE_BANDS },
  { key: "g", ask: FIELD_MAP.gender.question, options: opts("gender") },
  { key: "c", ask: FIELD_MAP.category.question, options: opts("category") },
  { key: "in", ask: FIELD_MAP.income.question, options: opts("income") },
  { key: "oc", ask: FIELD_MAP.occupation.question, options: opts("occupation") },
  { key: "rc", ask: FIELD_MAP.rationCard.question, options: opts("rationCard") },
  { key: "ms", ask: FIELD_MAP.maritalStatus.question, options: opts("maritalStatus"), showIf: (a) => a.ag !== "0" },
  {
    key: "nd",
    ask: { en: "What do you most need help with?", hi: "आपको सबसे ज़्यादा किस चीज़ में मदद चाहिए?" },
    options: CATEGORIES.map((c) => ({ id: c, label: CATEGORY_INFO[c].label })),
  },
];

const T = {
  welcome: {
    en: "Namaste! I'm *Yojana Setu*. I help you find government schemes you may be eligible for.\n\nAnswer a few quick questions by tapping. You can skip any question. I never ask for Aadhaar, bank or OTP details.\n\nChoose your language:",
    hi: "नमस्ते! मैं *योजना सेतु* हूँ। मैं आपको वे सरकारी योजनाएँ ढूँढने में मदद करता हूँ जिनके आप पात्र हो सकते हैं।\n\nकुछ आसान सवालों के जवाब टैप करके दें। कोई भी सवाल छोड़ सकते हैं। हम आधार, बैंक या OTP कभी नहीं माँगते।\n\nअपनी भाषा चुनें:",
  },
  choose: { en: "Choose", hi: "चुनें" },
  skip: { en: "Skip / Don't know", hi: "छोड़ें / पता नहीं" },
  more: { en: "More options", hi: "और विकल्प" },
  step: { en: "Question", hi: "सवाल" },
  of: { en: "of", hi: "/" },
  resultsHead: {
    en: "Here are the schemes you *may be eligible* for. Final eligibility is decided by the department.",
    hi: "ये योजनाएँ आपके लिए हो सकती हैं (*पात्र हो सकते हैं*)। अंतिम पात्रता संबंधित विभाग तय करता है।",
  },
  why: { en: "Why", hi: "क्यों" },
  confirm: { en: "To confirm", hi: "पुष्टि करें" },
  noResults: {
    en: "No schemes matched these answers. Try again and skip the questions you're unsure about.",
    hi: "इन जवाबों से कोई योजना मेल नहीं खाई। फिर से कोशिश करें और जिन सवालों पर पक्का न हों उन्हें छोड़ दें।",
  },
  pickDetail: { en: "Tap a scheme for documents and how to apply.", hi: "दस्तावेज़ और आवेदन का तरीका जानने के लिए योजना पर टैप करें।" },
  viewSchemes: { en: "View schemes", hi: "योजनाएँ देखें" },
  restart: { en: "Start over", hi: "फिर से शुरू करें" },
  restartDesc: { en: "Answer the questions again", hi: "सवाल फिर से दें" },
  benefit: { en: "Benefit", hi: "लाभ" },
  documents: { en: "Documents", hi: "दस्तावेज़" },
  where: { en: "Where to apply", hi: "आवेदन कहाँ करें" },
  apply: { en: "Apply (official site)", hi: "आवेदन (आधिकारिक साइट)" },
  helpline: { en: "Helpline", hi: "हेल्पलाइन" },
  verify: {
    en: "Amounts and rules can change. Confirm on the official site before applying. Yojana Setu is free: never pay anyone to apply.",
    hi: "राशि और नियम बदल सकते हैं। आवेदन से पहले आधिकारिक साइट पर पुष्टि करें। योजना सेतु मुफ़्त है: आवेदन के लिए किसी को पैसे न दें।",
  },
  whatNext: { en: "What would you like to do next?", hi: "आगे क्या करना चाहेंगे?" },
  back: { en: "Back to my schemes", hi: "मेरी योजनाएँ" },
  unknownScheme: { en: "Sorry, I couldn't find that scheme.", hi: "माफ़ कीजिए, वह योजना नहीं मिली।" },
} satisfies Record<string, Text>;

// ---------- Matching (same engine as the website) ----------
export function toProfile(a: State["a"]): { profile: Profile; band?: (typeof AGE_BANDS)[number] } {
  const answers: Profile["answers"] = {};
  const set = (k: FieldKey, v: string | undefined) => {
    if (v && v !== SKIP) answers[k] = v as Answer;
  };
  set("state", a.st);
  set("area", a.ar);
  set("gender", a.g);
  set("category", a.c);
  set("income", a.in);
  set("occupation", a.oc);
  set("rationCard", a.rc);
  set("maritalStatus", a.ms);
  const needs = a.nd && a.nd !== SKIP ? [a.nd as Category] : [];
  return { profile: { answers, needs, done: true }, band: AGE_BANDS.find((b) => b.id === a.ag) };
}

export function matchState(a: State["a"]): Match[] {
  const { profile, band } = toProfile(a);
  const withAge = (age?: number): Profile => ({ ...profile, answers: age === undefined ? profile.answers : { ...profile.answers, age } });
  const out: Match[] = [];
  for (const scheme of SCHEMES) {
    let result = evaluate(scheme.eligibility, withAge(band?.lo));
    if (band) {
      const hi = evaluate(scheme.eligibility, withAge(band.hi));
      if (result.status === "fail" && hi.status === "fail") continue;
      // The band straddles an age limit: treat age as "needs confirming".
      if (result.status !== hi.status) result = evaluate(scheme.eligibility, withAge(undefined));
    }
    if (result.status === "fail") continue;
    const { score, needMatch } = scoreMatch(scheme, result, profile.needs);
    out.push({ scheme, status: result.status === "pass" ? "likely" : "maybe", result, score, needMatch });
  }
  return out.sort((x, y) => y.score - x.score);
}

// ---------- Message builders ----------
const langButtons = (): OutMsg => ({
  type: "buttons",
  body: `${T.welcome.en}\n\n${T.welcome.hi}`,
  buttons: [
    { id: "0|en", title: "English" },
    { id: "0|hi", title: "हिंदी" },
  ],
});

function nextQuestion(s: State): Question | undefined {
  return QUESTIONS.find((q) => s.a[q.key] === undefined && (!q.showIf || q.showIf(s.a)));
}

function askQuestion(s: State, q: Question, page: number): OutMsg {
  const L = s.lang;
  const visible = QUESTIONS.filter((x) => !x.showIf || x.showIf(s.a));
  const n = visible.indexOf(q) + 1;
  const body = `${T.step[L]} ${n} ${T.of[L]} ${visible.length}\n*${q.ask[L]}*`;
  const answer = (v: string) => `0|${encode({ lang: L, a: { ...s.a, [q.key]: v } })}`;

  // Room for options on one page: 10 rows, minus "Skip", minus "More" if it doesn't all fit.
  const fitsOnOne = q.options.length + 1 <= MAX_ROWS;
  const per = fitsOnOne ? q.options.length : MAX_ROWS - 2;
  const pageOpts = q.options.slice(page * per, page * per + per);
  const hasMore = (page + 1) * per < q.options.length;

  const rows: Row[] = pageOpts.map((o) => {
    const label = o.label[L];
    return { id: answer(o.id), title: cut(label, ROW_TITLE), description: label.length > ROW_TITLE ? cut(label, ROW_DESC) : undefined };
  });
  if (hasMore) rows.push({ id: `${page + 1}|${encode(s)}`, title: cut(T.more[L], ROW_TITLE) });
  rows.push({ id: answer(SKIP), title: cut(T.skip[L], ROW_TITLE) });

  // Short questions read better as buttons (max 3).
  if (rows.length <= 3 && !hasMore) return { type: "buttons", body, buttons: rows.map((r) => ({ id: r.id, title: cut(r.title, BUTTON_TITLE) })) };
  return { type: "list", body, button: cut(T.choose[L], BUTTON_TITLE), rows };
}

function results(s: State): OutMsg[] {
  const L = s.lang;
  const top = matchState(s.a).slice(0, TOP_N);
  const restartRow: Row = { id: `r|${L}`, title: cut(T.restart[L], ROW_TITLE), description: T.restartDesc[L] };
  if (top.length === 0) return [{ type: "list", body: T.noResults[L], button: cut(T.choose[L], BUTTON_TITLE), rows: [restartRow] }];

  const lines = top.map((m, i) => {
    const { why, confirm } = reasonsFor(m, L);
    const parts = [`*${i + 1}. ${m.scheme.name[L]}*`, m.scheme.benefit[L]];
    if (why.length) parts.push(`${T.why[L]}: ${why.slice(0, 3).join("; ")}`);
    if (confirm.length) parts.push(`${T.confirm[L]}: ${confirm.slice(0, 2).join("; ")}`);
    return parts.join("\n");
  });
  const state = encode(s);
  return [
    { type: "text", body: [T.resultsHead[L], ...lines].join("\n\n") },
    {
      type: "list",
      body: T.pickDetail[L],
      button: cut(T.viewSchemes[L], BUTTON_TITLE),
      rows: [
        ...top.map((m) => ({ id: `d|${m.scheme.id}|${state}`, title: cut(m.scheme.name[L], ROW_TITLE), description: cut(m.scheme.benefit[L], ROW_DESC) })),
        restartRow,
      ],
    },
  ];
}

function detail(schemeId: string, s: State): OutMsg[] {
  const L = s.lang;
  const sc = SCHEME_BY_ID[schemeId];
  if (!sc) return [{ type: "text", body: T.unknownScheme[L] }];
  const parts = [`*${sc.name[L]}*`, `${T.benefit[L]}: ${sc.benefit[L]}`, sc.description[L]];
  const docs = sc.documents.map((d) => `• ${DOCUMENTS[d]?.[L] ?? d}`);
  if (docs.length) parts.push(`*${T.documents[L]}*\n${docs.join("\n")}`);
  parts.push(`*${T.where[L]}*\n${sc.channels.map((c) => `• ${CHANNEL_INFO[c].label[L]}`).join("\n")}`);
  if (isOfficialUrl(sc.applyUrl)) parts.push(`*${T.apply[L]}*\n${sc.applyUrl}`);
  if (sc.helpline) parts.push(`${T.helpline[L]}: ${sc.helpline}`);
  parts.push(`_${T.verify[L]}_`);
  return [
    { type: "text", body: parts.join("\n\n").slice(0, 4096) },
    {
      type: "buttons",
      body: T.whatNext[L],
      buttons: [
        { id: `x|${encode(s)}`, title: cut(T.back[L], BUTTON_TITLE) },
        { id: `r|${L}`, title: cut(T.restart[L], BUTTON_TITLE) },
      ],
    },
  ];
}

/** Advance the conversation from a reply id. */
function fromState(s: State, page = 0): OutMsg[] {
  const q = nextQuestion(s);
  return q ? [askQuestion(s, q, page)] : results(s);
}

export function handleIncoming(msg: InMsg): OutMsg[] {
  if (msg.kind === "text") return [langButtons()];

  const [head, ...rest] = msg.id.split("|");
  if (head === "r") {
    const lang = rest[0] === "hi" ? "hi" : "en";
    return fromState({ lang, a: {} });
  }
  if (head === "d") {
    const s = decode(rest.slice(1).join("|"));
    return s ? detail(rest[0], s) : [langButtons()];
  }
  if (head === "x") {
    const s = decode(rest.join("|"));
    return s ? results(s) : [langButtons()];
  }
  const page = Number(head);
  const s = decode(rest.join("|"));
  if (!Number.isInteger(page) || page < 0 || !s) return [langButtons()];
  return fromState(s, page);
}
