"use client";

// Voice-first answering: reads each question aloud, listens, and fills the answer. Every step also
// has tap targets, so it works even when speech recognition mishears or isn't available mid-way.
import { Check, Mic, RotateCcw, SkipForward, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { answerLabel, visibleFields, type FieldDef } from "@/lib/core/fields";
import type { Answer, FieldKey, Profile } from "@/lib/core/types";
import { matchSpoken } from "@/lib/core/voice-answer";
import { canListen, canSpeak, listenOnce, speak, stopSpeaking } from "@/lib/speech";
import { useApp } from "./AppProvider";

type Status = { kind: "idle" } | { kind: "speaking" } | { kind: "listening" } | { kind: "heard"; text: string } | { kind: "nomatch" };

export function useVoiceSupported(): boolean {
  const [ok, setOk] = useState(false);
  useEffect(() => setOk(canSpeak() && canListen()), []);
  return ok;
}

export function VoiceForm({
  answers,
  onAnswer,
  onClose,
}: {
  answers: Profile["answers"];
  onAnswer: (key: FieldKey, value: Answer) => void;
  onClose: () => void;
}) {
  const { lang, t, tx } = useApp();
  const [skipped, setSkipped] = useState<Set<FieldKey>>(new Set());
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const run = useRef(0); // bumps on every new question / action so stale callbacks are ignored
  const stopListening = useRef<() => void>(() => {});

  // Same order as the form: step 1 questions, then step 2 (sort is stable).
  const fields = [...visibleFields(answers)].sort((a, b) => a.step - b.step);
  const current: FieldDef | undefined = fields.find((f) => !(f.key in answers) && !skipped.has(f.key));
  const position = current ? fields.indexOf(current) + 1 : fields.length;

  const optionsText = (f: FieldDef) =>
    f.kind === "bool" ? `${t("yes")} / ${t("no")}` : f.kind === "enum" || f.kind === "range" ? f.options.map((o) => tx(o.label)).slice(0, 6).join(" / ") : "";

  const listen = useCallback(
    async (f: FieldDef) => {
      const id = ++run.current;
      stopSpeaking();
      setStatus({ kind: "listening" });
      const { promise, stop } = listenOnce(lang);
      stopListening.current = stop;
      const text = await promise;
      if (id !== run.current) return;
      const r = text ? matchSpoken(f, text, lang) : null;
      if (!r) return setStatus({ kind: "nomatch" });
      if ("skip" in r) {
        setSkipped((s) => new Set(s).add(f.key));
        return setStatus({ kind: "idle" });
      }
      setStatus({ kind: "heard", text: answerLabel(f, r.value, lang) });
      setTimeout(() => id === run.current && onAnswer(f.key, r.value), 700);
    },
    [lang, onAnswer],
  );

  const ask = useCallback(
    (f: FieldDef) => {
      const id = ++run.current;
      stopListening.current();
      setStatus({ kind: "speaking" });
      const opts = optionsText(f);
      speak(`${tx(f.question)}${opts ? `. ${opts}` : ""}`, lang, () => {
        if (id === run.current) listen(f);
      });
    },
    [lang, listen, tx], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Ask each new question as it comes up.
  useEffect(() => {
    if (current) ask(current);
    else {
      run.current++;
      stopListening.current();
      speak(t("voiceDone"), lang);
    }
  }, [current?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(
    () => () => {
      run.current++;
      stopListening.current();
      stopSpeaking();
    },
    [],
  );

  const pick = (value: Answer) => {
    if (!current) return;
    run.current++;
    stopListening.current();
    stopSpeaking();
    onAnswer(current.key, value);
  };

  return (
    <div className="voice-overlay" role="dialog" aria-modal="true" aria-label={t("voiceMode")}>
      <div className="voice-card card">
        <div className="voice-top">
          <span className="eyebrow eyebrow-brand">
            {t("voiceMode")} · {t("voiceQuestion")} {Math.min(position, fields.length)} / {fields.length}
          </span>
          <button className="btn btn-subtle btn-icon btn-sm" onClick={onClose} aria-label={t("voiceClose")}>
            <X size={16} aria-hidden />
          </button>
        </div>
        <div className="progress">
          <span style={{ width: `${(Object.keys(answers).length / Math.max(fields.length, 1)) * 100}%` }} />
        </div>

        {current ? (
          <>
            <h2 className="voice-q">{tx(current.question)}</h2>
            {current.help && <p className="hint">{tx(current.help)}</p>}

            <div className={`voice-status voice-${status.kind}`} aria-live="polite">
              {status.kind === "listening" && (
                <>
                  <span className="pulse" aria-hidden /> {t("listening")}
                </>
              )}
              {status.kind === "speaking" && <>{t("voiceIntro")}</>}
              {status.kind === "heard" && (
                <>
                  <Check size={16} aria-hidden /> {t("voiceHeard")}: <strong>{status.text}</strong>
                </>
              )}
              {status.kind === "nomatch" && <>{t("voiceNoMatch")}</>}
              {status.kind === "idle" && <>{t("voiceIntro")}</>}
            </div>

            {current.kind === "number" ? (
              <p className="hint">{t("voiceAgeHint")}</p>
            ) : (
              <div className="voice-options">
                {current.kind === "bool"
                  ? [true, false].map((v) => (
                      <button key={String(v)} className="chip" onClick={() => pick(v)}>
                        {v ? t("yes") : t("no")}
                      </button>
                    ))
                  : current.options.map((o) => (
                      <button key={o.id} className="chip" onClick={() => pick(o.id)}>
                        {tx(o.label)}
                      </button>
                    ))}
              </div>
            )}

            <div className="voice-actions">
              <button className="btn btn-primary" onClick={() => listen(current)} disabled={status.kind === "listening"}>
                <Mic size={18} aria-hidden /> {status.kind === "listening" ? t("listening") : t("voiceSpeak")}
              </button>
              <button className="btn btn-ghost" onClick={() => ask(current)}>
                <RotateCcw size={16} aria-hidden /> {t("voiceRepeat")}
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  run.current++;
                  stopListening.current();
                  setSkipped((s) => new Set(s).add(current.key));
                }}
              >
                <SkipForward size={16} aria-hidden /> {t("voiceSkip")}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="voice-q">{t("voiceDone")}</h2>
            <div className="voice-actions">
              <button className="btn btn-primary" onClick={onClose}>
                <Check size={16} aria-hidden /> {t("voiceClose")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
