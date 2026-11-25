// Shareable results: the eligibility answers ride in the link itself (?p=...), so a helper can send
// someone their results without any login or server storage. No names or ID numbers are ever in a profile.
import { CATEGORIES, FIELD_KEYS, type Answer, type Category, type FieldKey, type Profile } from "./core/types";

const toB64Url = (s: string) => btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64Url = (s: string) => atob(s.replace(/-/g, "+").replace(/_/g, "/"));

/** Compact, URL-safe encoding of the answers and needs (free-text needs are left out). */
export function encodeProfile(p: Profile): string {
  const answers = Object.fromEntries(Object.entries(p.answers).filter(([, v]) => v !== undefined && v !== null));
  return toB64Url(JSON.stringify({ a: answers, n: p.needs }));
}

/** Decodes and validates a shared profile. Unknown keys and odd values are dropped. */
export function decodeProfile(raw: string): Profile | null {
  try {
    const j = JSON.parse(fromB64Url(raw)) as { a?: Record<string, unknown>; n?: unknown[] };
    const answers: Profile["answers"] = {};
    for (const [k, v] of Object.entries(j.a ?? {})) {
      if (!(FIELD_KEYS as readonly string[]).includes(k)) continue;
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") answers[k as FieldKey] = v as Answer;
    }
    const needs = (j.n ?? []).filter((c): c is Category => typeof c === "string" && (CATEGORIES as readonly string[]).includes(c));
    if (Object.keys(answers).length === 0) return null;
    return { answers, needs, done: true };
  } catch {
    return null;
  }
}

export const shareUrl = (p: Profile, path = "/results") => `${window.location.origin}${path}?p=${encodeProfile(p)}`;
