"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Globe, Link2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleShare } from "@/lib/resume/actions";

/**
 * Read-only public link. Off by default; the row is only readable by anonymous
 * visitors while `is_public` is true, and that's enforced in the database
 * policy rather than in this component.
 */
export function ShareButton({
  resumeId,
  initialSlug,
  initialPublic,
}: {
  resumeId: string;
  initialSlug: string | null;
  initialPublic: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState(initialSlug);
  const [isPublic, setIsPublic] = useState(initialPublic);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const url = slug && typeof window !== "undefined" ? `${window.location.origin}/r/${slug}` : "";

  function toggle(next: boolean) {
    startTransition(async () => {
      const res = await toggleShare(resumeId, next);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setIsPublic(next);
      if (res.slug !== undefined) setSlug(res.slug ?? slug);
      toast.success(next ? "Link is live" : "Link turned off");
    });
  }

  return (
    <div className="relative">
      <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
        {isPublic ? <Globe className="size-4" /> : <Link2 className="size-4" />}
        Share
      </Button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-9 z-50 w-80 rounded-xl border bg-popover p-3 shadow-lg">
            <p className="text-sm font-medium">Public link</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Anyone with the link can view a read-only copy. They can&apos;t edit it, and it
              isn&apos;t listed anywhere.
            </p>

            <Button
              size="sm"
              variant={isPublic ? "secondary" : "default"}
              className="mt-2.5 w-full"
              disabled={pending}
              onClick={() => toggle(!isPublic)}
            >
              {isPublic ? <Lock className="size-4" /> : <Globe className="size-4" />}
              {isPublic ? "Turn the link off" : "Create a public link"}
            </Button>

            {isPublic && url && (
              <div className="mt-2 flex items-center gap-1 rounded-lg border bg-background p-1.5">
                <span className="min-w-0 flex-1 truncate font-mono text-xs">{url}</span>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label="Copy link"
                  onClick={async () => {
                    await navigator.clipboard.writeText(url);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1800);
                  }}
                >
                  {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
