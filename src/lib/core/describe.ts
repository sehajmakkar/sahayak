// Turns rule conditions into short, plain sentences in Hindi or English.
import { FIELD_MAP } from "./fields";
import { isCondition } from "./rules";
import { WORDS } from "../i18n/words";
import { pick, type Condition, type Lang, type Rule } from "./types";

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

function fmtNumber(field: Condition["field"], n: number, lang: Lang): string {
  const def = FIELD_MAP[field];
  const w = WORDS[lang];
  if (def.kind === "number") return `${n} ${w.years}`;
  if (def.kind === "range") {
    if (def.unit === "rupees") return inr(n) + w.aYear;
    if (def.unit === "hectares") return `${n} ${w.hectares} (${Math.round(n * 2.47 * 10) / 10} ${w.acres})`;
    if (def.unit === "percent") return `${n}%`;
  }
  return String(n);
}

function optLabel(field: Condition["field"], id: string | number, lang: Lang): string {
  const def = FIELD_MAP[field];
  if (def.kind === "enum" || def.kind === "range") {
    const o = def.options.find((x) => x.id === id);
    return o ? pick(o.label, lang) : String(id);
  }
  return String(id);
}

export function describeCondition(c: Condition, lang: Lang): string {
  const def = FIELD_MAP[c.field];
  const label = pick(def.label, lang);
  const w = WORDS[lang];

  // Special-case "has land" so it reads naturally.
  if (c.field === "land" && c.op === "gte" && Number(c.value) <= 0.01) return w.ownsLand;

  if (def.kind === "bool") return pick(c.value === true ? def.yesText : def.noText, lang);

  switch (c.op) {
    case "eq":
      return `${label}: ${optLabel(c.field, c.value as string, lang)}`;
    case "in":
      return `${label}: ${(c.value as string[]).map((v) => optLabel(c.field, v, lang)).join(w.or)}`;
    case "notIn":
      return `${label}: ${w.not((c.value as string[]).map((v) => optLabel(c.field, v, lang)).join(", "))}`;
    case "gte":
      return `${label}: ${fmtNumber(c.field, Number(c.value), lang)} ${w.orMore}`;
    case "lte":
      return `${label}: ${w.upTo(fmtNumber(c.field, Number(c.value), lang))}`;
    case "between": {
      const [a, b] = c.value as number[];
      return `${label}: ${fmtNumber(c.field, a, lang).replace(` ${w.years}`, "")} – ${fmtNumber(c.field, b, lang)}`;
    }
  }
}

export function describeRule(r: Rule, lang: Lang): string {
  if (isCondition(r)) return describeCondition(r, lang);
  if ("all" in r) return r.all.map((x) => describeRule(x, lang)).join(WORDS[lang].and);
  return WORDS[lang].anyOneOf + r.any.map((x) => describeRule(x, lang)).join(" / ");
}

/** Flatten the top level of a rule into a readable checklist. */
export function ruleChecklist(r: Rule, lang: Lang): string[] {
  if ("all" in r) return r.all.map((x) => describeRule(x, lang));
  return [describeRule(r, lang)];
}
