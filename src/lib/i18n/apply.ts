// Merges the Bengali, Marathi and Tamil translations into the bilingual source data (form fields,
// states, categories, channels, documents, sample profiles) once, at startup. Missing keys simply
// fall back to Hindi / English through pick().
import { FIELDS, STATES } from "../core/fields";
import { CATEGORY_INFO, CHANNEL_INFO, DOCUMENTS } from "../core/labels";
import type { Text } from "../core/types";
import { DEMOS } from "../demo";
import bn from "./content.bn";
import mr from "./content.mr";
import ta from "./content.ta";

const PACKS = { bn, mr, ta } as const;

function set(target: Text | undefined, lang: keyof typeof PACKS, value: string | undefined) {
  if (target && value) target[lang] = value;
}

for (const [lang, t] of Object.entries(PACKS) as [keyof typeof PACKS, Record<string, string>][]) {
  for (const f of FIELDS) {
    set(f.label, lang, t[`F.${f.key}.label`]);
    set(f.question, lang, t[`F.${f.key}.question`]);
    set(f.help, lang, t[`F.${f.key}.help`]);
    if (f.kind === "bool") {
      set(f.yesText, lang, t[`F.${f.key}.yes`]);
      set(f.noText, lang, t[`F.${f.key}.no`]);
    }
    if ((f.kind === "enum" || f.kind === "range") && f.key !== "state") {
      for (const o of f.options) set(o.label, lang, t[`F.${f.key}.o.${o.id}`]);
    }
  }
  // State options share their Text objects with STATES, so this covers the dropdown too.
  for (const st of STATES) set(st.name, lang, t[`S.${st.code}`]);
  for (const [k, v] of Object.entries(CATEGORY_INFO)) set(v.label, lang, t[`C.${k}`]);
  for (const [k, v] of Object.entries(CHANNEL_INFO)) set(v.label, lang, t[`CH.${k}`]);
  for (const [k, v] of Object.entries(DOCUMENTS)) set(v, lang, t[`D.${k}`]);
  for (const [k, v] of Object.entries(DEMOS)) {
    set(v.label, lang, t[`DM.${k}.label`]);
    set(v.summary, lang, t[`DM.${k}.summary`]);
  }
}

export {};
