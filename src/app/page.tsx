"use client";

import { ArrowRight, MessageCircle, ClipboardList, FileCheck2, Landmark, Lock, ShieldCheck, UserRound, BadgeCheck, Ban } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { CategoryIcon } from "@/components/icons";
import { CATEGORY_INFO } from "@/lib/core/labels";
import { CATEGORIES } from "@/lib/core/types";
import { DEMOS } from "@/lib/demo";
import { SCHEMES } from "@/lib/schemes";
import { loadProfile } from "@/lib/storage";
import { useCssVar } from "@/lib/useCssVar";
import CountUp from "@/components/reactbits/CountUp";
import GradientText from "@/components/reactbits/GradientText";
import ShinyText from "@/components/reactbits/ShinyText";
import SpotlightCard from "@/components/reactbits/SpotlightCard";

/** Business number for the WhatsApp bot, digits only with country code (e.g. 919876543210). */
const WA_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");

/** ReactBits SpotlightCard, themed with the app's CSS variables so it follows light and dark mode. */
const SPOT = {
  theme: "light" as const,
  spotlightColor: "var(--spot)",
  intensity: 0.5,
  spotlightSize: 260,
  style: { "--spotlight-card-surface": "var(--surface)", "--spotlight-card-border": "var(--line)", "--spotlight-card-shadow": "var(--shadow)" } as React.CSSProperties,
};

export default function Home() {
  const { t, tx } = useApp();
  const brand = useCssVar("--brand", "#1747a6");
  const shine = useCssVar("--shine", "#7aa2ff");
  const [state, setState] = useState<"new" | "partial" | "done">("new");

  useEffect(() => {
    const p = loadProfile();
    if (p?.done) setState("done");
    else if (p && Object.keys(p.answers).length > 0) setState("partial");
  }, []);

  const counts = Object.fromEntries(CATEGORIES.map((c) => [c, SCHEMES.filter((s) => s.categories.includes(c)).length]));

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow eyebrow-brand">
              <ShinyText text={t("heroEyebrow")} color={brand} shineColor={shine} speed={3} delay={1.5} />
            </span>
            <h1>
              {t("heroTitleA")}{" "}
              <GradientText className="hero-gradient" colors={["var(--grad-1)", "var(--grad-2)", "var(--grad-3)"]} animationSpeed={7}>
                {t("heroTitleB")}
              </GradientText>
            </h1>
            <p className="lead">{t("heroSub")}</p>
            <div className="hero-actions">
              <Link href="/profile" className="btn btn-primary btn-lg">
                {state === "partial" ? t("continue") : t("start")} <ArrowRight size={18} aria-hidden />
              </Link>
              {state === "done" ? (
                <Link href="/results" className="btn btn-ghost btn-lg">
                  {t("seeResults")}
                </Link>
              ) : (
                <Link href="/schemes" className="btn btn-ghost btn-lg">
                  {t("browseAll")}
                </Link>
              )}
            </div>
            <p className="hero-note">
              <Lock size={14} aria-hidden /> {t("privacyLine")}
            </p>
          </div>

          <div className="stats card">
            <div>
              <strong>
                <CountUp to={SCHEMES.length} duration={1.4} />
              </strong>
              <span>{t("statSchemes")}</span>
            </div>
            <div>
              <strong>
                <CountUp to={CATEGORIES.length} duration={1.4} />
              </strong>
              <span>{t("statCategories")}</span>
            </div>
            <div>
              <strong>
                <CountUp from={10} to={2} duration={1.4} />
              </strong>
              <span>{t("statTime")}</span>
            </div>
            <div>
              <strong>₹0</strong>
              <span>{t("statCost")}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section container">
        <h2 className="section-title">{t("howItWorks")}</h2>
        <div className="grid-3">
          {[
            { icon: ClipboardList, title: t("step1Title"), body: t("step1") },
            { icon: FileCheck2, title: t("step2Title"), body: t("step2") },
            { icon: Landmark, title: t("step3Title"), body: t("step3") },
          ].map((s, i) => (
            <SpotlightCard key={i} {...SPOT} className="card feature">
              <span className="feature-icon">
                <s.icon size={20} strokeWidth={1.8} aria-hidden />
              </span>
              <span className="feature-step">0{i + 1}</span>
              <h3>{s.title}</h3>
              <p className="muted">{s.body}</p>
            </SpotlightCard>
          ))}
        </div>
      </section>

      <section className="section container">
        <div className="section-head">
          <div>
            <h2 className="section-title">{t("examplesTitle")}</h2>
            <p className="muted">{t("examplesSub")}</p>
          </div>
        </div>
        <div className="grid-4">
          {Object.entries(DEMOS).map(([key, d]) => (
            <SpotlightCard key={key} {...SPOT} className="card demo-card">
              <Link href={`/results?demo=${key}`} className="demo-link">
                <span className="demo-avatar">
                  <UserRound size={18} aria-hidden />
                </span>
                <strong>{tx(d.label)}</strong>
                <span className="muted">{tx(d.summary)}</span>
                <span className="link-arrow">
                  {t("viewResults")} <ArrowRight size={14} aria-hidden />
                </span>
                </Link>
            </SpotlightCard>
          ))}
        </div>
      </section>

      <section className="section container">
        <h2 className="section-title">{t("categoriesTitle")}</h2>
        <div className="cat-grid">
          {CATEGORIES.map((c) => (
            <Link key={c} href={`/schemes?c=${c}`} className="cat-tile">
              <span className="cat-icon">
                <CategoryIcon category={c} />
              </span>
              <span className="cat-name">{tx(CATEGORY_INFO[c].label)}</span>
              <span className="cat-count">{counts[c]}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section container">
        {WA_NUMBER && (
          <SpotlightCard {...SPOT} className="card wa-card">
            <span className="feature-icon">
              <MessageCircle size={20} strokeWidth={1.8} aria-hidden />
            </span>
            <div className="wa-copy">
              <h2 className="section-title">{t("waTitle")}</h2>
              <p className="muted">{t("waSub")}</p>
            </div>
            <a className="btn btn-primary" href={`https://wa.me/${WA_NUMBER}?text=Hi`} target="_blank" rel="noopener noreferrer">
              {t("waCta")} <ArrowRight size={16} aria-hidden />
            </a>
          </SpotlightCard>
        )}
        <SpotlightCard {...SPOT} className="card trust">
          <div>
            <h2 className="section-title">{t("trustTitle")}</h2>
            <p className="muted">{t("helperNote")}</p>
          </div>
          <ul className="trust-list">
            {[
              { icon: Lock, text: t("trust1") },
              { icon: Ban, text: t("trust2") },
              { icon: BadgeCheck, text: t("trust3") },
              { icon: ShieldCheck, text: t("trust4") },
            ].map((x, i) => (
              <li key={i}>
                <x.icon size={18} strokeWidth={1.8} aria-hidden />
                <span>{x.text}</span>
              </li>
            ))}
          </ul>
        </SpotlightCard>
      </section>
    </>
  );
}
