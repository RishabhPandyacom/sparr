import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { GenerateForm } from "@/components/resume/generate-form";

export default async function GeneratePage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/dashboard/resumes"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to documents
      </Link>

      <PageHeader
        title="Generate from a role"
        description="Type the job you're going for. You'll get a complete, structured draft — sections, dated roles, quantified bullet patterns, the right skills — and then you edit it like any other document."
      />

      <GenerateForm defaultName={profile?.full_name ?? ""} />
    </div>
  );
}
