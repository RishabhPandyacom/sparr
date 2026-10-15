import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { PageHeader } from "@/components/layout/page-header";
import { InterviewSetup } from "@/components/interview/interview-setup";

export default async function NewInterviewPage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/interviews"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back
      </Link>
      <PageHeader
        title="Start a mock interview"
        description="Pick a format and topic. We'll take it from there."
      />
      <InterviewSetup />
    </div>
  );
}
