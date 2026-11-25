// Optional AI step: re-rank an already-filtered shortlist and write simple explanations.
// The model can only choose from IDs we send; anything else is dropped.
import { NextResponse } from "next/server";
import { z } from "zod";
import { SCHEME_BY_ID } from "@/lib/schemes";
import { completeJSON, llmEnabled, parseJSON } from "@/lib/llm/provider";

const Body = z.object({
  lang: z.enum(["en", "hi", "bn", "mr", "ta"]),
  profile: z.array(z.string().max(160)).max(30),
  needText: z.string().max(400).optional(),
  candidates: z
    .array(z.object({ id: z.string(), status: z.enum(["likely", "maybe"]), reasons: z.array(z.string().max(200)).max(8) }))
    .min(1)
    .max(15),
});

const Item = z.object({ id: z.string(), why: z.string().min(1) });

export async function POST(req: Request) {
  if (!llmEnabled()) return NextResponse.json({ enabled: false });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ enabled: true, error: "bad_request" }, { status: 400 });
  const { lang, profile, needText, candidates } = parsed.data;

  const allowed = candidates.filter((c) => SCHEME_BY_ID[c.id]);
  const list = allowed
    .map((c) => {
      const s = SCHEME_BY_ID[c.id];
      return `- id: ${s.id}\n  name: ${s.name.en}\n  benefit: ${s.benefit.en}\n  match: ${c.status}\n  reasons: ${c.reasons.join("; ")}`;
    })
    .join("\n");

  const language = {
    en: "simple English",
    hi: "simple Hindi (Devanagari script)",
    bn: "simple Bengali (Bengali script)",
    mr: "simple Marathi (Devanagari script)",
    ta: "simple Tamil (Tamil script)",
  }[lang];
  const system = [
    "You help poor and low-literacy people in rural India understand government schemes.",
    "You receive a person's profile and a shortlist of schemes that already passed eligibility checks.",
    "Task: order the schemes from most to least useful for THIS person (consider their stated need, benefit size, urgency),",
    `and for each write ONE short sentence (max 25 words) in ${language} saying why it helps them. Use words a Class-5 student understands.`,
    "Rules: use ONLY the ids given. Do not invent schemes, amounts or links. Do not promise eligibility — say 'may'.",
    'Reply as JSON: {"ranked":[{"id":"...","why":"..."}]}',
  ].join("\n");
  const user = `Profile:\n${profile.join("\n")}\n${needText ? `Need (in their words): ${needText}\n` : ""}\nShortlist:\n${list}`;

  const raw = parseJSON(await completeJSON(system, user));
  // Accept {"ranked":[...]} or a bare array; validate item by item so one bad item doesn't drop all.
  const items: unknown[] = Array.isArray(raw) ? raw : Array.isArray((raw as { ranked?: unknown })?.ranked) ? (raw as { ranked: unknown[] }).ranked : [];
  if (items.length === 0) console.warn("[enhance] no usable AI output");

  const ids = new Set(allowed.map((c) => c.id));
  const seen = new Set<string>();
  const ranked: { id: string; why: string }[] = [];
  for (const it of items) {
    const r = Item.safeParse(it);
    if (!r.success || !ids.has(r.data.id) || seen.has(r.data.id)) continue; // never accept unknown IDs
    seen.add(r.data.id);
    ranked.push({ id: r.data.id, why: r.data.why.slice(0, 300) });
  }
  return NextResponse.json({ enabled: true, ranked: ranked.length ? ranked : null });
}
