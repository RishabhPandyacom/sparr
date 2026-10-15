"use client";

import { useMemo, useState } from "react";
import { Plus, Target, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { matchKeywords, guessRoleFromJd } from "@/lib/resume/keywords";
import * as m from "@/lib/resume/mutations";
import type { ResumeContent } from "@/lib/resume/schema";

/**
 * Job-description tailoring.
 *
 * Extracts what the posting actually screens for, weights it, and shows what
 * your document already covers versus what it doesn't — the same comparison an
 * ATS makes, run locally so you can iterate for free.
 *
 * Missing keywords are opt-in one at a time, deliberately. Bulk-stuffing a
 * résumé with terms you can't defend in an interview is how people get caught.
 */
export function TailorPanel({
  content,
  onChange,
  jobDescription,
  onJobDescriptionChange,
}: {
  content: ResumeContent;
  onChange: (c: ResumeContent) => void;
  jobDescription: string;
  onJobDescriptionChange: (v: string) => void;
}) {
  const [draft, setDraft] = useState(jobDescription);
  const match = useMemo(
    () => (jobDescription.trim() ? matchKeywords(jobDescription, content) : null),
    [jobDescription, content],
  );
  const guessedRole = useMemo(
    () => (jobDescription.trim() ? guessRoleFromJd(jobDescription) : null),
    [jobDescription],
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Paste the job description
        </label>
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={7}
          placeholder="Paste the full posting — responsibilities, requirements, nice-to-haves. The more you paste, the better the match."
          className="text-xs"
        />
        <div className="mt-2 flex gap-2">
          <Button size="sm" className="flex-1" onClick={() => onJobDescriptionChange(draft)}>
            <Target className="size-4" />
            Match against this job
          </Button>
          {jobDescription && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setDraft("");
                onJobDescriptionChange("");
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {!match && (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Your job-match score is held at a neutral 50% until you paste a posting. Add one and
          the score, the missing-keyword list, and the bullet suggestions all become specific to
          that role.
        </p>
      )}

      {match && (
        <>
          <div className="rounded-xl border bg-background p-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium">Keyword coverage</span>
              <span className="text-lg font-semibold tabular-nums">{match.coverage}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  match.coverage >= 70
                    ? "bg-emerald-500"
                    : match.coverage >= 45
                      ? "bg-amber-500"
                      : "bg-rose-500",
                )}
                style={{ width: `${Math.max(match.coverage, 2)}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {match.matched.length} of {match.matched.length + match.missing.length} weighted
              terms appear in your document.
              {guessedRole && ` Posting looks like: ${guessedRole}.`}
            </p>
          </div>

          {!!match.missing.length && (
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Missing ({match.missing.length})
                </h4>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() =>
                    onChange(m.appendSkills(content, match.missing.slice(0, 6).map((k) => k.term)))
                  }
                  title="Adds the six highest-weighted terms to your skills section"
                >
                  <Wand2 className="size-3" />
                  Add top 6
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {match.missing.map((k) => (
                  <button
                    key={k.term}
                    type="button"
                    onClick={() => onChange(m.appendSkills(content, [k.term]))}
                    title={`Weight ${k.weight}/10 — click to add to your skills`}
                    className="group inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/5 px-2 py-1 text-xs text-rose-700 transition-colors hover:bg-rose-500/15 dark:text-rose-300"
                  >
                    <Plus className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                    {k.term}
                    <span className="tabular-nums opacity-50">{k.weight}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Only add what&apos;s genuinely true of you. A keyword you can&apos;t talk about
                for two minutes costs more in the interview than it gains in the screen.
              </p>
            </section>
          )}

          {!!match.matched.length && (
            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Already covered ({match.matched.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {match.matched.map((k) => (
                  <span
                    key={k.term}
                    title={`Found in: ${k.foundIn}`}
                    className="rounded-full border border-emerald-500/30 bg-emerald-500/5 px-2 py-1 text-xs text-emerald-700 dark:text-emerald-300"
                  >
                    {k.term}
                  </span>
                ))}
              </div>
            </section>
          )}

          {!!match.extra.length && (
            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                In your résumé, not in the posting
              </h4>
              <p className="mb-2 text-xs text-muted-foreground">
                Not a problem — but if the page is over-long, this is the first place to cut.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {match.extra.map((t) => (
                  <span key={t} className="rounded-full border px-2 py-1 text-xs text-muted-foreground">
                    {t}
                  </span>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
