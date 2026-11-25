"use client";

import { useEffect, useState } from "react";

/**
 * Reads a CSS custom property's resolved value and follows light/dark changes.
 * For components (like ReactBits ShinyText) that compute colors in JS and can't take var(--x).
 */
export function useCssVar(name: string, fallback: string): string {
  const [value, setValue] = useState(fallback);
  useEffect(() => {
    const read = () => setValue(getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback);
    read();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);
  }, [name, fallback]);
  return value;
}
