import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Landing-page CTA button — the "sticker" style from DESIGN.md: 2px ink
 * border, hard offset shadow that presses in on hover/active. Deliberately
 * separate from the shared shadcn Button so dashboard buttons are unaffected.
 */
const fills: Record<string, string> = {
  purple: "bg-purple text-white border-ink",
  cream: "bg-cream text-ink border-ink",
  ink: "bg-ink text-cream border-ink",
  pink: "bg-pink text-white border-ink",
};

const shadows: Record<string, string> = {
  ink: "shadow-[5px_5px_0_var(--color-ink)] hover:shadow-[2px_2px_0_var(--color-ink)]",
  lime: "shadow-[5px_5px_0_var(--color-lime)] hover:shadow-[2px_2px_0_var(--color-lime)]",
  cyan: "shadow-[5px_5px_0_var(--color-cyan)] hover:shadow-[2px_2px_0_var(--color-cyan)]",
  pink: "shadow-[5px_5px_0_var(--color-pink)] hover:shadow-[2px_2px_0_var(--color-pink)]",
};

export function BrandButton({
  href,
  children,
  fill = "purple",
  shadow = "ink",
  className,
  size = "md",
}: {
  href: string;
  children: React.ReactNode;
  fill?: keyof typeof fills;
  shadow?: keyof typeof shadows;
  className?: string;
  size?: "md" | "lg";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl border-2 font-bold font-body transition-all duration-150 ease-out hover:translate-x-0.5 hover:translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple/30",
        size === "lg" ? "px-7 py-4 text-lg" : "px-6 py-3.5 text-base",
        fills[fill],
        shadows[shadow],
        className,
      )}
    >
      {children}
    </Link>
  );
}
