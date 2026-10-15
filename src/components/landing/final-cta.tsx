import { ArrowRight } from "lucide-react";
import { BrandButton } from "./brand-button";

export function FinalCta() {
  return (
    <section className="mx-auto max-w-[1240px] px-5 pt-20 sm:px-7 sm:pt-24">
      <div className="relative overflow-hidden rounded-[32px] border-2 border-ink bg-pink px-7 py-16 text-center shadow-[10px_10px_0_var(--color-ink)] sm:px-12 sm:py-20">
        <div
          aria-hidden
          className="absolute -left-16 -top-16 size-[220px] rounded-full border-2 border-ink bg-amber"
        />
        <div
          aria-hidden
          className="absolute -bottom-20 -right-14 size-[200px] rounded-full border-2 border-ink bg-purple"
        />
        <div className="relative z-[2]">
          <h2 className="text-balance font-display text-[36px] font-extrabold leading-[0.98] tracking-[-0.035em] text-white sm:text-[48px] lg:text-[60px]">
            Your future self is
            <br />
            already applying.
          </h2>
          <p className="mx-auto mt-5 max-w-[480px] text-lg leading-relaxed text-white">
            Start free today. First mock interview takes ten minutes.
          </p>
          <BrandButton href="/signup" size="lg" fill="ink" shadow="lime" className="mt-7">
            Start free — no card
            <ArrowRight className="size-4.5" />
          </BrandButton>
        </div>
      </div>
    </section>
  );
}
