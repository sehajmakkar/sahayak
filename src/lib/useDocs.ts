"use client";

import { useCallback, useEffect, useState } from "react";
import { loadDocs, onDocsChange, saveDocs } from "./storage";

/** The documents the user has ticked as "I have this", shared by every page and kept on the device. */
export function useDocs() {
  const [docs, setDocs] = useState<Set<string>>(new Set());
  useEffect(() => {
    const sync = () => setDocs(new Set(loadDocs()));
    sync();
    return onDocsChange(sync);
  }, []);
  const toggle = useCallback((id: string, on?: boolean) => {
    const next = new Set(loadDocs());
    if (on ?? !next.has(id)) next.add(id);
    else next.delete(id);
    saveDocs([...next]);
  }, []);
  const add = useCallback((ids: string[]) => saveDocs([...loadDocs(), ...ids]), []);
  return { docs, toggle, add };
}

/** Documents a scheme needs that the user hasn't ticked yet. */
export const missingDocs = (required: string[], have: Set<string>) => required.filter((d) => !have.has(d));
