"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { importResume } from "@/lib/resume/actions";
import { parseResumeText, summarizeImport } from "@/lib/resume/parse";
import { TEMPLATES } from "@/lib/resume/design";
import { DocumentPreview } from "./preview";

/**
 * Import by paste.
 *
 * Deliberately not a PDF upload: PDF text extraction in the browser is
 * unreliable and silently mangles columns. Copying the text yourself takes ten
 * seconds and gives a far better result — and you can see exactly what was
 * recognised before anything is created.
 */
export function ImportForm() {
  const [text, setText] = useState("");
  const [docType, setDocType] = useState<"resume" | "cv">("resume");
  const [templateSlug, setTemplateSlug] = useState("graphite");

  const parsed = useMemo(
    () => (text.trim().length > 40 ? parseResumeText(text, docType) : null),
    [text, docType],
  );
  const preview = useMemo(() => {
    if (!parsed) return null;
    const def = TEMPLATES.find((t) => t.slug === templateSlug);
    return def ? { ...parsed, theme: { ...def.theme } } : parsed;
  }, [parsed, templateSlug]);

  const notes = parsed ? summarizeImport(parsed) : [];

  return (
    <form action={importResume} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <input type="hidden" name="docType" value={docType} />
      <input type="hidden" name="templateSlug" value={templateSlug} />

      <div className="space-y-4">
        <div className="flex gap-2">
          {(["resume", "cv"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setDocType(t);
                setTemplateSlug(t === "cv" ? "scholar" : "graphite");
              }}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                docType === t ? "border-primary bg-primary/5" : "hover:border-foreground/25",
              )}
            >
              {t === "cv" ? "Academic CV" : "Résumé"}
            </button>
          ))}
        </div>

        <Textarea
          name="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={22}
          required
          placeholder={PLACEHOLDER}
          className="font-mono text-xs"
        />

        <SubmitButton disabled={!parsed} />

        <p className="text-xs text-muted-foreground">
          Open your existing résumé, select all, copy, paste. Anything the parser can&apos;t
          confidently classify is kept as text in the nearest section rather than dropped — you
          won&apos;t lose a line.
        </p>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          What we found
        </p>

        {!parsed && (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Paste at least a few lines and a live preview appears here.
          </p>
        )}

        {parsed && (
          <>
            <ul className="mb-4 space-y-1 rounded-lg border bg-background p-3">
              {notes.map((n, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs">
                  <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-emerald-500" />
                  {n}
                </li>
              ))}
            </ul>

            {preview && (
              <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                <DocumentPreview content={preview} width={288} />
              </div>
            )}

            <select
              value={templateSlug}
              onChange={(e) => setTemplateSlug(e.target.value)}
              aria-label="Template"
              className="mt-3 h-9 w-full rounded-lg border bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              {TEMPLATES.filter((t) => t.family === docType).map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name}
                </option>
              ))}
            </select>
          </>
        )}
      </aside>
    </form>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={disabled || pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
      {pending ? "Importing…" : "Import and open in the editor"}
    </Button>
  );
}

const PLACEHOLDER = `Alex Chen
Senior Product Designer
alex@example.com | (555) 123-4567 | Berlin, Germany | linkedin.com/in/alexchen

SUMMARY
Product designer with six years across fintech and health…

EXPERIENCE
Senior Product Designer — Northwind          Mar 2022 – Present
Berlin, Germany
- Redesigned onboarding, lifting activation from 34% to 61%
- Built a 42-component design system used by four teams

EDUCATION
B.A. Interaction Design — TU Berlin          2015 – 2019

SKILLS
Figma, user research, prototyping, accessibility, design systems`;
