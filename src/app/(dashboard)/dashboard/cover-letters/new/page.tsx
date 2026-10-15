import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { generateCoverLetter } from "@/lib/cover-letter/actions";
import { PageHeader } from "@/components/layout/page-header";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default async function NewCoverLetterPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: resumes } = await supabase
    .from("resumes")
    .select("id, title")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/cover-letters"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back
      </Link>
      <PageHeader
        title="New cover letter"
        description="Paste the job description — we'll tailor a letter to it."
      />

      <form action={generateCoverLetter} className="grid gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="companyName">Company</Label>
            <Input id="companyName" name="companyName" placeholder="Acme Inc." />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role">Role</Label>
            <Input id="role" name="role" placeholder="Frontend Engineer" />
          </div>
        </div>

        {resumes && resumes.length > 0 && (
          <div className="grid gap-2">
            <Label htmlFor="resumeId">Use a resume for context (optional)</Label>
            <select
              id="resumeId"
              name="resumeId"
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring"
              defaultValue=""
            >
              <option value="">Don&apos;t use a resume</option>
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="jobDescription">Job description</Label>
          <Textarea
            id="jobDescription"
            name="jobDescription"
            required
            rows={10}
            placeholder="Paste the full job description here…"
          />
        </div>

        <SubmitButton>
          <Sparkles className="size-4" />
          Generate cover letter
        </SubmitButton>
      </form>
    </div>
  );
}
