"use client";

import { useEffect, useState } from "react";
import type { Profile } from "./core/types";
import { DEMOS } from "./demo";
import { decodeProfile, encodeProfile } from "./share";
import { loadProfile } from "./storage";

export type ProfileSource =
  | { kind: "own"; profile: Profile | null }
  | { kind: "shared"; profile: Profile }
  | { kind: "demo"; profile: Profile; demo: string };

/** Which answers a page shows: a shared link (?p=), a sample profile (?demo=), or the saved profile. */
export function useProfileSource(): ProfileSource | undefined {
  const [src, setSrc] = useState<ProfileSource | undefined>(undefined);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const shared = q.get("p") ? decodeProfile(q.get("p")!) : null;
    const demo = q.get("demo");
    if (shared) setSrc({ kind: "shared", profile: shared });
    else if (demo && DEMOS[demo]) setSrc({ kind: "demo", profile: DEMOS[demo].profile, demo });
    else setSrc({ kind: "own", profile: loadProfile() });
  }, []);
  return src;
}

/** Query string that keeps the same answers when moving to /print or /compare. */
export function sourceQuery(src: ProfileSource): string {
  if (src.kind === "shared") return `p=${encodeProfile(src.profile)}`;
  if (src.kind === "demo") return `demo=${src.demo}`;
  return "";
}
