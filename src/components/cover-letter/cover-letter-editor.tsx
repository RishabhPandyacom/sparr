"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveCoverLetter } from "@/lib/cover-letter/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function CoverLetterEditor({
  id,
  title,
  initialText,
}: {
  id: string;
  title: string;
  initialText: string;
}) {
  const [text, setText] = useState(initialText);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleSave = useCallback(
    (next: string) => {
      setSaveState("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        const res = await saveCoverLetter(id, next);
        if (res.error) {
          setSaveState("idle");
          toast.error("Couldn't save", { description: res.error });
        } else {
          setSaveState("saved");
          setTimeout(() => setSaveState("idle"), 1500);
        }
      }, 800);
    },
    [id],
  );

  function handleChange(next: string) {
    setText(next);
    scheduleSave(next);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success("Copied to clipboard");
  }

  function handleDownload() {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "cover-letter"}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/cover-letters">
            <ArrowLeft className="size-4" />
            Cover letters
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">{title}</h1>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {saveState === "saving" && (
            <>
              <Loader2 className="size-3.5 animate-spin" /> Saving…
            </>
          )}
          {saveState === "saved" && (
            <>
              <Check className="size-3.5 text-emerald-500" /> Saved
            </>
          )}
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            Copy
          </Button>
          <Button size="sm" onClick={handleDownload}>
            <Download className="size-4" />
            Download
          </Button>
        </div>
      </div>

      <Textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        className="min-h-[60vh] bg-white p-6 font-serif text-[13px] leading-relaxed shadow-sm"
        aria-label="Cover letter"
      />
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Edit freely — changes save automatically.
      </p>
    </div>
  );
}
