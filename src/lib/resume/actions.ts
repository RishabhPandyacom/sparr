"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { getTemplateDef } from "./design";
import { generateDocument, type GenerationSpec } from "./generate";
import { parseResumeText } from "./parse";
import { analyzeResume } from "./analysis";
import {
  normalizeContent,
  sampleResumeContent,
  type DocType,
  type ResumeContent,
} from "./schema";
import type { Seniority } from "./roleLibrary";

// ── create ──────────────────────────────────────────────────────────────────

/** Creates a document from a template and opens the studio. */
export async function createResume(formData: FormData) {
  const user = await requireUser();
  const slug = String(formData.get("templateSlug") ?? "classic");
  const tpl = getTemplateDef(slug);
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const content = sampleResumeContent(profile?.full_name ?? "", tpl.family);
  content.theme = { ...tpl.theme };

  const id = await insertResume(user.id, {
    title: `${tpl.name} ${tpl.family === "cv" ? "CV" : "Resume"}`,
    content,
    templateSlug: tpl.slug,
    docType: tpl.family,
  });

  revalidatePath("/dashboard/resumes");
  redirect(`/dashboard/resumes/${id}/edit`);
}

/**
 * One-shot generation. Builds a complete, coherent document from a target role
 * and whatever else the person cared to tell us, then drops them straight into
 * the editor — the draft is the starting point, never the deliverable.
 */
export async function generateResume(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const str = (k: string) => String(formData.get(k) ?? "").trim();
  const targetRole = str("targetRole") || "Professional";
  const docType: DocType = str("docType") === "cv" ? "cv" : "resume";
  const templateSlug = str("templateSlug") || (docType === "cv" ? "academic" : "classic");

  const spec: GenerationSpec = {
    fullName: str("fullName") || profile?.full_name || "Your Name",
    email: str("email"),
    phone: str("phone"),
    location: str("location"),
    website: str("website"),
    linkedin: str("linkedin"),
    github: str("github"),
    targetRole,
    seniority: (str("seniority") || "entry") as Seniority,
    yearsExperience: Number(str("yearsExperience")) || undefined,
    industry: str("industry"),
    highlights: str("highlights"),
    skills: str("skills"),
    currentCompany: str("currentCompany"),
    previousCompany: str("previousCompany"),
    degree: str("degree"),
    school: str("school"),
    graduationYear: str("graduationYear"),
    jobDescription: str("jobDescription"),
    docType,
    templateSlug,
  };

  const content = generateDocument(spec);

  const id = await insertResume(user.id, {
    title: `${targetRole} ${docType === "cv" ? "CV" : "Resume"}`,
    content,
    templateSlug,
    docType,
    targetRole,
  });

  await snapshot(user.id, id, content, `${targetRole} ${docType}`, "template", "Generated draft");

  revalidatePath("/dashboard/resumes");
  redirect(`/dashboard/resumes/${id}/edit?new=1`);
}

/** Parses pasted résumé text into structured sections. */
export async function importResume(formData: FormData) {
  const user = await requireUser();
  const raw = String(formData.get("text") ?? "");
  const templateSlug = String(formData.get("templateSlug") ?? "graphite");
  const docType: DocType = String(formData.get("docType") ?? "resume") === "cv" ? "cv" : "resume";

  if (raw.trim().length < 40) {
    redirect("/dashboard/resumes/import?error=short");
  }

  const content = parseResumeText(raw, docType);
  content.theme = { ...getTemplateDef(templateSlug).theme };

  const id = await insertResume(user.id, {
    title: content.basics.fullName ? `${content.basics.fullName} — Imported` : "Imported Resume",
    content,
    templateSlug,
    docType,
  });

  await snapshot(user.id, id, content, "Imported", "import", "As imported");

  revalidatePath("/dashboard/resumes");
  redirect(`/dashboard/resumes/${id}/edit?imported=1`);
}

