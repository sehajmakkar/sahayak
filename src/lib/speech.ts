// Free, built-in browser speech: speechSynthesis (read aloud) + SpeechRecognition (voice answers).
import type { Lang } from "./core/types";
import { SPEECH_LOCALE, WORDS } from "./i18n/words";

const bcp = (lang: Lang) => SPEECH_LOCALE[lang];

export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

export function speak(text: string, lang: Lang, onEnd?: () => void) {
  if (!canSpeak()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/[•·|]/g, ",").replace(/₹/g, WORDS[lang].rupees));
  u.lang = bcp(lang);
  u.rate = 0.9;
  const voice = synth.getVoices().find((v) => v.lang.replace("_", "-").toLowerCase().startsWith(bcp(lang).toLowerCase()));
  if (voice) u.voice = voice;
  if (onEnd) u.onend = onEnd;
  synth.speak(u);
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecognition = any;

function getRecognitionCtor(): AnyRecognition | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export const canListen = () => getRecognitionCtor() !== null;

/** Listen once; resolves with the transcript (or "" on error / silence). */
export function listenOnce(lang: Lang): { promise: Promise<string>; stop: () => void } {
  const Ctor = getRecognitionCtor();
  if (!Ctor) return { promise: Promise.resolve(""), stop: () => {} };
  const rec: AnyRecognition = new Ctor();
  rec.lang = bcp(lang);
  rec.interimResults = false;
  rec.maxAlternatives = 3;
  const promise = new Promise<string>((resolve) => {
    let done = false;
    const finish = (t: string) => {
      if (!done) {
        done = true;
        resolve(t);
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const alts = Array.from(e.results[0] ?? []) as { transcript: string }[];
      finish(alts.map((a) => a.transcript).join(" | "));
    };
    rec.onerror = () => finish("");
    rec.onend = () => finish("");
    try {
      rec.start();
    } catch {
      finish("");
    }
  });
  return { promise, stop: () => rec.stop() };
}
