"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Loader2, Printer, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ResumeDocument } from "./doc/document";
import { exportResume } from "@/lib/resume/export";
import type { ResumeContent } from "@/lib/resume/schema";

/**
 * The share page a recruiter actually opens: the document, full size, with a
 * download button and nothing else in the way. Printing gives them the document
 * alone — no header, no branding bar.
 */
export function PublicResume({
  content,
  title,
}: {
  content: ResumeContent;
  title: string;
}) {
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      await exportResume("pdf", content, title);
    } catch (e) {
      toast.error("PDF export failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-svh bg-muted/40">
      <style>{`@media print { body { background:#fff !important } [data-share-chrome]{display:none !important} [data-share-page]{padding:0 !important} [data-resume-page]{box-shadow:none !important} @page{margin:0} }`}</style>

      <header
        data-share-chrome
        className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/90 px-4 py-2.5 backdrop-blur"
      >
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-3.5" />
          </span>
          Sparr
        </Link>
        <span className="hidden text-sm text-muted-foreground sm:inline">
          Shared {content.docType === "cv" ? "CV" : "résumé"}
        </span>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => window.print()}>
            <Printer className="size-4" />
            <span className="hidden sm:inline">Print</span>
          </Button>
          <Button size="sm" onClick={download} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            Download PDF
          </Button>
        </div>
      </header>

      <main data-share-page className="flex justify-center overflow-x-auto p-4 sm:p-8">
        <div className="w-fit rounded-lg shadow-xl ring-1 ring-black/10">
          <ResumeDocument content={content} />
        </div>
      </main>

      <footer data-share-chrome className="pb-10 text-center text-xs text-muted-foreground">
        Built with{" "}
        <Link href="/" className="underline underline-offset-2 hover:text-foreground">
          Sparr
        </Link>
      </footer>
    </div>
  );
}
