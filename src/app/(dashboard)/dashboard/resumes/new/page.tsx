import Link from "next/link";
import { ArrowLeft, FileUp, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { createResume } from "@/lib/resume/actions";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { TemplateGallery } from "@/components/resume/template-gallery";
import { TEMPLATES } from "@/lib/resume/design";

export default async function NewResumePage() {
  await requireUser();
  const resumes = TEMPLATES.filter((t) => t.family === "resume").length;
  const cvs = TEMPLATES.length - resumes;

  return (
    <div className="mx-auto max-w-7xl">
      <Link
        href="/dashboard/resumes"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to documents
      </Link>

      <PageHeader
        title="Choose a starting point"
        description={`${resumes} résumé styles and ${cvs} academic CV styles. Every preview below is a real render — nothing changes when you pick one except the words.`}
      >
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/resumes/import">
              <FileUp className="size-4" />
              Import existing
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/resumes/generate">
              <Sparkles className="size-4" />
              Generate from a role
            </Link>
          </Button>
        </div>
      </PageHeader>

      <TemplateGallery action={createResume} />
    </div>
  );
}
