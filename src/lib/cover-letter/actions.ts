"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { getAiProvider } from "@/lib/ai";
import { buildCoverLetterPrompt } from "@/lib/ai/prompts/coverLetter";
import { allSkills, getEntries, normalizeContent } from "@/lib/resume/schema";
import { createNotification } from "@/lib/notifications/service";

/** Generates a cover letter via the AI provider and saves it. */
export async function generateCoverLetter(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const jobDescription = String(formData.get("jobDescription") ?? "").trim();
  const companyName = String(formData.get("companyName") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const resumeId = String(formData.get("resumeId") ?? "").trim();

  if (!jobDescription) {
    redirect("/dashboard/cover-letters/new?error=jd");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  // Optional resume context to make the letter more specific.
  let resumeSummary: string | undefined;
  if (resumeId) {
    const { data: resume } = await supabase
      .from("resumes")
      .select("content")
      .eq("id", resumeId)
      .eq("user_id", user.id)
      .single();
    if (resume) {
      const c = normalizeContent(resume.content);
      resumeSummary = [
        c.basics.summary,
        `Skills: ${allSkills(c).slice(0, 20).join(", ")}`,
        ...getEntries(c, "experience").map((e) =>
          [e.title, e.subtitle].filter(Boolean).join(" at "),
        ),
      ]
        .filter(Boolean)
        .join("\n");
    }
  }

  const ai = getAiProvider();
  const result = await ai.generateText(
    buildCoverLetterPrompt({
      jobDescription,
      companyName: companyName || undefined,
      role: role || undefined,
      applicantName: profile?.full_name || undefined,
      resumeSummary,
    }),
  );

  const { data: row, error } = await supabase
    .from("cover_letters")
    .insert({
      user_id: user.id,
      resume_id: resumeId || null,
      title: role ? `${role}${companyName ? ` — ${companyName}` : ""}` : "Cover Letter",
      job_description: jobDescription,
      company_name: companyName || null,
      generated_content: result.content,
      ai_provider: result.provider,
      ai_model: result.model,
    })
    .select("id")
    .single();

  if (error || !row) throw new Error(error?.message ?? "Could not save cover letter");

  await createNotification(user.id, {
    type: "cover_letter",
    title: "Cover letter ready",
    body: role ? `Your ${role} cover letter is ready to review.` : "Your cover letter is ready.",
    link: `/dashboard/cover-letters/${row.id}/edit`,
  });

  revalidatePath("/dashboard/cover-letters");
  redirect(`/dashboard/cover-letters/${row.id}/edit`);
}

/** Saves user edits to a cover letter. */
export async function saveCoverLetter(
  id: string,
  editedContent: string,
): Promise<{ error?: string }> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("cover_letters")
    .update({ edited_content: editedContent })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/cover-letters");
  return {};
}

export async function deleteCoverLetter(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("cover_letters").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/dashboard/cover-letters");
}
