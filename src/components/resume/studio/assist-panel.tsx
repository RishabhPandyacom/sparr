"use client";

import { useEffect, useState, useTransition } from "react";
import { BookmarkPlus, Check, Library, RotateCcw, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { REWRITE_MODES, rewriteBullet, rewriteSummary, type RewriteMode } from "@/lib/resume/rewrite";
import { matchKeywords } from "@/lib/resume/keywords";
import * as m from "@/lib/resume/mutations";
import { allSkills, getEntries, type ResumeContent, type Section } from "@/lib/resume/schema";
import { deleteBullet, listBullets, saveBullet } from "@/lib/resume/actions";

type Proposal = {
  sectionId: string;
  entryId: string;
  index: number;
  mode: RewriteMode;
  before: string;
  after: string;
  notes: string[];
};

type SavedBullet = {
  id: string;
  text: string;
  source_role: string | null;
  times_used: number;
  created_at: string;
};

/**
 * The writing assistant.
 *
 * Every suggestion is shown as a before/after with the reasoning spelled out,
 * and nothing is applied until you accept it. Where a fact is missing it
 * inserts a visible `[…]` prompt rather than inventing a statistic — a résumé
 * with a made-up number is worse than one without.
 */
export function AssistPanel({
  content,
  onChange,
  jobDescription,
}: {
  content: ResumeContent;
  onChange: (c: ResumeContent) => void;
  jobDescription: string;
}) {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [library, setLibrary] = useState<SavedBullet[] | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [pending, startTransition] = useTransition();

  const keywords = jobDescription.trim()
    ? matchKeywords(jobDescription, content).missing.slice(0, 8).map((k) => k.term)
    : [];

  const entrySections = content.sections.filter(
    (s): s is Extract<Section, { kind: "entries" }> => s.kind === "entries" && s.visible,
  );

  useEffect(() => {
    if (!showLibrary || library) return;
    startTransition(async () => {
      setLibrary((await listBullets()) as SavedBullet[]);
    });
  }, [showLibrary, library]);

  function propose(sectionId: string, entryId: string, index: number, text: string, mode: RewriteMode) {
    const result = rewriteBullet(text, mode, { keywords });
    if (!result.changed) {
      toast.info("Nothing to change", {
        description: "That bullet already passes this check.",
      });
      return;
    }
    setProposal({ sectionId, entryId, index, mode, before: text, after: result.text, notes: result.notes });
  }

  function accept() {
    if (!proposal) return;
    onChange(
      m.setBullet(content, proposal.sectionId, proposal.entryId, proposal.index, proposal.after),
    );
    setProposal(null);
  }

  function improveSummary() {
    const exp = getEntries(content, "experience");
    const strongest = exp
      .flatMap((e) => e.bullets)
      .filter(Boolean)
      .sort((a, b) => scoreBullet(b) - scoreBullet(a))[0];

    const next = rewriteSummary({
      role: content.basics.title || "Professional",
      topSkills: allSkills(content).slice(0, 4),
      strongestBullet: strongest,
    });
    onChange(m.setSummary(content, next));
    toast.success("Summary rewritten", {
      description: "Built from what your document already claims — edit it to sound like you.",
    });
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border bg-background p-3">
        <h4 className="text-sm font-semibold">Summary</h4>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Rebuilt from your own strongest evidence — it can only reference things the document
          already says.
        </p>
        <Button size="sm" variant="outline" className="mt-2 w-full" onClick={improveSummary}>
          <Sparkles className="size-4" />
          Rewrite my summary
        </Button>
      </section>

      {proposal && (
        <section className="rounded-xl border border-primary/40 bg-primary/5 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
            {REWRITE_MODES.find((r) => r.mode === proposal.mode)?.label}
          </p>
          <p className="rounded-md bg-background/70 p-2 text-xs text-muted-foreground line-through decoration-rose-400/60">
            {proposal.before}
          </p>
          <p className="mt-1.5 rounded-md bg-background p-2 text-xs">{proposal.after}</p>
          {!!proposal.notes.length && (
            <ul className="mt-2 space-y-0.5">
              {proposal.notes.map((n, i) => (
                <li key={i} className="text-[11px] text-muted-foreground">
                  · {n}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 flex gap-2">
            <Button size="sm" className="flex-1" onClick={accept}>
              <Check className="size-4" />
              Accept
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setProposal(null)}>
              <X className="size-4" />
              Discard
            </Button>
          </div>
        </section>
      )}

      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Bullets
        </h4>
        {!entrySections.some((s) => s.entries.some((e) => e.bullets.some(Boolean))) && (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Add a bullet or two and they&apos;ll show up here with rewrite options.
          </p>
        )}
        <div className="space-y-3">
          {entrySections.map((section) =>
            section.entries.map((entry) =>
              entry.bullets.map((bullet, index) =>
                bullet.trim() ? (
                  <div key={`${entry.id}-${index}`} className="rounded-lg border bg-background p-2.5">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {section.label} · {entry.title || "Untitled"}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed">{bullet}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {REWRITE_MODES.filter(
                        (r) => r.mode !== "keywords" || keywords.length > 0,
                      ).map((r) => (
                        <button
                          key={r.mode}
                          type="button"
                          title={r.hint}
                          onClick={() => propose(section.id, entry.id, index, bullet, r.mode)}
                          className="rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                        >
                          {r.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        title="Save to your bullet library"
                        onClick={() =>
                          startTransition(async () => {
                            const res = await saveBullet(bullet, entry.title);
                            if (res.error) toast.error(res.error);
                            else {
                              setLibrary(null);
                              toast.success("Saved to your bullet library");
                            }
                          })
                        }
                        className="ml-auto rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                      >
                        <BookmarkPlus className="inline size-3" />
                      </button>
                    </div>
                  </div>
                ) : null,
              ),
            ),
          )}
        </div>
      </section>

      <section>
        <button
          type="button"
          onClick={() => setShowLibrary((v) => !v)}
          className="flex w-full items-center gap-2 rounded-lg border bg-background p-2.5 text-left text-sm font-medium transition-colors hover:bg-muted/40"
        >
          <Library className="size-4" />
          Bullet library
          <span className="ml-auto text-xs text-muted-foreground">
            {library ? library.length : showLibrary && pending ? "…" : ""}
          </span>
        </button>

        {showLibrary && (
          <div className="mt-2 space-y-2">
            {library?.length === 0 && (
              <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                Nothing saved yet. Bookmark a bullet above and it&apos;ll be one click away in
                every future document.
              </p>
            )}
            {library?.map((b) => (
              <div key={b.id} className="rounded-lg border bg-background p-2.5">
                <p className="text-xs leading-relaxed">{b.text}</p>
                <div className="mt-1.5 flex items-center gap-1">
                  {b.source_role && (
                    <span className="text-[10px] text-muted-foreground">{b.source_role}</span>
                  )}
                  <Button
                    size="xs"
                    variant="ghost"
                    className="ml-auto"
                    onClick={() => {
                      const target = entrySections[0];
                      const entry = target?.entries[0];
                      if (!target || !entry) {
                        toast.error("Add an experience entry first.");
                        return;
                      }
                      onChange(m.addBullet(content, target.id, entry.id, b.text));
                      toast.success(`Added to ${entry.title || target.label}`);
                    }}
                  >
                    <RotateCcw className="size-3" />
                    Insert
                  </Button>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    aria-label="Delete saved bullet"
                    onClick={() =>
                      startTransition(async () => {
                        await deleteBullet(b.id);
                        setLibrary((cur) => cur?.filter((x) => x.id !== b.id) ?? null);
                      })
                    }
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className={cn("px-1 text-xs text-muted-foreground", pending && "opacity-60")}>
        Rewrites run locally and instantly — no credits, no waiting. Anything in square brackets
        is a prompt for you to fill in, never a number we invented.
      </p>
    </div>
  );
}

/** Rough "which bullet is the best evidence" heuristic for the summary rewrite. */
function scoreBullet(text: string): number {
  let n = Math.min(text.length, 160) / 40;
  if (/\d/.test(text)) n += 3;
  if (/%|\$|x\b/i.test(text)) n += 2;
  return n;
}
