"use client";

import { ArrowRight, Info, Link2, MapPin, Pencil, Printer, Scale, Trash2, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { SchemeCard } from "@/components/SchemeCard";
import { SpeakButton } from "@/components/Voice";
import { CategoryIcon } from "@/components/icons";
import { describeRule } from "@/lib/core/describe";
import { answerLabel, FIELD_MAP, visibleFields } from "@/lib/core/fields";
import { CATEGORY_INFO, DOCUMENTS } from "@/lib/core/labels";
import { matchSchemes, nearMisses, type Match } from "@/lib/core/match";
import type { Profile } from "@/lib/core/types";
import { DEMOS } from "@/lib/demo";
import { reasonsFor } from "@/lib/explain";
import { nearestUrl } from "@/lib/maps";
import { SCHEMES } from "@/lib/schemes";
import { shareUrl } from "@/lib/share";
import { deleteAllData, saveProfile } from "@/lib/storage";
import { missingDocs, useDocs } from "@/lib/useDocs";
import { sourceQuery, useProfileSource } from "@/lib/useProfileSource";

const TOP_N = 10;
const AI_POOL = 15;
const MAX_COMPARE = 3;

type AiState = { status: "idle" | "loading" | "done" | "off"; order?: string[]; why?: Record<string, string> };

function profileSummary(p: Profile): string[] {
  return visibleFields(p.answers)
    .filter((f) => p.answers[f.key] !== undefined && p.answers[f.key] !== null)
    .map((f) => `${f.label.en}: ${answerLabel(f, p.answers[f.key]!, "en")}`)
    .concat(p.needs.length ? [`Wants help with: ${p.needs.join(", ")}`] : []);
}

export default function ResultsPage() {
  const router = useRouter();
  const { lang, t, tx } = useApp();
  const src = useProfileSource();
  const profile = src?.profile ?? null;
  const [showAll, setShowAll] = useState(false);
  const [ai, setAi] = useState<AiState>({ status: "idle" });
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const { docs, toggle } = useDocs();

  const matches = useMemo(() => (profile ? matchSchemes(profile, SCHEMES) : []), [profile]);
  const misses = useMemo(() => (profile ? nearMisses(profile, SCHEMES) : []), [profile]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  // Optional AI re-rank + plain-language summaries. Rule-based results are shown immediately.
  useEffect(() => {
    if (!profile || matches.length === 0) return;
    const pool = matches.slice(0, AI_POOL);
    let cancelled = false;
    setAi({ status: "loading" });
    fetch("/api/enhance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lang,
        profile: profileSummary(profile),
        needText: profile.needText?.slice(0, 400) || undefined,
        candidates: pool.map((m) => ({ id: m.scheme.id, status: m.status, reasons: reasonsFor(m, "en").why.slice(0, 6) })),
      }),
      signal: AbortSignal.timeout(20000),
    })
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (!j.enabled || !Array.isArray(j.ranked) || j.ranked.length === 0) return setAi({ status: "off" });
        const why: Record<string, string> = {};
        for (const r of j.ranked as { id: string; why: string }[]) why[r.id] = r.why;
        setAi({ status: "done", order: (j.ranked as { id: string }[]).map((r) => r.id), why });
      })
      .catch(() => !cancelled && setAi({ status: "off" }));
    return () => {
      cancelled = true;
    };
  }, [matches, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const ordered: Match[] = useMemo(() => {
    if (ai.status !== "done" || !ai.order) return matches;
    const pool = matches.slice(0, AI_POOL);
    const byId = new Map(pool.map((m) => [m.scheme.id, m]));
    const head = ai.order.map((id) => byId.get(id)).filter((m): m is Match => !!m);
    const rest = pool.filter((m) => !ai.order!.includes(m.scheme.id));
    return [...head, ...rest, ...matches.slice(AI_POOL)];
  }, [matches, ai]);

  const shown = useMemo(() => (showAll ? ordered : ordered.slice(0, TOP_N)), [ordered, showAll]);

  // Documents needed across the shown schemes, most-needed first.
  const docList = useMemo(() => {
    const count = new Map<string, number>();
    for (const m of shown) for (const d of m.scheme.documents) count.set(d, (count.get(d) ?? 0) + 1);
    return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([d]) => d);
  }, [shown]);

  if (src === undefined) return null;

  if (!profile || Object.keys(profile.answers).length === 0) {
    return (
      <div className="container container-narrow page">
        <div className="card empty">
          <p>{t("noProfile")}</p>
          <Link href="/profile" className="btn btn-primary">
            {t("start")} <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </div>
    );
  }

  const likely = matches.filter((m) => m.status === "likely").length;
  const listen = [t("resultsTitle"), ...shown.slice(0, 5).map((m, i) => `${i + 1}. ${tx(m.scheme.name)}. ${tx(m.scheme.benefit)}`)].join(". ");
  const answered = visibleFields(profile.answers).filter((f) => f.key in profile.answers);
  const ready = shown.filter((m) => m.scheme.documents.length > 0 && missingDocs(m.scheme.documents, docs).length === 0).length;
  const q = sourceQuery(src);
  const withQ = (path: string, extra = "") => {
    const qs = [extra, q].filter(Boolean).join("&");
    return qs ? `${path}?${qs}` : path;
  };
  const csc = nearestUrl("csc");

  const share = async () => {
    const url = shareUrl(profile);
    if (navigator.share) {
      try {
        await navigator.share({ title: t("appName"), text: t("resultsTitle"), url });
      } catch {
        /* share sheet closed */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setToast(t("linkCopied"));
    } catch {
      window.prompt(t("shareResults"), url);
    }
  };

  const toggleCompare = (id: string) =>
    setCompareIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : ids.length < MAX_COMPARE ? [...ids, id] : ids));

  return (
    <div className={`container page ${compareIds.length ? "has-compare-bar" : ""}`}>
      {src.kind === "shared" && (
        <div className="banner">
          <Link2 size={18} aria-hidden />
          <span>{t("sharedBanner")}</span>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              saveProfile({ ...profile, done: true });
              window.location.replace("/results");
            }}
          >
            {t("useShared")}
          </button>
        </div>
      )}

      <div className="page-head page-head-row">
        <div>
          {src.kind === "demo" && (
            <span className="eyebrow eyebrow-brand">
              {t("example")}: {tx(DEMOS[src.demo].label)}
            </span>
          )}
          <h1>{t("resultsTitle")}</h1>
          <p className="muted">
            <strong className="text-strong">{matches.length}</strong> {t("found")} · {likely} {t("likely").toLowerCase()} · {t("resultsSub")}
          </p>
        </div>
        <SpeakButton text={listen} />
      </div>

      <div className="results-layout">
        <div className="results-main">
          {ai.status === "loading" && (
            <p className="hint">
              <span className="spinner" /> {t("aiWorking")}
            </p>
          )}
          {matches.length === 0 ? (
            <div className="card empty">{t("noResults")}</div>
          ) : (
            shown.map((m, i) => (
              <SchemeCard
                key={m.scheme.id}
                match={m}
                rank={i + 1}
                aiWhy={ai.why?.[m.scheme.id]}
                have={docs}
                compare={{
                  on: compareIds.includes(m.scheme.id),
                  disabled: compareIds.length >= MAX_COMPARE,
                  toggle: () => toggleCompare(m.scheme.id),
                }}
              />
            ))
          )}
          {!showAll && ordered.length > TOP_N && (
            <button className="btn btn-ghost btn-block" onClick={() => setShowAll(true)}>
              {t("showMore")} ({ordered.length - TOP_N})
            </button>
          )}

          {misses.length > 0 && (
            <section className="card missed">
              <h2 className="card-title">{t("missedTitle")}</h2>
              <p className="hint">{t("missedSub")}</p>
              <ul className="missed-list">
                {misses.map(({ scheme, failed }) => {
                  const field = "field" in failed ? FIELD_MAP[failed.field] : null;
                  const value = field ? profile.answers[field.key] : undefined;
                  return (
                    <li key={scheme.id}>
                      <Link href={`/scheme/${scheme.id}`} className="missed-name">
                        {tx(scheme.name)}
                      </Link>
                      <span className="missed-benefit">{tx(scheme.benefit)}</span>
                      <span className="missed-why">
                        <X size={14} className="ic-danger" aria-hidden />
                        <span>
                          <strong>{t("missedNeeds")}:</strong> {describeRule(failed, lang)}
                          {field && value !== undefined && value !== null && (
                            <>
                              {" "}
                              · <strong>{t("yourAnswer")}:</strong> {answerLabel(field, value, lang)}
                            </>
                          )}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
              {src.kind === "own" && (
                <Link href="/profile?edit=1" className="btn btn-ghost btn-sm missed-edit">
                  <Pencil size={15} aria-hidden /> {t("editAnswers")}
                </Link>
              )}
            </section>
          )}
        </div>

        <aside className="results-side">
          <div className="card side-card">
            <h2 className="side-title">{t("yourDetails")}</h2>
            <dl className="kv-list">
              {answered.map((f) => (
                <div key={f.key}>
                  <dt>{tx(f.label)}</dt>
                  <dd>{answerLabel(f, profile.answers[f.key]!, lang)}</dd>
                </div>
              ))}
            </dl>
            {profile.needs.length > 0 && (
              <>
                <h3 className="side-sub">{t("focusAreas")}</h3>
                <div className="tag-row">
                  {profile.needs.map((c) => (
                    <span key={c} className="tag">
                      <CategoryIcon category={c} size={14} /> {tx(CATEGORY_INFO[c].label)}
                    </span>
                  ))}
                </div>
              </>
            )}
            <div className="side-actions">
              <button className="btn btn-ghost btn-sm" onClick={share}>
                <Link2 size={15} aria-hidden /> {t("shareResults")}
              </button>
              <Link href={withQ("/print")} className="btn btn-ghost btn-sm">
                <Printer size={15} aria-hidden /> {t("printSummary")}
              </Link>
              {csc && (
                <a href={csc} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                  <MapPin size={15} aria-hidden /> {t("findCsc")}
                </a>
              )}
              {src.kind === "own" && (
                <>
                  <Link href="/profile?edit=1" className="btn btn-ghost btn-sm">
                    <Pencil size={15} aria-hidden /> {t("editAnswers")}
                  </Link>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      saveProfile({ answers: {}, needs: [] });
                      router.push("/profile");
                    }}
                  >
                    <UserPlus size={15} aria-hidden /> {t("newProfile")}
                  </button>
                  <button
                    className="btn btn-danger-ghost btn-sm"
                    onClick={() => {
                      deleteAllData();
                      alert(t("deleted"));
                      router.push("/");
                    }}
                  >
                    <Trash2 size={15} aria-hidden /> {t("deleteData")}
                  </button>
                </>
              )}
            </div>
            {toast && <p className="hint hint-ok">{toast}</p>}
          </div>

          {docList.length > 0 && (
            <div className="card side-card">
              <h2 className="side-title">{t("myDocs")}</h2>
              <p className="hint">{t("myDocsSub")}</p>
              <ul className="doc-list doc-list-compact">
                {docList.map((d) => (
                  <li key={d}>
                    <label>
                      <input type="checkbox" checked={docs.has(d)} onChange={() => toggle(d)} />
                      <span>{DOCUMENTS[d] ? tx(DOCUMENTS[d]) : d}</span>
                    </label>
                  </li>
                ))}
              </ul>
              {docs.size > 0 && (
                <p className="hint hint-ok">
                  {ready} / {shown.length} {t("readyCount")}
                </p>
              )}
            </div>
          )}

          <div className="notice">
            <Info size={16} aria-hidden />
            <span>{t("verifyNote")}</span>
          </div>
        </aside>
      </div>

      {compareIds.length > 0 && (
        <div className="compare-bar" role="region" aria-label={t("compareTitle")}>
          <div className="container compare-bar-inner">
            <Scale size={18} aria-hidden />
            <span className="compare-count">
              {compareIds.length} / {MAX_COMPARE} {t("compareSelected")}
            </span>
            <span className="spacer" />
            <button className="btn btn-ghost btn-sm" onClick={() => setCompareIds([])}>
              {t("clear")}
            </button>
            {compareIds.length >= 2 ? (
              <Link href={withQ("/compare", `ids=${compareIds.join(",")}`)} className="btn btn-primary btn-sm">
                {t("compare")} <ArrowRight size={16} aria-hidden />
              </Link>
            ) : (
              <span className="hint">{t("compareHint")}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
