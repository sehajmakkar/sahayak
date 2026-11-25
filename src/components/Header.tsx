"use client";

import { Languages } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "./AppProvider";
import { BrandMark } from "./icons";
import { LANG_NAMES, LANGS, type Lang } from "@/lib/core/types";

export function Header() {
  const { lang, setLang, t } = useApp();
  const path = usePathname();
  const nav = [
    { href: "/schemes", label: t("allSchemes") },
    { href: "/privacy", label: t("privacy") },
  ];

  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <Link href="/" className="brand" aria-label={t("home")}>
          <span className="brand-mark" aria-hidden>
            <BrandMark />
          </span>
          <span className="brand-text">
            <strong>{t("appName")}</strong>
            <small>{t("appTag")}</small>
          </span>
        </Link>
        <nav className="topnav">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className={`topnav-link ${path?.startsWith(n.href) ? "active" : ""}`}>
              {n.label}
            </Link>
          ))}
          <label className="lang-select">
            <Languages size={16} aria-hidden />
            <span className="sr-only">{t("language")}</span>
            <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} aria-label={t("language")}>
              {LANGS.map((l) => (
                <option key={l} value={l}>
                  {LANG_NAMES[l]}
                </option>
              ))}
            </select>
          </label>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  const { t } = useApp();
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <strong>{t("appName")}</strong>
          <p className="muted">{t("footer")}</p>
        </div>
        <nav className="footer-links">
          <Link href="/">{t("home")}</Link>
          <Link href="/schemes">{t("allSchemes")}</Link>
          <Link href="/privacy">{t("privacy")}</Link>
        </nav>
      </div>
    </footer>
  );
}
