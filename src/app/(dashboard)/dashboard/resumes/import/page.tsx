import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { PageHeader } from "@/components/layout/page-header";
import { ImportForm } from "@/components/resume/import-form";

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireUser();
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/dashboard/resumes"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to documents
      </Link>

      <PageHeader
        title="Import an existing résumé"
        description="Paste the text and we'll rebuild it as a structured document — every section editable, every template available, and a score the moment it lands."
      />

      {error === "short" && (
        <p className="mb-5 flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <AlertTriangle className="size-4 text-amber-500" />
          That was too short to parse. Paste the whole document.
        </p>
      )}

      <ImportForm />
    </div>
  );
}
