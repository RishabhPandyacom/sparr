"use client";

import { useMemo, useState } from "react";
import { Check, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TEMPLATES, TEMPLATE_TAGS, type TemplateDef } from "@/lib/resume/design";
import { DocumentPreview, buildPreviewContent } from "./preview";

type Family = "all" | "resume" | "cv";

/**
 * The template picker. Every tile is a genuine scaled render of the document
 * engine, so nothing changes when you click "Use this" except the content.
 *
 * `onPick` mode is used inside the studio (switch template live); the form mode
 * is used on the "new document" page (creates and opens the document).
 */
export function TemplateGallery({
  action,
  onPick,
  activeSlug,
  compact = false,
  initialFamily = "all",
}: {
  /** Server action invoked with `templateSlug` when picking creates a document. */
  action?: (formData: FormData) => void | Promise<void>;
  /** Live-switch callback used by the studio. */
  onPick?: (def: TemplateDef) => void;
  activeSlug?: string;
  compact?: boolean;
  initialFamily?: Family;
}) {
  const [family, setFamily] = useState<Family>(initialFamily);
  const [tag, setTag] = useState<string | null>(null);
  const [atsOnly, setAtsOnly] = useState(false);

  const visible = useMemo(
    () =>
      TEMPLATES.filter(
        (t) =>
          (family === "all" || t.family === family) &&
          (!tag || t.tags.includes(tag)) &&
          (!atsOnly || t.atsSafe),
      ),
    [family, tag, atsOnly],
  );

  const width = compact ? 168 : 232;

  return (
    <div>
      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border bg-background p-0.5">
          {(
            [
              ["all", `All ${TEMPLATES.length}`],
              ["resume", "Résumés"],
              ["cv", "CVs"],
            ] as [Family, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFamily(value)}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                family === value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setAtsOnly((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors",
            atsOnly
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-pressed={atsOnly}
        >
          <ShieldCheck className="size-4" />
          ATS-safe only
        </button>

        <div className="flex flex-wrap gap-1.5">
          {TEMPLATE_TAGS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTag((cur) => (cur === t ? null : t))}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs transition-colors",
                tag === t
                  ? "border-primary bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:border-foreground/30 hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {!visible.length && (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No templates match those filters. Clear one to see more.
        </p>
      )}

      <div
        className={cn(
          "grid gap-5",
          compact
            ? "grid-cols-2 xl:grid-cols-3"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        )}
      >
        {visible.map((def) => (
          <TemplateCard
            key={def.slug}
            def={def}
            width={width}
            active={activeSlug === def.slug}
            compact={compact}
            action={action}
            onPick={onPick}
          />
        ))}
      </div>
    </div>
  );
}

function TemplateCard({
  def,
  width,
  active,
  compact,
  action,
  onPick,
}: {
  def: TemplateDef;
  width: number;
  active: boolean;
  compact: boolean;
  action?: (formData: FormData) => void | Promise<void>;
  onPick?: (def: TemplateDef) => void;
}) {
  const content = useMemo(() => buildPreviewContent(def), [def]);

  return (
    <div
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border bg-background transition-shadow",
        active ? "border-primary ring-2 ring-primary/30" : "hover:shadow-md",
      )}
    >
      <div className="relative flex justify-center border-b bg-muted/40 p-4">
        <div className="overflow-hidden rounded-md shadow-sm ring-1 ring-black/10">
          <DocumentPreview content={content} width={width} />
        </div>
        {active && (
          <span className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="size-3.5" />
          </span>
        )}
        {def.atsSafe && (
          <span
            className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400"
            title="Single-column, no colour blocks — parses cleanly in older applicant tracking systems."
          >
            <ShieldCheck className="size-3" />
            ATS-safe
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{def.name}</h3>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            {def.family === "cv" ? "CV" : "Résumé"}
          </span>
        </div>
        <p className="flex-1 text-sm text-muted-foreground">{def.description}</p>

        {!compact && (
          <p className="text-xs text-muted-foreground/80">
            Best for: {def.bestFor.join(" · ")}
          </p>
        )}

        {onPick ? (
          <Button
            size="sm"
            variant={active ? "secondary" : "default"}
            className="mt-1 w-full"
            onClick={() => onPick(def)}
          >
            {active ? "Current template" : `Switch to ${def.name}`}
          </Button>
        ) : (
          <form action={action} className="mt-1">
            <input type="hidden" name="templateSlug" value={def.slug} />
            <Button type="submit" size="sm" className="w-full">
              <Sparkles className="size-4" />
              Use {def.name}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
