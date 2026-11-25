"use client";

// One-page printable summary for helpers (CSC / ASHA) to hand over: answers, top schemes, documents,
// where to apply, helplines, and QR codes for the official apply links and for these results.
import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { BrandMark } from "@/components/icons";
import { answerLabel, visibleFields } from "@/lib/core/fields";
import { CHANNEL_INFO, DOCUMENTS } from "@/lib/core/labels";
import { matchSchemes } from "@/lib/core/match";
import { reasonsFor } from "@/lib/explain";
import { qrPath } from "@/lib/qr";
import { isOfficialUrl, SCHEMES } from "@/lib/schemes";
import { shareUrl } from "@/lib/share";
import { useDocs } from "@/lib/useDocs";
import { sourceQuery, useProfileSource } from "@/lib/useProfileSource";

const TOP_N = 8;

function QR({ text, size = 84, label }: { text: string; size?: number; label?: string }) {
  const { size: n, d } = useMemo(() => qrPath(text), [text]);
  return (
    <figure className="qr">
      <svg width={size} height={size} viewBox={`-2 -2 ${n + 4} ${n + 4}`} shapeRendering="crispEdges" role="img" aria-label={label ?? text}>
        <rect x="-2" y="-2" width={n + 4} height={n + 4} fill="#fff" />
        <path d={d} fill="#000" />
      </svg>
      {label && <figcaption>{label}</figcaption>}
    </figure>
  );
}

export default function PrintPage() {
  const { lang, t, tx } = useApp();
  const src = useProfileSource();
  const { docs } = useDocs();
  const [link, setLink] = useState("");
  const profile = src?.profile && Object.keys(src.profile.answers).length ? src.profile : null;

  useEffect(() => {
    if (profile) setLink(shareUrl(profile));
  }, [profile]);

  if (src === undefined) return null;
  const q = sourceQuery(src);
  const back = q ? `/results?${q}` : "/results";

  if (!profile) {
    return (
      <div className="container container-narrow page">
        <div className="card empty">
          <p>{t("noProfile")}</p>
          <Link href="/profile" className="btn btn-primary">
            {t("start")}
          </Link>
        </div>
      </div>
    );
  }

  const top = matchSchemes(profile, SCHEMES).slice(0, TOP_N);
  const answered = visibleFields(profile.answers).filter((f) => profile.answers[f.key] !== undefined && profile.answers[f.key] !== null);
  const today = new Date().toLocaleDateString(lang === "en" ? "en-IN" : `${lang}-IN`, { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="container page print-page">
      <div className="print-toolbar no-print">
        <Link href={back} className="back-link">
          <ArrowLeft size={16} aria-hidden /> {t("backToResults")}
        </Link>
        <button className="btn btn-primary" onClick={() => window.print()}>
          <Printer size={16} aria-hidden /> {t("printNow")}
        </button>
      </div>

      <article className="sheet">
        <header className="sheet-head">
          <div className="sheet-brand">
            <BrandMark size={40} />
            <div>
              <strong>{t("appName")}</strong>
              <span>{t("printTitle")}</span>
              <small>
                {t("printDate")}: {today}
              </small>
            </div>
          </div>
          {link && <QR text={link} size={92} label={t("printScanResults")} />}
        </header>

        <section className="sheet-answers">
          <h2>{t("yourDetails")}</h2>
          <dl>
            {answered.map((f) => (
              <div key={f.key}>
                <dt>{tx(f.label)}</dt>
                <dd>{answerLabel(f, profile.answers[f.key]!, lang)}</dd>
              </div>
            ))}
          </dl>
        </section>

        <h2 className="sheet-title">{t("resultsTitle")}</h2>
        <ol className="sheet-list">
          {top.map((m, i) => {
            const s = m.scheme;
            const { why } = reasonsFor(m, lang);
            return (
              <li key={s.id} className="sheet-item">
                <div className="sheet-item-main">
                  <h3>
                    <span className="sheet-rank">{i + 1}.</span>
                    {tx(s.name)} <span className="sheet-status">({m.status === "likely" ? t("likely") : t("maybe")})</span>
                  </h3>
                  <p className="sheet-benefit">{tx(s.benefit)}</p>
                  {why.length > 0 && (
                    <p className="sheet-small">
                      <strong>{t("whyFits")}:</strong> {why.slice(0, 3).join("; ")}
                    </p>
                  )}
                  <p className="sheet-small">
                    <strong>{t("documents")}:</strong>{" "}
                    {s.documents.map((d, i) => (
                      <span key={d} className="sheet-doc">
                        {docs.has(d) ? "☑" : "☐"} {DOCUMENTS[d] ? tx(DOCUMENTS[d]) : d}
                        {i < s.documents.length - 1 ? "  " : ""}
                      </span>
                    ))}
                  </p>
                  <p className="sheet-small">
                    <strong>{t("howToApply")}:</strong> {s.channels.map((c) => tx(CHANNEL_INFO[c].label)).join("; ")}
                    {s.helpline ? ` · ${t("helpline")}: ${s.helpline}` : ""}
                  </p>
                </div>
                {isOfficialUrl(s.applyUrl) && <QR text={s.applyUrl} size={72} label={t("printScanApply")} />}
              </li>
            );
          })}
        </ol>

        <footer className="sheet-foot">
          <p>{t("resultsSub")}</p>
          <p>{t("verifyNote")}</p>
          <p>
            <strong>{t("trust4")}</strong>
          </p>
        </footer>
      </article>
    </div>
  );
}
