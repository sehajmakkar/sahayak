// Profile fields = the questions we ask. Every field here must be used by at least
// one scheme's eligibility rule (enforced by tests/data.test.ts).
import { WORDS } from "../i18n/words";
import { pick, type Answer, type FieldKey, type Lang, type Profile, type Text } from "./types";

export type Option = {
  id: string;
  label: Text;
  /** Numeric range this option represents, for range fields. */
  range?: [number, number];
};

type Base = {
  key: FieldKey;
  /** Short label used when describing rules, e.g. "Age". */
  label: Text;
  question: Text;
  help?: Text;
  /** Only ask when this returns true. */
  showIf?: (a: Profile["answers"]) => boolean;
  sensitive?: boolean;
  /** Which step of the two-step form this field is on. */
  step: 1 | 2;
};

export type FieldDef =
  | (Base & { kind: "enum"; options: Option[]; dropdown?: boolean })
  | (Base & { kind: "range"; options: Option[]; unit: "rupees" | "hectares" | "percent" })
  | (Base & { kind: "number"; min: number; max: number; unit: "years" })
  | (Base & { kind: "bool"; yesText: Text; noText: Text });

export const STATES: { code: string; name: Text }[] = [
  { code: "AN", name: { en: "Andaman & Nicobar Islands", hi: "अंडमान और निकोबार द्वीपसमूह" } },
  { code: "AP", name: { en: "Andhra Pradesh", hi: "आंध्र प्रदेश" } },
  { code: "AR", name: { en: "Arunachal Pradesh", hi: "अरुणाचल प्रदेश" } },
  { code: "AS", name: { en: "Assam", hi: "असम" } },
  { code: "BR", name: { en: "Bihar", hi: "बिहार" } },
  { code: "CH", name: { en: "Chandigarh", hi: "चंडीगढ़" } },
  { code: "CG", name: { en: "Chhattisgarh", hi: "छत्तीसगढ़" } },
  { code: "DH", name: { en: "Dadra & Nagar Haveli and Daman & Diu", hi: "दादरा और नगर हवेली और दमन और दीव" } },
  { code: "DL", name: { en: "Delhi", hi: "दिल्ली" } },
  { code: "GA", name: { en: "Goa", hi: "गोवा" } },
  { code: "GJ", name: { en: "Gujarat", hi: "गुजरात" } },
  { code: "HR", name: { en: "Haryana", hi: "हरियाणा" } },
  { code: "HP", name: { en: "Himachal Pradesh", hi: "हिमाचल प्रदेश" } },
  { code: "JK", name: { en: "Jammu & Kashmir", hi: "जम्मू और कश्मीर" } },
  { code: "JH", name: { en: "Jharkhand", hi: "झारखंड" } },
  { code: "KA", name: { en: "Karnataka", hi: "कर्नाटक" } },
  { code: "KL", name: { en: "Kerala", hi: "केरल" } },
  { code: "LA", name: { en: "Ladakh", hi: "लद्दाख" } },
  { code: "LD", name: { en: "Lakshadweep", hi: "लक्षद्वीप" } },
  { code: "MP", name: { en: "Madhya Pradesh", hi: "मध्य प्रदेश" } },
  { code: "MH", name: { en: "Maharashtra", hi: "महाराष्ट्र" } },
  { code: "MN", name: { en: "Manipur", hi: "मणिपुर" } },
  { code: "ML", name: { en: "Meghalaya", hi: "मेघालय" } },
  { code: "MZ", name: { en: "Mizoram", hi: "मिज़ोरम" } },
  { code: "NL", name: { en: "Nagaland", hi: "नागालैंड" } },
  { code: "OD", name: { en: "Odisha", hi: "ओडिशा" } },
  { code: "PY", name: { en: "Puducherry", hi: "पुडुचेरी" } },
  { code: "PB", name: { en: "Punjab", hi: "पंजाब" } },
  { code: "RJ", name: { en: "Rajasthan", hi: "राजस्थान" } },
  { code: "SK", name: { en: "Sikkim", hi: "सिक्किम" } },
  { code: "TN", name: { en: "Tamil Nadu", hi: "तमिलनाडु" } },
  { code: "TS", name: { en: "Telangana", hi: "तेलंगाना" } },
  { code: "TR", name: { en: "Tripura", hi: "त्रिपुरा" } },
  { code: "UP", name: { en: "Uttar Pradesh", hi: "उत्तर प्रदेश" } },
  { code: "UK", name: { en: "Uttarakhand", hi: "उत्तराखंड" } },
  { code: "WB", name: { en: "West Bengal", hi: "पश्चिम बंगाल" } },
];