async function insertResume(
  userId: string,
  args: {
    title: string;
    content: ResumeContent;
    templateSlug: string;
    docType: DocType;
    targetRole?: string;
  },
): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resumes")
    .insert({
      user_id: userId,
      title: args.title,
      content: args.content as unknown as Json,
      template_slug: args.templateSlug,
      doc_type: args.docType,
      target_role: args.targetRole ?? null,
      last_score: analyzeResume(args.content).score,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Could not create the document");
  return data.id;
}

// ── save ────────────────────────────────────────────────────────────────────

/** Autosave from the studio. Cheap, frequent, non-destructive. */
export async function saveResume(
  resumeId: string,
  content: ResumeContent,
  title: string,
): Promise<{ error?: string; score?: number }> {
  const user = await requireUser();
  const supabase = await createClient();
  const score = analyzeResume(content).score;

  const { error } = await supabase
    .from("resumes")
    .update({ content: content as unknown as Json, title, last_score: score })
    .eq("id", resumeId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/resumes");
  return { score };
}

/** Persists a template switch (theme lives in the content, slug on the row). */
export async function setTemplate(
  resumeId: string,
  templateSlug: string,
  content: ResumeContent,
): Promise<{ error?: string }> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("resumes")
    .update({ template_slug: templateSlug, content: content as unknown as Json })
    .eq("id", resumeId)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/resumes");
  return {};
}

// ── versions ────────────────────────────────────────────────────────────────

async function snapshot(
  userId: string,
  resumeId: string,
  content: ResumeContent,
  title: string,
  reason: string,
  label?: string,
) {
  const supabase = await createClient();
  await supabase.from("resume_versions").insert({
    resume_id: resumeId,
    user_id: userId,
    content: content as unknown as Json,
    title,
    reason,
    label: label ?? null,
    score: analyzeResume(content).score,
  });
}

/** Explicit "save a version" from the studio. */
export async function saveVersion(
  resumeId: string,
  content: ResumeContent,
  title: string,
  label: string,
): Promise<{ error?: string }> {
  const user = await requireUser();
  try {
    await snapshot(user.id, resumeId, content, title, "manual", label || undefined);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save the version" };
  }
  revalidatePath(`/dashboard/resumes/${resumeId}/edit`);
  return {};
}

export async function listVersions(resumeId: string) {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("resume_versions")
    .select("id, label, reason, score, created_at")
    .eq("resume_id", resumeId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);
  return data ?? [];
}

export async function restoreVersion(
  resumeId: string,
  versionId: string,
): Promise<{ error?: string; content?: ResumeContent; title?: string }> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: version } = await supabase
    .from("resume_versions")
    .select("content, title")
    .eq("id", versionId)
    .eq("user_id", user.id)
    .single();

  if (!version) return { error: "That version no longer exists." };

  // Snapshot where we are now, so restoring is itself undoable.
  const { data: current } = await supabase
    .from("resumes")
    .select("content, title")
    .eq("id", resumeId)
    .eq("user_id", user.id)
    .single();
  if (current) {
    await snapshot(
      user.id,
      resumeId,
      normalizeContent(current.content),
      current.title,
      "manual",
      "Before restore",
    );
  }

  const content = normalizeContent(version.content);
  const { error } = await supabase
    .from("resumes")
    .update({
      content: content as unknown as Json,
      title: version.title,
      last_score: analyzeResume(content).score,
    })
    .eq("id", resumeId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/resumes/${resumeId}/edit`);
  return { content, title: version.title };
}

// ── document management ─────────────────────────────────────────────────────

export async function deleteResume(formData: FormData) {
  const user = await requireUser();
  const resumeId = String(formData.get("resumeId"));
  const supabase = await createClient();
  await supabase.from("resumes").delete().eq("id", resumeId).eq("user_id", user.id);
  revalidatePath("/dashboard/resumes");
}

/** Duplicates a document — the basis of "one tailored résumé per application". */
export async function duplicateResume(formData: FormData) {
  const user = await requireUser();
  const resumeId = String(formData.get("resumeId"));
  const suffix = String(formData.get("suffix") ?? "").trim();
  const supabase = await createClient();

  const { data: source } = await supabase
    .from("resumes")
    .select("title, content, template_slug, doc_type, target_role")
    .eq("id", resumeId)
    .eq("user_id", user.id)
    .single();

  if (!source) return;

  const { data: copy } = await supabase
    .from("resumes")
    .insert({
      user_id: user.id,
      title: suffix ? `${source.title} — ${suffix}` : `${source.title} (copy)`,
      content: source.content,
      template_slug: source.template_slug,
      doc_type: source.doc_type,
      target_role: source.target_role,
    })
    .select("id")
    .single();

  revalidatePath("/dashboard/resumes");
  if (copy) redirect(`/dashboard/resumes/${copy.id}/edit`);
}

export async function setPrimaryResume(formData: FormData) {
  const user = await requireUser();
  const resumeId = String(formData.get("resumeId"));
  const supabase = await createClient();
  await supabase.from("resumes").update({ is_primary: false }).eq("user_id", user.id);
  await supabase
    .from("resumes")
    .update({ is_primary: true })
    .eq("id", resumeId)
    .eq("user_id", user.id);
  revalidatePath("/dashboard/resumes");
}

// ── sharing ─────────────────────────────────────────────────────────────────

/**
 * Publishes or unpublishes a read-only public link. Anonymous readers can only
 * ever see rows the owner has explicitly flagged (enforced in RLS, not here).
 */
export async function toggleShare(
  resumeId: string,
  makePublic: boolean,
): Promise<{ error?: string; slug?: string | null }> {
  const user = await requireUser();
  const supabase = await createClient();

  if (!makePublic) {
    const { error } = await supabase
      .from("resumes")
      .update({ is_public: false })
      .eq("id", resumeId)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
    revalidatePath(`/dashboard/resumes/${resumeId}/edit`);
    return { slug: null };
  }

  const { data: existing } = await supabase
    .from("resumes")
    .select("share_slug")
    .eq("id", resumeId)
    .eq("user_id", user.id)
    .single();

  const slug = existing?.share_slug || randomSlug();
  const { error } = await supabase
    .from("resumes")
    .update({ is_public: true, share_slug: slug })
    .eq("id", resumeId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/resumes/${resumeId}/edit`);
  return { slug };
}

/** URL-safe, unguessable, and short enough to paste into a message. */
function randomSlug(): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(14);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

// ── bullet library ──────────────────────────────────────────────────────────

export async function saveBullet(text: string, sourceRole?: string): Promise<{ error?: string }> {
  const user = await requireUser();
  const clean = text.trim();
  if (!clean) return { error: "Nothing to save." };
  const supabase = await createClient();
  const { error } = await supabase.from("bullet_library").insert({
    user_id: user.id,
    text: clean,
    source_role: sourceRole ?? null,
  });
  if (error) return { error: error.message };
  return {};
}

export async function listBullets() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("bullet_library")
    .select("id, text, source_role, times_used, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  return data ?? [];
}

export async function deleteBullet(id: string): Promise<{ error?: string }> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("bullet_library")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  return {};
}
