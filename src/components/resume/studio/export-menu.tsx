"use client";

import { useState } from "react";
import { Download, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EXPORT_LABELS, exportResume, type ExportFormat } from "@/lib/resume/export";
import type { ResumeContent } from "@/lib/resume/schema";

const ORDER: ExportFormat[] = ["pdf", "docx", "txt", "md", "html", "json"];

/**
 * Six formats, all generated in the browser from the same document — no server
 * round-trip, no format drift. The plain-text export exists because some job
 * boards still parse better from it than from any PDF.
 */
export function ExportMenu({ content, title }: { content: ResumeContent; title: string }) {
  const [busy, setBusy] = useState<ExportFormat | null>(null);

  async function run(format: ExportFormat) {
    setBusy(format);
    try {
      await exportResume(format, content, title);
    } catch (e) {
      toast.error(`${EXPORT_LABELS[format].label} export failed`, {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground outline-none transition-colors hover:bg-primary/85 focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label="Download"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
        Download
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {ORDER.map((format) => (
          <DropdownMenuItem
            key={format}
            nativeButton
            render={<button type="button" className="w-full" />}
            onClick={() => run(format)}
          >
            <span className="flex min-w-0 flex-col items-start">
              <span className="text-sm font-medium">{EXPORT_LABELS[format].label}</span>
              <span className="text-xs text-muted-foreground">{EXPORT_LABELS[format].hint}</span>
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          nativeButton
          render={<button type="button" className="w-full" />}
          onClick={() => window.print()}
        >
          <Printer className="size-4" />
          <span className="flex min-w-0 flex-col items-start">
            <span className="text-sm font-medium">Print</span>
            <span className="text-xs text-muted-foreground">
              Uses your browser&apos;s print dialog.
            </span>
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function QuickPdfButton({
  content,
  title,
}: {
  content: ResumeContent;
  title: string;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={busy}
      onClick={async () => {
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
      }}
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
      PDF
    </Button>
  );
}
