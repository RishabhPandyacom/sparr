import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { normalizeContent, type DocType } from "@/lib/resume/schema";
import { PublicResume } from "@/components/resume/public-resume";

/**
 * Public read-only view of a shared document.
 *
 * The row is only visible to anonymous readers while its owner has published
 * it — that's a database policy, not a check in this file, so an unpublished
 * document can't leak even if this page were wrong.
 */

export const dynamic = "force-dynamic";

async function loadShared(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("resumes")
    .select("title, content, doc_type, is_public")
    .eq("share_slug", slug)
    .eq("is_public", true)
    .maybeSingle();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const row = await loadShared(slug);
  if (!row) return { title: "Not found" };
  const content = normalizeContent(row.content, row.doc_type as DocType);
  const name = content.basics.fullName || row.title;
  return {
    title: `${name} — ${content.basics.title || (row.doc_type === "cv" ? "CV" : "Résumé")}`,
    description: content.basics.summary?.slice(0, 160) || undefined,
    robots: { index: false, follow: false },
  };
}

export default async function SharedResumePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const row = await loadShared(slug);
  if (!row) notFound();

  const content = normalizeContent(row.content, row.doc_type as DocType);
  return <PublicResume content={content} title={row.title} />;
}
