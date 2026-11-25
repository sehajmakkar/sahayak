"use client";

import { ArrowLeft, Check, CircleHelp, ExternalLink, Info, MapPin, Phone, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { ApplyButton, DocReadiness, ShareButton } from "@/components/SchemeCard";
import { SpeakButton } from "@/components/Voice";
import { CHANNEL_ICON, CategoryIcon } from "@/components/icons";
import { describeRule } from "@/lib/core/describe";
import { CATEGORY_INFO, CHANNEL_INFO, DOCUMENTS } from "@/lib/core/labels";
import { evaluate } from "@/lib/core/rules";
import type { Profile, Rule, Tri } from "@/lib/core/types";
import { SCHEME_BY_ID, isOfficialUrl } from "@/lib/schemes";
import { nearestUrl } from "@/lib/maps";
import { loadProfile } from "@/lib/storage";
import { useDocs } from "@/lib/useDocs";

function StatusIcon({ st }: { st: Tri | null }) {
  if (st === "pass") return <Check size={16} className="ic-success" aria-label="Met" />;
  if (st === "fail") return <X size={16} className="ic-danger" aria-label="Not met" />;
  if (st === "unknown") return <CircleHelp size={16} className="ic-warn" aria-label="Unknown" />;
  return <span className="dot" aria-hidden />;
}

export function SchemeDetail({ id }: { id: string }) {
  const { lang, t, tx } = useApp();
  const s = SCHEME_BY_ID[id];
  const [profile, setProfile] = useState<Profile | null>(null);
  const { docs, toggle } = useDocs();
  useEffect(() => setProfile(loadProfile()), []);

  const rules: Rule[] = "all" in s.eligibility ? s.eligibility.all : [s.eligibility];
  const hasAnswers = !!profile && Object.keys(profile.answers).length > 0;
  const speech = [
    tx(s.name),
    `${t("benefit")}: ${tx(s.benefit)}`,
    tx(s.description),
    `${t("eligibility")}: ${rules.map((r) => describeRule(r, lang)).join(". ")}`,
    `${t("documents")}: ${s.documents.map((d) => DOCUMENTS[d]?.[lang] ?? d).join(", ")}`,
  ].join(". ");

  return (
    <div className="container page">
      {profile?.done && (
        <Link href="/results" className="back-link">
          <ArrowLeft size={16} aria-hidden /> {t("backToResults")}
        </Link>
      )}

      <div className="detail-head">
        <span className="detail-icon">
          <CategoryIcon category={s.categories[0]} size={26} />
        </span>
        <div>
          <div className="tag-row">
            <span className="badge badge-neutral">{s.level === "central" ? t("central") : t("stateScheme")}</span>
            {s.categories.map((c) => (
              <span key={c} className="tag">
                {tx(CATEGORY_INFO[c].label)}
              </span>
            ))}
          </div>
          <h1>{tx(s.name)}</h1>
          <p className="muted">{s.ministry}</p>
        </div>
      </div>

      <div className="detail-layout">
        <div className="detail-main">
          <section className="card">
            <h2 className="card-title">{t("benefit")}</h2>
            <p className="benefit benefit-lg">{tx(s.benefit)}</p>
            <p className="muted">{tx(s.description)}</p>
          </section>

          <section className="card">
            <h2 className="card-title">{t("eligibility")}</h2>
            <ul className="rule-list">
              {rules.map((r, i) => (
                <li key={i}>
                  <StatusIcon st={hasAnswers ? evaluate(r, profile!).status : null} />
                  <span>{describeRule(r, lang)}</span>
                </li>
              ))}
            </ul>
            {s.conditions.length > 0 && (
              <>
                <h3 className="side-sub">{t("alsoNeeded")}</h3>
                <ul className="list-check">
                  {s.conditions.map((c) => (
                    <li key={c.en}>
                      <Info size={16} className="ic-muted" aria-hidden />
                      <span>{tx(c)}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section className="card">
            <h2 className="card-title">{t("documents")}</h2>
            <p className="hint">{t("myDocsSub")}</p>
            <DocReadiness required={s.documents} have={docs} />
            <ul className="doc-list">
              {s.documents.map((d) => (
                <li key={d}>
                  <label>
                    <input type="checkbox" checked={docs.has(d)} onChange={(e) => toggle(d, e.target.checked)} />
                    <span>{DOCUMENTS[d]?.[lang] ?? d}</span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="detail-side">
          <div className="card side-card">
            <ApplyButton scheme={s} block />
            <div className="side-actions-row">
              <ShareButton scheme={s} />
              <SpeakButton text={speech} />
            </div>
            {s.helpline && (
              <a className="helpline" href={`tel:${s.helpline.replace(/[^0-9+]/g, "")}`}>
                <Phone size={16} aria-hidden />
                <span>
                  {t("helpline")}: <strong>{s.helpline}</strong>
                </span>
              </a>
            )}
            <h3 className="side-sub">{t("howToApply")}</h3>
            <ul className="channel-list">
              {s.channels.map((c) => {
                const Icon = CHANNEL_ICON[c];
                const near = nearestUrl(c);
                return (
                  <li key={c}>
                    <Icon size={16} strokeWidth={1.8} aria-hidden />
                    <span className="channel-text">
                      {tx(CHANNEL_INFO[c].label)}
                      {near && (
                        <a className="near-link" href={near} target="_blank" rel="noopener noreferrer">
                          <MapPin size={13} aria-hidden /> {t("findNearest")}
                        </a>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
            <dl className="kv-list kv-compact">
              {isOfficialUrl(s.sourceUrl) && (
                <div>
                  <dt>{t("official")}</dt>
                  <dd>
                    <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer">
                      {new URL(s.sourceUrl).hostname.replace(/^www\./, "")} <ExternalLink size={12} aria-hidden />
                    </a>
                  </dd>
                </div>
              )}
              <div>
                <dt>{t("reviewed")}</dt>
                <dd>{s.lastReviewed}</dd>
              </div>
            </dl>
          </div>
          <div className="notice">
            <Info size={16} aria-hidden />
            <span>{t("verifyNote")}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
