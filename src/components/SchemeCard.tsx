"use client";

import { ArrowUpRight, Check, CircleHelp, FileCheck2, FileWarning, Scale, Share2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useApp } from "./AppProvider";
import { CategoryIcon } from "./icons";
import { SpeakButton } from "./Voice";
import type { Match } from "@/lib/core/match";
import { pick, type Lang, type Scheme } from "@/lib/core/types";
import { WORDS } from "@/lib/i18n/words";
import { reasonsFor } from "@/lib/explain";
import { DOCUMENTS } from "@/lib/core/labels";
import { isOfficialUrl } from "@/lib/schemes";
import { missingDocs } from "@/lib/useDocs";

export function whatsappLink(s: Scheme, lang: Lang): string {
  const w = WORDS[lang];
  const text =
    `${pick(s.name, lang)}\n${pick(s.benefit, lang)}\n\n` +
    w.officialSite +
    `${s.applyUrl}\n` +
    w.details +
    `${window.location.origin}/scheme/${s.id}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function ShareButton({ scheme }: { scheme: Scheme }) {
  const { lang, t } = useApp();
  return (
    <button type="button" className="btn btn-ghost btn-sm" onClick={() => window.open(whatsappLink(scheme, lang), "_blank", "noopener,noreferrer")}>
      <Share2 size={16} aria-hidden /> {t("share")}
    </button>
  );
}

export function ApplyButton({ scheme, block = false }: { scheme: Scheme; block?: boolean }) {
  const { t } = useApp();
  if (!isOfficialUrl(scheme.applyUrl)) return null; // never show a non-government link
  return (
    <a className={`btn btn-primary ${block ? "btn-block btn-lg" : "btn-sm"}`} href={scheme.applyUrl} target="_blank" rel="noopener noreferrer">
      {t("apply")} <ArrowUpRight size={16} aria-hidden />
    </a>
  );
}

export function StatusBadge({ status }: { status: Match["status"] }) {
  const { t } = useApp();
  return <span className={`badge ${status === "likely" ? "badge-success" : "badge-warn"}`}>{status === "likely" ? t("likely") : t("maybe")}</span>;
}

/** "All documents ready" or "Missing: …", based on the documents the user ticked. */
export function DocReadiness({ required, have }: { required: string[]; have: Set<string> }) {
  const { t, tx } = useApp();
  if (have.size === 0 || required.length === 0) return null;
  const missing = missingDocs(required, have);
  if (missing.length === 0)
    return (
      <p className="readiness readiness-ok">
        <FileCheck2 size={16} aria-hidden /> {t("docsReady")}
      </p>
    );
  return (
    <p className="readiness readiness-warn">
      <FileWarning size={16} aria-hidden />
      <span>
        {t("docsMissing")} ({missing.length}): {missing.map((d) => (DOCUMENTS[d] ? tx(DOCUMENTS[d]) : d)).join(", ")}
      </span>
    </p>
  );
}

export type CompareToggle = { on: boolean; disabled: boolean; toggle: () => void };

export function SchemeCard({
  match,
  rank,
  aiWhy,
  have,
  compare,
}: {
  match: Match;
  rank: number;
  aiWhy?: string;
  have?: Set<string>;
  compare?: CompareToggle;
}) {
  const { lang, t, tx } = useApp();
  const s = match.scheme;
  const { why, confirm } = reasonsFor(match, lang);
  const speech = `${tx(s.name)}. ${tx(s.benefit)}. ${aiWhy ?? why.slice(0, 2).join(". ")}`;

  return (
    <article className="card scheme-card">
      <header className="scheme-head">
        <span className="scheme-rank">{rank}</span>
        <span className="scheme-icon">
          <CategoryIcon category={s.categories[0]} />
        </span>
        <div className="scheme-title">
          <h3>
            <Link href={`/scheme/${s.id}`}>{tx(s.name)}</Link>
          </h3>
          <p className="scheme-ministry">{s.ministry}</p>
        </div>
        <div className="scheme-badges">
          <StatusBadge status={match.status} />
          <span className="badge badge-neutral">{s.level === "central" ? t("central") : t("stateScheme")}</span>
        </div>
      </header>

      <p className="benefit">{tx(s.benefit)}</p>
      {have && <DocReadiness required={s.documents} have={have} />}

      {aiWhy && (
        <div className="ai-box">
          <span className="eyebrow">
            <Sparkles size={14} aria-hidden /> {t("aiBadge")}
          </span>
          <p>{aiWhy}</p>
        </div>
      )}

      <div className="reason-grid">
        {why.length > 0 && (
          <div>
            <span className="eyebrow">{t("whyFits")}</span>
            <ul className="list-check">
              {why.slice(0, 4).map((w) => (
                <li key={w}>
                  <Check size={16} aria-hidden className="ic-success" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {confirm.length > 0 && (
          <div>
            <span className="eyebrow">{t("pleaseConfirm")}</span>
            <ul className="list-check">
              {confirm.slice(0, 3).map((w) => (
                <li key={w}>
                  <CircleHelp size={16} aria-hidden className="ic-warn" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <footer className="card-actions">
        <ApplyButton scheme={s} />
        <Link className="btn btn-ghost btn-sm" href={`/scheme/${s.id}`}>
          {t("details")}
        </Link>
        <ShareButton scheme={s} />
        {compare && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            aria-pressed={compare.on}
            disabled={!compare.on && compare.disabled}
            onClick={compare.toggle}
            title={t("compareHint")}
          >
            <Scale size={16} aria-hidden /> {t("compare")}
          </button>
        )}
        <span className="spacer" />
        <SpeakButton text={speech} label={false} />
      </footer>
    </article>
  );
}
