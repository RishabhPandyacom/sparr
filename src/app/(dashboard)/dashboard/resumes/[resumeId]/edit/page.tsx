import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { normalizeContent, type DocType } from "@/lib/resume/schema";
import { getTemplateDef } from "@/lib/resume/design";
import { ResumeStudio } from "@/components/resume/studio/studio";

export default async function EditResumePage({
  params,
}: {
  params: Promise<{ resumeId: string }>;
}) {
  const { resumeId } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: resume } = await supabase
    .from("resumes")
    .select("id, title, content, template_slug, doc_type, share_slug, is_public")
    .eq("id", resumeId)
    .eq("user_id", user.id)
    .single();

  if (!resume) notFound();

  const content = normalizeContent(resume.content, resume.doc_type as DocType);
  // A document created before its theme existed still gets the template's look.
  if (!("layout" in content.theme)) {
    content.theme = { ...getTemplateDef(resume.template_slug).theme };
  }

  return (
    // Cancel the dashboard shell's padding so the studio owns the whole viewport
    // below the header — an editor with a gutter around it is a toy.
    <div className="-m-6 h-[calc(100svh-3.5rem)]">
      <ResumeStudio
        resumeId={resume.id}
        initialContent={content}
        initialTitle={resume.title}
        templateSlug={resume.template_slug}
        shareSlug={resume.share_slug}
        isPublic={resume.is_public}
      />
    </div>
  );
}
