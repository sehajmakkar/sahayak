"use client";

// Optional "fill from a document" helper. OCR (Tesseract.js) runs in the browser: the photo never
// leaves the phone, the recognised text is never stored, and the user confirms every detected field.
import { Check, FileScan, ScanText, X } from "lucide-react";
import { useRef, useState } from "react";
import { answerLabel, FIELD_MAP } from "@/lib/core/fields";
import { extractFromText, type Extracted } from "@/lib/core/ocr-extract";
import { pick, type FieldKey } from "@/lib/core/types";
import { useApp } from "./AppProvider";

type State =
  | { kind: "idle" }
  | { kind: "reading"; progress: number }
  | { kind: "review"; found: Extracted; picked: Set<FieldKey> }
  | { kind: "message"; text: string; tone: "ok" | "warn" };

/** Phone photos can be 12+ MP; OCR is faster and just as accurate at ~2000 px. */
async function downscale(file: File, max = 2000): Promise<Blob | File> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    if (scale === 1) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob | File>((res) => canvas.toBlob((b) => res(b ?? file), "image/jpeg", 0.92));
  } catch {
    return file;
  }
}

/** Which document a scanned field most likely came from, so it can be ticked in "My documents". */
const DOC_FOR: Partial<Record<FieldKey, string>> = {
  rationCard: "ration_card",
  income: "income_cert",
  category: "caste_cert",
  disability: "disability_cert",
};

export function DocScan({ onApply }: { onApply: (answers: Extracted, docIds: string[]) => void }) {
  const { t, lang } = useApp();
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<State>({ kind: "idle" });

  const scan = async (file: File) => {
    setState({ kind: "reading", progress: 0 });
    try {
      const { createWorker } = await import("tesseract.js");
      // English + Hindi always (most documents are bilingual), plus the reader's own script.
      const extra = { bn: "ben", mr: "mar", ta: "tam" } as Record<string, string>;
      const worker = await createWorker(["eng", "hin", ...(extra[lang] ? [extra[lang]] : [])], 1, {
        logger: (m) => {
          if (m.status === "recognizing text") setState({ kind: "reading", progress: m.progress });
        },
      });
      const { data } = await worker.recognize(await downscale(file));
      await worker.terminate();
      const found = extractFromText(data.text);
      const keys = Object.keys(found) as FieldKey[];
      if (keys.length === 0) setState({ kind: "message", text: t("scanNothing"), tone: "warn" });
      else setState({ kind: "review", found, picked: new Set(keys) });
    } catch {
      setState({ kind: "message", text: t("scanFailed"), tone: "warn" });
    }
  };

  const busy = state.kind === "reading";

  return (
    <section className="scan" aria-live="polite">
      <div className="scan-head">
        <span className="scan-icon">
          <FileScan size={20} strokeWidth={1.8} aria-hidden />
        </span>
        <div className="scan-copy">
          <strong>{t("scanTitle")}</strong>
          <p className="hint">{t("scanSub")}</p>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? <span className="spinner" /> : <ScanText size={16} aria-hidden />}
          {t("scanButton")}
        </button>
        <input
          ref={input}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) scan(f);
          }}
        />
      </div>

      {state.kind === "reading" && (
        <div className="scan-progress">
          <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(state.progress * 100)}>
            <span style={{ width: `${Math.max(6, state.progress * 100)}%` }} />
          </div>
          <p className="hint">{t("scanReading")}</p>
        </div>
      )}

      {state.kind === "review" && (
        <div className="scan-review">
          <p className="hint">{t("scanFound")}</p>
          <ul className="scan-list">
            {(Object.keys(state.found) as FieldKey[]).map((k) => {
              const on = state.picked.has(k);
              return (
                <li key={k}>
                  <label className="scan-item">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => {
                        const picked = new Set(state.picked);
                        if (on) picked.delete(k);
                        else picked.add(k);
                        setState({ ...state, picked });
                      }}
                    />
                    <span className="scan-item-label">{pick(FIELD_MAP[k].label, lang)}</span>
                    <span className="scan-item-value">{answerLabel(FIELD_MAP[k], state.found[k]!, lang)}</span>
                  </label>
                </li>
              );
            })}
          </ul>
          <div className="scan-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setState({ kind: "idle" })}>
              <X size={16} aria-hidden /> {t("scanDiscard")}
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={state.picked.size === 0}
              onClick={() => {
                const picked = [...state.picked];
                const docIds = picked.map((k) => DOC_FOR[k]).filter((d): d is string => !!d);
                onApply(Object.fromEntries(picked.map((k) => [k, state.found[k]])) as Extracted, docIds);
                setState({ kind: "message", text: t("scanApplied"), tone: "ok" });
              }}
            >
              <Check size={16} aria-hidden /> {t("scanApply")}
            </button>
          </div>
        </div>
      )}

      {state.kind === "message" && <p className={`hint ${state.tone === "warn" ? "hint-warn" : "hint-ok"}`}>{state.text}</p>}
    </section>
  );
}
