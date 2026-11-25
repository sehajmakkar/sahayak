"use client";

import { ArrowLeft, ArrowRight, AudioLines, Check, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { CategoryIcon } from "@/components/icons";
import { DocScan } from "@/components/DocScan";
import { MicButton } from "@/components/Voice";
import { useVoiceSupported, VoiceForm } from "@/components/VoiceForm";
import { visibleFields, type FieldDef } from "@/lib/core/fields";
import { CATEGORY_INFO } from "@/lib/core/labels";
import { detectNeeds } from "@/lib/core/needs";
import { CATEGORIES, emptyProfile, type Answer, type Category, type FieldKey, type Profile } from "@/lib/core/types";
import { loadProfile, saveProfile } from "@/lib/storage";
import { useDocs } from "@/lib/useDocs";

/** Drop answers for fields that are no longer shown (e.g. pregnancy after switching gender). */
function prune(answers: Profile["answers"]): Profile["answers"] {
  const visible = new Set(visibleFields(answers).map((f) => f.key));
  return Object.fromEntries(Object.entries(answers).filter(([k, v]) => visible.has(k as FieldKey) && v !== undefined));
}

const isSegmented = (f: FieldDef) => f.kind === "enum" && !f.dropdown && f.options.length <= 3 && f.options.every((o) => o.label.en.length <= 16);

export default function ProfilePage() {
  const router = useRouter();
  const { t, tx } = useApp();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const { add: addDocs } = useDocs();
  const voiceOk = useVoiceSupported();
  const [voice, setVoice] = useState(false);

  useEffect(() => {
    const p = loadProfile() ?? emptyProfile();
    setProfile(p);
    const editing = new URLSearchParams(window.location.search).has("edit");
    const step1Done = visibleFields(p.answers).some((f) => f.step === 2 && f.key in p.answers);
    if (!editing && step1Done && !p.done) setStep(2);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  if (!profile) return null;

  const persist = (p: Profile) => {
    setProfile(p);
    saveProfile(p);
  };
  const setAnswer = (key: FieldKey, value: Answer | undefined) => {
    const answers = { ...profile.answers };
    if (value === undefined) delete answers[key];
    else answers[key] = value;
    persist({ ...profile, answers: prune(answers), done: false });
  };

  const fields = visibleFields(profile.answers).filter((f) => f.step === step);
  const mainFields = fields.filter((f) => f.kind !== "bool");
  const boolFields = fields.filter((f) => f.kind === "bool");

  const goTo = (s: 1 | 2) => {
    setStep(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const finish = async () => {
    setBusy(true);
    const text = profile.needText?.trim() ?? "";
    let needs = [...new Set([...profile.needs, ...detectNeeds(text)])];
    if (text) {
      try {
        const res = await fetch("/api/need", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
          signal: AbortSignal.timeout(6000),
        });
        const j = await res.json();
        if (Array.isArray(j.categories)) needs = [...new Set([...needs, ...(j.categories as Category[])])];
      } catch {
        /* offline or AI unavailable: keyword detection is enough */
      }
    }
    persist({ ...profile, needs, done: true });
    router.push("/results");
  };

  return (
    <div className="container container-narrow page">
      <div className="page-head page-head-row">
        <div>
          <h1>{t("formTitle")}</h1>
          <p className="muted">{t("formSub")}</p>
        </div>
        {voiceOk && (
          <button type="button" className="btn btn-primary" onClick={() => setVoice(true)}>
            <AudioLines size={18} aria-hidden /> {t("voiceMode")}
          </button>
        )}
      </div>

      {voice && (
        <VoiceForm
          answers={profile.answers}
          onAnswer={(key, value) => setAnswer(key, value)}
          onClose={() => {
            setVoice(false);
            goTo(2);
          }}
        />
      )}

      <ol className="stepper" aria-label="Progress">
        {([1, 2] as const).map((n) => (
          <li key={n} className={step === n ? "current" : step > n ? "complete" : ""}>
            <button type="button" onClick={() => goTo(n)}>
              <span className="stepper-dot">{step > n ? <Check size={14} aria-hidden /> : n}</span>
              <span className="stepper-text">
                <small>
                  {t("stepLabel")} {n}
                </small>
                {n === 1 ? t("step1Name") : t("step2Name")}
              </span>
            </button>
          </li>
        ))}
      </ol>

      <form
        className="card form-card"
        onSubmit={(e) => {
          e.preventDefault();
          if (step === 1) goTo(2);
          else finish();
        }}
      >
        {step === 1 && (
          <DocScan
            onApply={(found, docIds) => {
              persist({ ...profile, answers: prune({ ...profile.answers, ...found }), done: false });
              if (docIds.length) addDocs(docIds);
            }}
          />
        )}

        <div className="form-grid">
          {mainFields.map((f) => (
            <FieldControl key={f.key} def={f} value={profile.answers[f.key]} onChange={(v) => setAnswer(f.key, v)} />
          ))}
        </div>

        {boolFields.length > 0 && (
          <fieldset className="fieldset">
            <legend>{t("householdQs")}</legend>
            <div className="bool-grid">
              {boolFields.map((f) => (
                <FieldControl key={f.key} def={f} value={profile.answers[f.key]} onChange={(v) => setAnswer(f.key, v)} />
              ))}
            </div>
          </fieldset>
        )}

        {step === 2 && (
          <fieldset className="fieldset">
            <legend>{t("needsTitle")}</legend>
            <p className="hint">{t("needsHelp")}</p>
            <div className="chip-grid">
              {CATEGORIES.map((c) => {
                const on = profile.needs.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    className="chip"
                    aria-pressed={on}
                    onClick={() => persist({ ...profile, needs: on ? profile.needs.filter((x) => x !== c) : [...profile.needs, c] })}
                  >
                    <CategoryIcon category={c} size={16} />
                    {tx(CATEGORY_INFO[c].label)}
                  </button>
                );
              })}
            </div>
            <div className="textarea-wrap">
              <textarea
                className="input"
                rows={3}
                placeholder={t("needPlaceholder")}
                value={profile.needText ?? ""}
                maxLength={400}
                onChange={(e) => persist({ ...profile, needText: e.target.value })}
              />
              <div className="textarea-actions">
                <MicButton
                  onResult={(tr) => {
                    if (!tr) return setToast(t("didntCatch"));
                    persist({ ...profile, needText: [profile.needText, tr].filter(Boolean).join(" ") });
                  }}
                />
              </div>
            </div>
            {toast && <p className="hint hint-warn">{toast}</p>}
          </fieldset>
        )}

        <div className="form-footer">
          <p className="hint">
            <Lock size={14} aria-hidden /> {t("privacyLine")}
          </p>
          <div className="form-actions">
            {step === 2 && (
              <button type="button" className="btn btn-ghost" onClick={() => goTo(1)}>
                <ArrowLeft size={16} aria-hidden /> {t("back")}
              </button>
            )}
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy && <span className="spinner" />}
              {step === 1 ? t("next") : t("showSchemes")}
              {!busy && <ArrowRight size={16} aria-hidden />}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function FieldControl({ def, value, onChange }: { def: FieldDef; value: Answer | undefined; onChange: (v: Answer | undefined) => void }) {
  const { t, tx } = useApp();
  const id = `f-${def.key}`;

  if (def.kind === "bool") {
    return (
      <div className="bool-row">
        <span className="bool-label" id={id}>
          {tx(def.question)}
        </span>
        <div className="segmented segmented-sm" role="group" aria-labelledby={id}>
          {[true, false].map((v) => (
            <button key={String(v)} type="button" aria-pressed={value === v} onClick={() => onChange(value === v ? undefined : v)}>
              {v ? t("yes") : t("no")}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`field ${def.key === "occupation" || def.key === "income" ? "field-wide" : ""}`}>
      <label htmlFor={id} id={`${id}-label`} className="label">
        {tx(def.label)}
      </label>
      {def.kind === "number" ? (
        <input
          id={id}
          className="input"
          type="number"
          inputMode="numeric"
          min={def.min}
          max={def.max}
          placeholder={t("agePlaceholder")}
          value={typeof value === "number" ? value : ""}
          onChange={(e) => {
            const raw = e.target.value.slice(0, 3);
            const n = Number(raw);
            onChange(raw === "" || !Number.isFinite(n) ? undefined : Math.min(def.max, Math.max(def.min, Math.round(n))));
          }}
        />
      ) : isSegmented(def) ? (
        <div className="segmented" role="group" aria-labelledby={`${id}-label`}>
          {def.options.map((o) => (
            <button key={o.id} type="button" aria-pressed={value === o.id} onClick={() => onChange(value === o.id ? undefined : o.id)}>
              {tx(o.label)}
            </button>
          ))}
        </div>
      ) : (
        <select id={id} className="input" value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value || undefined)}>
          <option value="">{def.kind === "enum" && def.dropdown ? t("select") : `${t("select")} / ${t("notSure")}`}</option>
          {def.options.map((o) => (
            <option key={o.id} value={o.id}>
              {tx(o.label)}
            </option>
          ))}
        </select>
      )}
      {def.help && <p className="hint">{tx(def.help)}</p>}
    </div>
  );
}
