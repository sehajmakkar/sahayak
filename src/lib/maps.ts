// "Find nearest" links. We never read the user's location: the maps app uses its own location
// permission to resolve "near me", so nothing about the user passes through Yojana Setu.
import type { Channel } from "./core/types";

const QUERY: Partial<Record<Channel, string>> = {
  csc: "Common Service Centre Jan Seva Kendra",
  bank: "bank branch",
  post_office: "post office",
  gram_panchayat: "gram panchayat office",
  anganwadi: "anganwadi centre",
  health_centre: "government hospital",
  district_office: "tehsil office",
};

export function nearestUrl(channel: Channel): string | null {
  const q = QUERY[channel];
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${q} near me`)}` : null;
}
