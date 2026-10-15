"use client";

import { useEffect, useState, useTransition } from "react";
import { History, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listVersions, restoreVersion, saveVersion } from "@/lib/resume/actions";
import type { ResumeContent } from "@/lib/resume/schema";

type Version = {
  id: string;
  label: string | null;
  reason: string;
  score: number | null;
  created_at: string;
};

const REASON_LABEL: Record<string, string> = {
  manual: "Saved",
  autosave: "Autosaved",
  template: "Generated",
  import: "Imported",
  ai: "AI edit",
};

/**
 * Version history. Autosave is convenient right up to the moment it overwrites
 * something you wanted — so every meaningful edit gets a snapshot, and you can
 * always get back to a version you liked.
 */
export function HistoryPanel({
  resumeId,
  content,
  title,
  onRestore,
}: {
  resumeId: string;
  content: ResumeContent;
  title: string;
  onRestore: (content: ResumeContent, title: string) => void;
}) {
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [label, setLabel] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let live = true;
    listVersions(resumeId).then((rows) => {
      if (live) setVersions(rows as Version[]);
    });
    return () => {
      live = false;
    };
  }, [resumeId]);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border bg-background p-3">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Save this version
        </label>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Before tailoring for Stripe"
          className="h-8 text-sm"
        />
        <Button
          size="sm"
          className="mt-2 w-full"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await saveVersion(resumeId, content, title, label.trim());
              if (res.error) toast.error(res.error);
              else {
                setLabel("");
                toast.success("Version saved");
                setVersions((await listVersions(resumeId)) as Version[]);
              }
            })
          }
        >
          <Save className="size-4" />
          Save version
        </Button>
      </section>

      <section>
        <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <History className="size-3.5" />
          History
        </h4>

        {versions?.length === 0 && (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No snapshots yet. Save one before a big rewrite and you can always get back.
          </p>
        )}

        <ul className="space-y-2">
          {versions?.map((v) => (
            <li key={v.id} className="rounded-lg border bg-background p-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium">
                  {v.label || REASON_LABEL[v.reason] || "Snapshot"}
                </span>
                {v.score != null && (
                  <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                    score {v.score}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {new Date(v.created_at).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
              <Button
                size="xs"
                variant="outline"
                className="mt-1.5"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const res = await restoreVersion(resumeId, v.id);
                    if (res.error || !res.content) {
                      toast.error(res.error ?? "Could not restore that version");
                      return;
                    }
                    onRestore(res.content, res.title ?? title);
                    toast.success("Restored", {
                      description: "Your previous state was saved first, so this is reversible.",
                    });
                  })
                }
              >
                <RotateCcw className="size-3" />
                Restore
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <p className="px-1 text-xs text-muted-foreground">
        The 30 most recent snapshots per document are kept.
      </p>
    </div>
  );
}
