// WhatsApp webhook (Meta Cloud API).
//   GET  → webhook verification handshake (hub.challenge).
//   POST → incoming messages; replies are computed by the stateless bot in src/lib/whatsapp/bot.ts.
// Nothing about the user (phone number or answers) is stored or logged.
//
// Local testing without Meta: in development, POST {"text":"hi"} or {"id":"<reply id>"} to
// /api/whatsapp?dry=1 and the replies come back as JSON instead of being sent.
import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { handleIncoming, type InMsg } from "@/lib/whatsapp/bot";
import { sendAll, toPayload, whatsappEnabled } from "@/lib/whatsapp/cloud";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const token = process.env.WHATSAPP_VERIFY_TOKEN;
  if (token && p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === token) {
    return new Response(p.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

function validSignature(raw: string, header: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return true; // optional, but strongly recommended in production
  if (!header?.startsWith("sha256=")) return false;
  const expected = Buffer.from(`sha256=${createHmac("sha256", secret).update(raw).digest("hex")}`);
  const got = Buffer.from(header);
  return expected.length === got.length && timingSafeEqual(expected, got);
}

type WaMessage = {
  from: string;
  type: string;
  text?: { body?: string };
  interactive?: { button_reply?: { id: string }; list_reply?: { id: string } };
  button?: { payload?: string; text?: string };
};

function toInput(m: WaMessage): InMsg {
  const id = m.interactive?.button_reply?.id ?? m.interactive?.list_reply?.id ?? m.button?.payload;
  if (id) return { kind: "reply", id };
  return { kind: "text", text: m.text?.body ?? m.button?.text ?? "" };
}

export async function POST(req: Request) {
  const raw = await req.text();

  // Developer simulator: never available in production builds.
  if (process.env.NODE_ENV !== "production" && new URL(req.url).searchParams.has("dry")) {
    const body = JSON.parse(raw || "{}") as { text?: string; id?: string };
    const replies = handleIncoming(body.id ? { kind: "reply", id: body.id } : { kind: "text", text: body.text ?? "" });
    return NextResponse.json({ replies, payloads: replies.map((r) => toPayload("910000000000", r)) });
  }

  if (!validSignature(raw, req.headers.get("x-hub-signature-256"))) return new Response("Bad signature", { status: 401 });

  let body: { entry?: { changes?: { value?: { messages?: WaMessage[] } }[] }[] };
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const messages = (body.entry ?? []).flatMap((e) => (e.changes ?? []).flatMap((c) => c.value?.messages ?? []));
  if (!whatsappEnabled()) {
    if (messages.length) console.warn("[whatsapp] message received but WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID are not set");
    return NextResponse.json({ ok: true });
  }

  // Always answer 200 so Meta doesn't retry; failures are logged inside sendAll.
  for (const m of messages) await sendAll(m.from, handleIncoming(toInput(m)));
  return NextResponse.json({ ok: true });
}
