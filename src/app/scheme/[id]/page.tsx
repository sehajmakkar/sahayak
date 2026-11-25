import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SCHEMES, SCHEME_BY_ID } from "@/lib/schemes";
import { SchemeDetail } from "./SchemeDetail";

export const dynamicParams = false;

export function generateStaticParams() {
  return SCHEMES.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const s = SCHEME_BY_ID[id];
  return s ? { title: `${s.name.en} — Yojana Setu`, description: s.benefit.en } : {};
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!SCHEME_BY_ID[id]) notFound();
  return <SchemeDetail id={id} />;
}
