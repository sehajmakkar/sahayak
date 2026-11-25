import data from "../../data/schemes.json";
import type { Scheme } from "./core/types";

import bn from "../../data/i18n/schemes.bn.json";
import mr from "../../data/i18n/schemes.mr.json";
import ta from "../../data/i18n/schemes.ta.json";

// Validated at build/dev time by scripts/validate-data.ts (npm run validate:data).
export const SCHEMES = data as unknown as Scheme[];

// Scheme names and benefits in Bengali, Marathi and Tamil. Descriptions and conditions fall back
// to Hindi (Marathi) or English (Bengali, Tamil) until they are translated.
const SCHEME_I18N = { bn, mr, ta } as Record<"bn" | "mr" | "ta", Record<string, { name: string; benefit: string }>>;
for (const s of SCHEMES) {
  for (const [lang, pack] of Object.entries(SCHEME_I18N) as ["bn" | "mr" | "ta", Record<string, { name: string; benefit: string }>][]) {
    const tr = pack[s.id];
    if (!tr) continue;
    s.name[lang] = tr.name;
    s.benefit[lang] = tr.benefit;
  }
}

export const SCHEME_BY_ID: Record<string, Scheme> = Object.fromEntries(SCHEMES.map((s) => [s.id, s]));

/** Only these domains may be shown as "apply" / "source" links. */
const OFFICIAL_SUFFIXES = [".gov.in", ".nic.in"];
const OFFICIAL_EXTRA = ["maandhan.in", "jansamarth.in", "mudra.org.in", "standupmitra.in", "pfrda.org.in"];

export function isOfficialUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    const host = u.hostname.replace(/^www\./, "");
    return OFFICIAL_SUFFIXES.some((s) => host.endsWith(s)) || OFFICIAL_EXTRA.includes(host);
  } catch {
    return false;
  }
}
