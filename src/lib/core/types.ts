// Domain types shared by the app, scripts, tests and eval.
// This module is pure (no I/O) so it can run in the browser, on the server, and in tests.

export const LANGS = ["en", "hi", "bn", "mr", "ta"] as const;
export type Lang = (typeof LANGS)[number];
/** English and Hindi are always present; other languages are optional and fall back (see pick). */
export type Text = { hi: string; en: string } & Partial<Record<"bn" | "mr" | "ta", string>>;

/** Native names for the language menu. */
export const LANG_NAMES: Record<Lang, string> = { en: "English", hi: "हिंदी", bn: "বাংলা", mr: "मराठी", ta: "தமிழ்" };

/** Text in the chosen language. Marathi falls back to Hindi (same script); Bengali and Tamil to English. */
export function pick(x: Text, lang: Lang): string {
  return x[lang] ?? (lang === "mr" ? x.hi : x.en);
}

export const CATEGORIES = [
  "farming",
  "health",
  "pension",
  "insurance",
  "housing",
  "education",
  "jobs",
  "business",
  "women_child",
  "food",
  "disability",
  "utilities",
  "banking",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const FIELD_KEYS = [
  "state",
  "area",
  "age",
  "gender",
  "maritalStatus",
  "pregnant",
  "girlChildUnder10",
  "category",
  "minority",
  "income",
  "rationCard",
  "taxPayer",
  "occupation",
  "land",
  "education",
  "disability",
  "house",
  "hasLpg",
  "hasBankAccount",
  "hasToilet",
] as const;
export type FieldKey = (typeof FIELD_KEYS)[number];

export const OPS = ["eq", "in", "notIn", "gte", "lte", "between"] as const;
export type Op = (typeof OPS)[number];

export type ConditionValue = string | number | boolean | (string | number)[];

/** A single machine-checkable eligibility predicate. */
export type Condition = { field: FieldKey; op: Op; value: ConditionValue };

/** Eligibility rule tree: a condition, or all/any groups of rules. */
export type Rule = Condition | { all: Rule[] } | { any: Rule[] };

export const CHANNELS = [
  "online",
  "csc",
  "bank",
  "post_office",
  "gram_panchayat",
  "anganwadi",
  "health_centre",
  "school_college",
  "district_office",
] as const;
export type Channel = (typeof CHANNELS)[number];

export type Scheme = {
  id: string;
  level: "central" | "state";
  /** State codes (ISO 3166-2:IN suffix, e.g. "UP"). Empty for central schemes. */
  states: string[];
  name: Text;
  ministry: string;
  categories: Category[];
  benefit: Text;
  description: Text;
  /** Rough annual rupee value, used only for ranking. */
  benefitValue: number;
  eligibility: Rule;
  /** Criteria we cannot check from the profile; shown as "also required". */
  conditions: Text[];
  documents: string[];
  channels: Channel[];
  applyUrl: string;
  sourceUrl: string;
  helpline?: string;
  /** ISO date when a human last reviewed this entry. */
  lastReviewed: string;
};

/** null means the user explicitly answered "I don't know". undefined = not asked. */
export type Answer = string | number | boolean | null;

export type Profile = {
  answers: Partial<Record<FieldKey, Answer>>;
  needs: Category[];
  needText?: string;
  /** True once the user finished the question flow. */
  done?: boolean;
};

export const emptyProfile = (): Profile => ({ answers: {}, needs: [] });

export type Tri = "pass" | "fail" | "unknown";
