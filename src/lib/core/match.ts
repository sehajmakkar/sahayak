// Ranking: deterministic filter first, then score. The LLM (optional) only re-orders
// and re-words the shortlist produced here — it never adds schemes.
import { evaluate, type EvalResult } from "./rules";
import type { Category, Profile, Rule, Scheme } from "./types";

export type Match = {
  scheme: Scheme;
  /** "likely": every checkable rule passed. "maybe": some rules could not be checked. */
  status: "likely" | "maybe";
  result: EvalResult;
  score: number;
  needMatch: boolean;
};

const STALE_DAYS = 365;

export function isStale(s: Scheme, now = new Date()): boolean {
  const reviewed = new Date(s.lastReviewed).getTime();
  return (now.getTime() - reviewed) / 86_400_000 > STALE_DAYS;
}

export function scoreMatch(s: Scheme, r: EvalResult, needs: Category[]): { score: number; needMatch: boolean } {
  const needMatch = needs.length > 0 && s.categories.some((c) => needs.includes(c));
  let score = r.status === "pass" ? 1 : 0.55;
  // Targeted schemes rank above generic ones. Broad checks ("not a govt employee", "no income tax", "adult") don't count.
  const specific = r.passed.filter(
    (c) => c.op !== "notIn" && c.field !== "taxPayer" && !(c.field === "age" && c.op === "gte" && Number(c.value) <= 18),
  );
  score += 0.09 * Math.min(specific.length, 5);
  score -= 0.08 * Math.min(r.unknown.length, 5);
  score += 0.3 * (Math.log10(Math.max(s.benefitValue, 100)) / 6); // bigger benefit, small boost
  if (needMatch) score += 0.6;
  if (s.level === "state") score += 0.1; // state schemes are specific to the user's location
  return { score: Math.round(score * 1000) / 1000, needMatch };
}

export function matchSchemes(profile: Profile, schemes: Scheme[]): Match[] {
  const out: Match[] = [];
  for (const scheme of schemes) {
    const result = evaluate(scheme.eligibility, profile);
    if (result.status === "fail") continue;
    const { score, needMatch } = scoreMatch(scheme, result, profile.needs);
    out.push({ scheme, status: result.status === "pass" ? "likely" : "maybe", result, score, needMatch });
  }
  return out.sort((a, b) => b.score - a.score);
}

export type NearMiss = { scheme: Scheme; failed: Rule };

/**
 * Is this failed rule worth pointing out? Only when the person could act on it (open a bank account),
 * may have answered wrongly (income bracket, ration card type), or is close to a limit (age).
 * Facts about who someone is (state, gender, caste, occupation, family) are never shown: "needs to be
 * a fisher" isn't advice. Nor are schemes for people who *lack* something the person already has.
 */
const AGE_MARGIN = 3;

function helpfulMiss(rule: Rule, profile: Profile): boolean {
  if ("all" in rule) return rule.all.every((r) => helpfulMiss(r, profile));
  if ("any" in rule) return rule.any.every((r) => helpfulMiss(r, profile));
  const a = profile.answers;
  switch (rule.field) {
    case "hasBankAccount":
      return rule.value === true; // "needs a bank account": open one (Jan Dhan is free)
    case "taxPayer":
      return rule.value === false; // often answered wrongly
    case "rationCard":
      return a.rationCard === "none"; // may qualify for, or already hold, a BPL / AAY card
    case "income":
      return rule.op === "lte" || rule.op === "between";
    case "disability":
      return a.disability !== undefined && a.disability !== null && a.disability !== "none";
    case "education":
      return a.occupation === "student";
    case "age": {
      if (typeof a.age !== "number") return false;
      const [lo, hi] = rule.op === "between" ? (rule.value as number[]) : rule.op === "gte" ? [Number(rule.value), Infinity] : [-Infinity, Number(rule.value)];
      return Math.min(Math.abs(a.age - lo), Math.abs(a.age - hi)) <= AGE_MARGIN;
    }
    default:
      return false;
  }
}

/**
 * "Why not eligible?": schemes that fail on exactly one top-level rule, when that rule is something
 * the person could act on or may have answered wrongly (e.g. "needs a bank account", income just over).
 */
export function nearMisses(profile: Profile, schemes: Scheme[], limit = 6): NearMiss[] {
  const out: (NearMiss & { value: number })[] = [];
  for (const scheme of schemes) {
    if (evaluate(scheme.eligibility, profile).status !== "fail") continue;
    const parts = "all" in scheme.eligibility ? scheme.eligibility.all : [scheme.eligibility];
    const status = parts.map((r) => evaluate(r, profile).status);
    // Exactly one rule fails and every other rule is met: "you'd qualify except for this one thing".
    if (status.filter((x) => x === "fail").length !== 1 || status.some((x) => x === "unknown")) continue;
    const failing = parts.filter((_, i) => status[i] === "fail");
    if (!helpfulMiss(failing[0], profile)) continue;
    out.push({ scheme, failed: failing[0], value: scheme.benefitValue });
  }
  return out.sort((a, b) => b.value - a.value).slice(0, limit).map(({ scheme, failed }) => ({ scheme, failed }));
}
