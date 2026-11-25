// Meta WhatsApp Cloud API transport (free tier: replies inside a user-started conversation are free).
// Plain fetch, no SDK. Configured with WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID.
import type { OutMsg } from "./bot";

const GRAPH = "https://graph.facebook.com/v21.0";

export const whatsappEnabled = () => Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);

/** Cloud API "messages" payload for one outgoing message. */
export function toPayload(to: string, m: OutMsg): Record<string, unknown> {
  const base = { messaging_product: "whatsapp", recipient_type: "individual", to };
  if (m.type === "text") return { ...base, type: "text", text: { body: m.body, preview_url: true } };
  if (m.type === "buttons")
    return {
      ...base,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: m.body },
        action: { buttons: m.buttons.map((b) => ({ type: "reply", reply: { id: b.id, title: b.title } })) },
      },
    };
  return {
    ...base,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: m.body },
      action: { button: m.button, sections: [{ title: "Yojana Setu", rows: m.rows }] },
    },
  };
}

/** Sends messages in order. Returns false if any send failed (never throws). */
export async function sendAll(to: string, msgs: OutMsg[]): Promise<boolean> {
  let ok = true;
  for (const m of msgs) {
    try {
      const res = await fetch(`${GRAPH}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
        body: JSON.stringify(toPayload(to, m)),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        ok = false;
        console.error("[whatsapp] send failed", res.status, (await res.text()).slice(0, 300));
      }
    } catch (e) {
      ok = false;
      console.error("[whatsapp] send error", (e as Error).message);
    }
  }
  return ok;
}
