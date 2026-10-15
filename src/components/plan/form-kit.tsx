"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** A titled block of related fields. */
export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_var(--brand-ink)] sm:p-6",
        className,
      )}
    >
      <h2 className="font-display text-xl font-extrabold tracking-tight">{title}</h2>
      {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
      <div className="mt-5 grid gap-5">{children}</div>
    </section>
  );
}

/**
 * Label + control + hint + error. Children render the control and receive the
 * ids needed for accessible wiring (`htmlFor`, `aria-describedby`).
 */
export function FormField({
  id,
  label,
  hint,
  error,
  optional,
  counter,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  counter?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-bold">
          {label}
          {optional && (
            <span className="ml-2 font-mono-label text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Optional
            </span>
          )}
        </label>
        {counter && <span className="font-mono-label text-[11px] text-text-muted">{counter}</span>}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm font-semibold text-pink-dark">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-text-secondary">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Primary action with a built-in pending state, so a click is never ambiguous. */
export function ActionButton({
  pending,
  pendingLabel,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { pending?: boolean; pendingLabel?: string }) {
  return (
    <Button size="lg" disabled={pending || props.disabled} {...props}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" /> {pendingLabel ?? "Saving…"}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

export function FormBanner({ tone, children }: { tone: "error" | "info"; children: React.ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-xl border-2 border-ink p-3.5 text-sm font-semibold",
        tone === "error" ? "bg-pink-tint text-pink-dark" : "bg-lime/50 text-ink",
      )}
    >
      {children}
    </div>
  );
}