const isFarmer = (a: Profile["answers"]) =>
  a.occupation === undefined || a.occupation === null || ["farmer", "tenant_farmer"].includes(String(a.occupation));
const ageUnknownOr = (a: Profile["answers"], test: (n: number) => boolean) =>
  typeof a.age !== "number" || test(a.age);

export const FIELDS: FieldDef[] = [
  {
    key: "state",
    step: 1,
    kind: "enum",
    dropdown: true,
    label: { en: "State", hi: "राज्य" },
    question: { en: "Which state do you live in?", hi: "आप किस राज्य में रहते हैं?" },
    options: STATES.map((s) => ({ id: s.code, label: s.name })),
  },
  {
    key: "area",
    step: 1,
    kind: "enum",
    label: { en: "Area", hi: "क्षेत्र" },
    question: { en: "Do you live in a village or a town/city?", hi: "आप गाँव में रहते हैं या शहर/कस्बे में?" },
    options: [
      { id: "rural", label: { en: "Village", hi: "गाँव" } },
      { id: "urban", label: { en: "Town / City", hi: "शहर / कस्बा" } },
    ],
  },
  {
    key: "age",
    step: 1,
    kind: "number",
    min: 0,
    max: 120,
    unit: "years",
    label: { en: "Age", hi: "उम्र" },
    question: { en: "How old are you? (in years)", hi: "आपकी उम्र कितनी है? (साल में)" },
  },
  {
    key: "gender",
    step: 1,
    kind: "enum",
    label: { en: "Gender", hi: "लिंग" },
    question: { en: "Are you a woman, man or transgender person?", hi: "आप महिला हैं, पुरुष हैं या ट्रांसजेंडर?" },
    options: [
      { id: "female", label: { en: "Woman", hi: "महिला" } },
      { id: "male", label: { en: "Man", hi: "पुरुष" } },
      { id: "transgender", label: { en: "Transgender", hi: "ट्रांसजेंडर" } },
    ],
  },
  {
    key: "maritalStatus",
    step: 2,
    kind: "enum",
    label: { en: "Marital status", hi: "वैवाहिक स्थिति" },
    question: { en: "Are you married?", hi: "क्या आपकी शादी हुई है?" },
    showIf: (a) => ageUnknownOr(a, (n) => n >= 18),
    options: [
      { id: "unmarried", label: { en: "Not married", hi: "शादी नहीं हुई" } },
      { id: "married", label: { en: "Married", hi: "शादीशुदा" } },
      { id: "widowed", label: { en: "Widow / Widower", hi: "विधवा / विधुर" } },
      { id: "separated", label: { en: "Divorced / Separated", hi: "तलाकशुदा / अलग" } },
    ],
  },
  {
    key: "pregnant",
    step: 2,
    kind: "bool",
    label: { en: "Pregnant or new mother", hi: "गर्भवती या नई माँ" },
    question: { en: "Are you pregnant, or did you have a baby in the last 1 year?", hi: "क्या आप गर्भवती हैं, या पिछले 1 साल में बच्चा हुआ है?" },
    yesText: { en: "Pregnant or new mother", hi: "गर्भवती या नई माँ" },
    noText: { en: "Not pregnant", hi: "गर्भवती नहीं" },
    showIf: (a) => a.gender !== "male" && a.gender !== "transgender" && ageUnknownOr(a, (n) => n >= 15 && n <= 50),
    sensitive: true,
  },
  {
    key: "girlChildUnder10",
    step: 2,
    kind: "bool",
    label: { en: "Daughter under 10", hi: "10 साल से छोटी बेटी" },
    question: { en: "Do you have a daughter younger than 10 years?", hi: "क्या आपकी कोई बेटी 10 साल से छोटी है?" },
    yesText: { en: "Has a daughter under 10", hi: "10 साल से छोटी बेटी है" },
    noText: { en: "No daughter under 10", hi: "10 साल से छोटी बेटी नहीं" },
    showIf: (a) => ageUnknownOr(a, (n) => n >= 18),
  },
  {
    key: "category",
    step: 1,
    kind: "enum",
    label: { en: "Social category", hi: "वर्ग" },
    question: { en: "Which category do you belong to?", hi: "आप किस वर्ग से हैं?" },
    sensitive: true,
    options: [
      { id: "sc", label: { en: "SC (Scheduled Caste)", hi: "अनुसूचित जाति (SC)" } },
      { id: "st", label: { en: "ST (Scheduled Tribe)", hi: "अनुसूचित जनजाति (ST)" } },
      { id: "obc", label: { en: "OBC (Other Backward Class)", hi: "पिछड़ा वर्ग (OBC)" } },
      { id: "general", label: { en: "General / EWS", hi: "सामान्य / EWS" } },
    ],
  },
  {
    key: "minority",
    step: 2,
    kind: "bool",
    label: { en: "Minority community", hi: "अल्पसंख्यक समुदाय" },
    question: {
      en: "Are you from a minority community (Muslim, Christian, Sikh, Buddhist, Jain or Parsi)?",
      hi: "क्या आप अल्पसंख्यक समुदाय (मुस्लिम, ईसाई, सिख, बौद्ध, जैन या पारसी) से हैं?",
    },
    yesText: { en: "From a minority community", hi: "अल्पसंख्यक समुदाय से" },
    noText: { en: "Not from a minority community", hi: "अल्पसंख्यक समुदाय से नहीं" },
    sensitive: true,
  },
  {
    key: "income",
    step: 1,
    kind: "range",
    unit: "rupees",
    label: { en: "Annual family income", hi: "परिवार की सालाना आय" },
    question: { en: "How much does your whole family earn in a year?", hi: "आपके पूरे परिवार की साल भर की कमाई कितनी है?" },
    help: { en: "Total yearly income of all family members. ₹1 lakh a year is about ₹8,300 a month.", hi: "परिवार के सभी सदस्यों की कुल सालाना आय। ₹1 लाख सालाना यानी लगभग ₹8,300 महीना।" },
    sensitive: true,
    options: [
      { id: "below1", range: [0, 100000], label: { en: "Under ₹1 lakh", hi: "₹1 लाख से कम" } },
      { id: "1to2.5", range: [100001, 250000], label: { en: "₹1 – 2.5 lakh", hi: "₹1 – 2.5 लाख" } },
      { id: "2.5to5", range: [250001, 500000], label: { en: "₹2.5 – 5 lakh", hi: "₹2.5 – 5 लाख" } },
      { id: "5to8", range: [500001, 800000], label: { en: "₹5 – 8 lakh", hi: "₹5 – 8 लाख" } },
      { id: "above8", range: [800001, 1e12], label: { en: "Above ₹8 lakh", hi: "₹8 लाख से ज़्यादा" } },
    ],
  },
  {
    key: "rationCard",
    step: 2,
    kind: "enum",
    label: { en: "Ration card", hi: "राशन कार्ड" },
    question: { en: "What kind of ration card does your family have?", hi: "आपके परिवार के पास कौन-सा राशन कार्ड है?" },
    options: [
      { id: "aay", label: { en: "Antyodaya (AAY) card", hi: "अंत्योदय (AAY) कार्ड" } },
      { id: "phh", label: { en: "BPL / Priority household (PHH) card", hi: "बीपीएल / प्राथमिकता (PHH) कार्ड" } },
      { id: "none", label: { en: "No card / APL card", hi: "कोई कार्ड नहीं / APL कार्ड" } },
    ],
  },
  {
    key: "taxPayer",
    step: 2,
    kind: "bool",
    label: { en: "Income tax payer in family", hi: "परिवार में इनकम टैक्स दाता" },
    question: { en: "Does anyone in your family pay income tax?", hi: "क्या आपके परिवार में कोई इनकम टैक्स भरता है?" },
    yesText: { en: "Someone in family pays income tax", hi: "परिवार में कोई इनकम टैक्स भरता है" },
    noText: { en: "No one in family pays income tax", hi: "परिवार में कोई इनकम टैक्स नहीं भरता" },
  },
  {
    key: "occupation",
    step: 1,
    kind: "enum",
    label: { en: "Main occupation", hi: "मुख्य काम" },
    question: { en: "What work do you mainly do?", hi: "आप मुख्य रूप से क्या काम करते हैं?" },
    options: [
      { id: "farmer", label: { en: "Farmer (own land)", hi: "किसान (अपनी ज़मीन)" } },
      { id: "tenant_farmer", label: { en: "Farming on rented / shared land", hi: "बटाई / किराए की ज़मीन पर खेती" } },
      { id: "agri_labourer", label: { en: "Farm labourer", hi: "खेत मज़दूर" } },
      { id: "daily_wage", label: { en: "Daily-wage / construction worker", hi: "दिहाड़ी / निर्माण मज़दूर" } },
      { id: "street_vendor", label: { en: "Street vendor / hawker", hi: "रेहड़ी-पटरी / फेरीवाला" } },
      { id: "artisan", label: { en: "Artisan (carpenter, tailor, potter, etc.)", hi: "कारीगर (बढ़ई, दर्ज़ी, कुम्हार आदि)" } },
      { id: "fisher", label: { en: "Fisher", hi: "मछुआरा" } },
      { id: "livestock", label: { en: "Animal rearing / dairy", hi: "पशुपालन / डेयरी" } },
      { id: "self_employed", label: { en: "Small business / shop", hi: "छोटा व्यापार / दुकान" } },
      { id: "private_job", label: { en: "Private job", hi: "प्राइवेट नौकरी" } },
      { id: "govt_job", label: { en: "Government job", hi: "सरकारी नौकरी" } },
      { id: "student", label: { en: "Student", hi: "विद्यार्थी" } },
      { id: "homemaker", label: { en: "Homemaker", hi: "गृहिणी / घर का काम" } },
      { id: "unemployed", label: { en: "No work right now", hi: "अभी कोई काम नहीं" } },
      { id: "retired", label: { en: "Retired / too old to work", hi: "रिटायर / काम करने की उम्र नहीं" } },
    ],
  },
  {
    key: "land",
    step: 2,
    kind: "range",
    unit: "hectares",
    label: { en: "Farm land", hi: "खेती की ज़मीन" },
    question: { en: "How much farm land is in your family's name?", hi: "आपके परिवार के नाम पर कितनी खेती की ज़मीन है?" },
    showIf: isFarmer,
    options: [
      { id: "none", range: [0, 0], label: { en: "No land in our name", hi: "हमारे नाम पर ज़मीन नहीं" } },
      { id: "small", range: [0.01, 2], label: { en: "Up to 5 acres (2 hectares)", hi: "5 एकड़ (2 हेक्टेयर) तक" } },
      { id: "large", range: [2.01, 1e6], label: { en: "More than 5 acres", hi: "5 एकड़ से ज़्यादा" } },
    ],
  },
  {
    key: "education",
    step: 2,
    kind: "enum",
    label: { en: "Current studies", hi: "अभी की पढ़ाई" },
    question: { en: "Are you studying right now? Which class?", hi: "क्या आप अभी पढ़ाई कर रहे हैं? किस कक्षा में?" },
    showIf: (a) => a.occupation === "student" || ageUnknownOr(a, (n) => n <= 30),
    options: [
      { id: "class1to8", label: { en: "Class 1 – 8", hi: "कक्षा 1 – 8" } },
      { id: "class9to10", label: { en: "Class 9 – 10", hi: "कक्षा 9 – 10" } },
      { id: "class11to12", label: { en: "Class 11 – 12", hi: "कक्षा 11 – 12" } },
      { id: "college", label: { en: "College / ITI / Diploma", hi: "कॉलेज / ITI / डिप्लोमा" } },
      { id: "none", label: { en: "Not studying", hi: "पढ़ाई नहीं कर रहे" } },
    ],
  },
  {
    key: "disability",
    step: 2,
    kind: "range",
    unit: "percent",
    label: { en: "Disability", hi: "दिव्यांगता" },
    question: { en: "Do you have a disability?", hi: "क्या आप दिव्यांग हैं?" },
    help: { en: "The percentage is written on the disability certificate / UDID card.", hi: "प्रतिशत दिव्यांगता प्रमाण पत्र / UDID कार्ड पर लिखा होता है।" },
    sensitive: true,
    options: [
      { id: "none", range: [0, 0], label: { en: "No", hi: "नहीं" } },
      { id: "below40", range: [1, 39], label: { en: "Yes – less than 40%", hi: "हाँ – 40% से कम" } },
      { id: "40to79", range: [40, 79], label: { en: "Yes – 40% to 79%", hi: "हाँ – 40% से 79%" } },
      { id: "80plus", range: [80, 100], label: { en: "Yes – 80% or more", hi: "हाँ – 80% या ज़्यादा" } },
    ],
  },
  {
    key: "house",
    step: 2,
    kind: "enum",
    label: { en: "Housing", hi: "घर" },
    question: { en: "What kind of house do you live in?", hi: "आप कैसे घर में रहते हैं?" },
    options: [
      { id: "pucca", label: { en: "Own pucca (brick/cement) house", hi: "अपना पक्का घर" } },
      { id: "kutcha", label: { en: "Kutcha house (mud / thatch / tin)", hi: "कच्चा घर (मिट्टी / छप्पर / टीन)" } },
      { id: "none", label: { en: "No house of our own / rented", hi: "अपना घर नहीं / किराए पर" } },
    ],
  },
  {
    key: "hasLpg",
    step: 2,
    kind: "bool",
    label: { en: "LPG gas connection", hi: "एलपीजी गैस कनेक्शन" },
    question: { en: "Does your family have an LPG gas connection?", hi: "क्या आपके घर में एलपीजी गैस कनेक्शन है?" },
    yesText: { en: "Has LPG connection", hi: "गैस कनेक्शन है" },
    noText: { en: "No LPG connection at home", hi: "घर में गैस कनेक्शन नहीं" },
  },
  {
    key: "hasBankAccount",
    step: 2,
    kind: "bool",
    label: { en: "Bank account", hi: "बैंक खाता" },
    question: { en: "Do you have your own bank account?", hi: "क्या आपका अपना बैंक खाता है?" },
    yesText: { en: "Has a bank account", hi: "बैंक खाता है" },
    noText: { en: "No bank account", hi: "बैंक खाता नहीं है" },
  },
  {
    key: "hasToilet",
    step: 2,
    kind: "bool",
    label: { en: "Toilet at home", hi: "घर में शौचालय" },
    question: { en: "Is there a toilet in your house?", hi: "क्या आपके घर में शौचालय है?" },
    yesText: { en: "Has toilet at home", hi: "घर में शौचालय है" },
    noText: { en: "No toilet at home", hi: "घर में शौचालय नहीं" },
    showIf: (a) => a.area !== "urban",
  },
];

export const FIELD_MAP: Record<FieldKey, FieldDef> = Object.fromEntries(FIELDS.map((f) => [f.key, f])) as Record<
  FieldKey,
  FieldDef
>;

/** Visible questions for the current answers, in order. */
export function visibleFields(answers: Profile["answers"]): FieldDef[] {
  return FIELDS.filter((f) => !f.showIf || f.showIf(answers));
}

/** Human label for a stored answer. */
export function answerLabel(def: FieldDef, value: Answer, lang: Lang): string {
  if (value === null || value === undefined) return WORDS[lang].dontKnow;
  if (def.kind === "number") return `${value} ${WORDS[lang].years}`;
  if (def.kind === "bool") return pick(value ? def.yesText : def.noText, lang);
  const opt = def.options.find((o) => o.id === value);
  return opt ? pick(opt.label, lang) : String(value);
}
