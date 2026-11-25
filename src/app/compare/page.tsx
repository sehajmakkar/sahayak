"use client";

import { ArrowLeft, Check, CircleHelp, Phone, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { ApplyButton, StatusBadge } from "@/components/SchemeCard";
import { CHANNEL_ICON } from "@/components/icons";
import { describeRule } from "@/lib/core/describe";
import { CHANNEL_INFO, DOCUMENTS } from "@/lib/core/labels";
import { evaluate } from "@/lib/core/rules";
import type { Rule, Scheme, Tri } from "@/lib/core/types";
import { SCHEME_BY_ID } from "@/lib/schemes";
import { useDocs } from "@/lib/useDocs";
import { sourceQuery, useProfileSource } from "@/lib/useProfileSource";

function Mark({ st }: { st: Tri | null }) {
  if (st === "pass") return <Check size={15} className="ic-success" aria-label="Met" />;
  if (st === "fail") return <X size={15} className="ic-danger" aria-label="Not met" />;
  if (st === "unknown") return <CircleHelp size={15} className="ic-warn" aria-label="Unknown" />;
  return <span className="dot" aria-hidden />;
}

export default function ComparePage() {
  const { lang, t, tx } = useApp();
  const src = useProfileSource();
  const { docs } = useDocs();
  const [schemes, setSchemes] = useState<Scheme[]>([]);

  useEffect(() => {
    const ids = (new URLSearchParams(window.location.search).get("ids") ?? "").split(",");
    setSchemes([...new Set(ids)].map((id) => SCHEME_BY_ID[id]).filter(Boolean).slice(0, 3));
  }, []);

  if (src === undefined) return null;
  const profile = src.profile && Object.keys(src.profile.answers).length ? src.profile : null;
  const q = sourceQuery(src);
  const back = q ? `/results?${q}` : "/results";

  if (schemes.length < 2) {
    return (
      <div className="container container-narrow page">
        <div className="card empty">
          <p>{t("compareEmpty")}</p>
          <Link href={back} className="btn btn-primary">
            <ArrowLeft size={16} aria-hidden /> {t("backToResults")}
          </Link>
        </div>
      </div>
    );
  }

  const rulesOf = (s: Scheme): Rule[] => ("all" in s.eligibility ? s.eligibility.all : [s.eligibility]);
  const statusOf = (s: Scheme) => {
    if (!profile) return null;
    const st = evaluate(s.eligibility, profile).status;
    return st === "fail" ? null : st === "pass" ? "likely" : "maybe";
  };

  const rows: { label: string; render: (s: Scheme) => React.ReactNode }[] = [
    { label: t("benefit"), render: (s) => <p className="benefit">{tx(s.benefit)}</p> },
    ...(profile
      ? [
          {
            label: t("forYou"),
            render: (s: Scheme) => {
              const st = statusOf(s);
              return st ? <StatusBadge status={st} /> : <span className="badge badge-neutral">—</span>;
            },
          },
        ]
      : []),
    { label: t("schemeType"), render: (s) => (s.level === "central" ? t("central") : t("stateScheme")) },
    {
      label: t("whoCanApply"),
      render: (s) => (
        <ul className="cmp-list">
          {rulesOf(s).map((r, i) => (
            <li key={i}>
              <Mark st={profile ? evaluate(r, profile).status : null} />
              <span>{describeRule(r, lang)}</span>
            </li>
          ))}
          {s.conditions.map((c) => (
            <li key={c.en}>
              <span className="dot" aria-hidden />
              <span>{tx(c)}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      label: t("documents"),
      render: (s) => (
        <ul className="cmp-list">
          {s.documents.map((d) => (
            <li key={d}>
              {docs.has(d) ? <Check size={15} className="ic-success" aria-label={t("printHave")} /> : <span className="dot" aria-hidden />}
              <span>{DOCUMENTS[d] ? tx(DOCUMENTS[d]) : d}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      label: t("howToApply"),
      render: (s) => (
        <ul className="cmp-list">
          {s.channels.map((c) => {
            const Icon = CHANNEL_ICON[c];
            return (
              <li key={c}>
                <Icon size={15} aria-hidden className="ic-muted" />
                <span>{tx(CHANNEL_INFO[c].label)}</span>
              </li>
            );
          })}
        </ul>
      ),
    },
    {
      label: t("helpline"),
      render: (s) =>
        s.helpline ? (
          <a className="helpline" href={`tel:${s.helpline.replace(/[^0-9+]/g, "")}`}>
            <Phone size={15} aria-hidden /> {s.helpline}
          </a>
        ) : (
          "—"
        ),
    },
    { label: "", render: (s) => <ApplyButton scheme={s} /> },
  ];

  return (
    <div className="container page">
      <Link href={back} className="back-link">
        <ArrowLeft size={16} aria-hidden /> {t("backToResults")}
      </Link>
      <div className="page-head">
        <h1>{t("compareTitle")}</h1>
        <p className="muted">{t("verifyNote")}</p>
      </div>
      <div className="cmp-scroll">
        <div className="cmp-grid" style={{ "--cols": schemes.length } as React.CSSProperties}>
          <div className="cmp-label cmp-corner" />
          {schemes.map((s) => (
            <div key={s.id} className="cmp-head">
              <Link href={`/scheme/${s.id}`}>{tx(s.name)}</Link>
              <small className="muted">{s.ministry}</small>
            </div>
          ))}
          {rows.map((r, i) => (
            <div key={i} className="cmp-row">
              <div className="cmp-label">{r.label}</div>
              {schemes.map((s) => (
                <div key={s.id} className="cmp-cell">
                  {r.render(s)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
