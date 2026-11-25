// All user data lives only in this browser (localStorage). Nothing is sent to a server
// except the optional, non-identifying AI requests.
import { emptyProfile, type Profile } from "./core/types";

const KEYS = { profile: "yojanasetu.profile.v1", lang: "yojanasetu.lang", docs: "yojanasetu.docs.v1" };
/** Keys used before the rename to Yojana Setu. Read once, then moved to the new keys. */
const LEGACY: Record<string, string> = { [KEYS.profile]: "sahayak.profile.v1", [KEYS.lang]: "sahayak.lang" };

function read(key: string): string | null {
  try {
    const v = localStorage.getItem(key);
    const old = LEGACY[key];
    if (v !== null || !old) return v;
    const legacy = localStorage.getItem(old);
    if (legacy !== null) {
      localStorage.setItem(key, legacy);
      localStorage.removeItem(old);
    }
    return legacy;
  } catch {
    return null;
  }
}
function write(key: string, value: string | null) {
  try {
    if (value === null) {
      localStorage.removeItem(key);
      if (LEGACY[key]) localStorage.removeItem(LEGACY[key]);
    } else localStorage.setItem(key, value);
  } catch {
    /* private mode / storage blocked — app still works for this session */
  }
}

export function loadProfile(): Profile | null {
  const raw = read(KEYS.profile);
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Profile;
    return { ...emptyProfile(), ...p, answers: p.answers ?? {}, needs: p.needs ?? [] };
  } catch {
    return null;
  }
}
export const saveProfile = (p: Profile) => write(KEYS.profile, JSON.stringify(p));
export const loadLang = () => read(KEYS.lang);
export const saveLang = (v: string) => write(KEYS.lang, v);
export const deleteAllData = () => {
  write(KEYS.profile, null);
  write(KEYS.docs, null);
  notifyDocs();
};

// ---------- Documents the user already has (document checklist tracker) ----------
const DOCS_EVENT = "yojanasetu:docs";
const notifyDocs = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(DOCS_EVENT));
};
export function loadDocs(): string[] {
  try {
    const v = JSON.parse(read(KEYS.docs) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}
export function saveDocs(docs: string[]) {
  write(KEYS.docs, JSON.stringify([...new Set(docs)]));
  notifyDocs();
}
export function onDocsChange(cb: () => void): () => void {
  const storage = (e: StorageEvent) => e.key === KEYS.docs && cb();
  window.addEventListener(DOCS_EVENT, cb);
  window.addEventListener("storage", storage);
  return () => {
    window.removeEventListener(DOCS_EVENT, cb);
    window.removeEventListener("storage", storage);
  };
}
