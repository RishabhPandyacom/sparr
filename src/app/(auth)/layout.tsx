import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-7 overflow-hidden bg-cream-app p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full border-2 border-ink bg-lime opacity-80"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -right-20 size-80 rounded-full border-2 border-ink bg-pink/80"
      />
      <Link
        href="/"
        className="relative flex items-center gap-2.5 font-display text-2xl font-extrabold tracking-tight"
      >
        <span className="flex size-10 items-center justify-center rounded-xl border-2 border-ink bg-purple shadow-[3px_3px_0_var(--brand-ink)]">
          <Sparkles className="size-5 text-cream" strokeWidth={2.25} />
        </span>
        Sparr
      </Link>
      <div className="relative w-full max-w-md">{children}</div>
      <p className="relative text-center text-xs font-medium text-text-secondary">
        Your career suite for the job hunt. Rule-based, private, yours to export or delete.
      </p>
    </div>
  );
}
