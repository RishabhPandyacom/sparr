"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "Is it actually free to start?",
    a: "Yes. The Starter plan gives you three mock interviews, a resume with PDF export and three cover letters every month — no card, no trial countdown. If money is the blocker entirely, email us and we'll hand you a scholarship seat. No forms, no proving it.",
  },
  {
    q: "Is Sparr an AI chatbot?",
    a: "No, and we say so on purpose. Sparr's tools are transparent, rule-based engines: every résumé score point, salary multiplier and script line traces back to a named rule you can read. Nothing is sent to an external language model, nothing is auto-submitted, and anything we cannot know (like your results) is left as a visible prompt for you to fill in.",
  },
  {
    q: "How is this different from a generic chatbot?",
    a: "A generic chatbot gives you an answer and forgets you exist. Sparr keeps one career plan per goal, saves it to your private account, shows how each number was reached, and tracks your applications alongside it.",
  },
  {
    q: "Do you support pronouns and chosen names?",
    a: "Set them once in settings and they flow through every cover letter, resume and mock interview. Your legal name is never required to use the product, and feedback never comments on your name, accent or background.",
  },
  {
    q: "When does the auto-apply job board launch?",
    a: "It's in active development. Waitlist members get first access the moment it opens.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="mx-auto max-w-[900px] px-5 pt-20 sm:px-7 sm:pt-24">
      <div className="text-center">
        <span className="font-mono-label text-xs font-bold uppercase tracking-[0.14em] text-purple">
          07 — FAQ
        </span>
        <h2 className="mt-3 mb-10 font-display text-[32px] font-extrabold leading-none tracking-[-0.03em] sm:text-[40px] lg:text-[48px]">
          Questions, answered honestly
        </h2>
      </div>
      <div className="flex flex-col gap-3.5">
        {faqs.map((f, i) => {
          const isOpen = open === i;
          return (
            <div
              key={f.q}
              className="overflow-hidden rounded-2xl border-2 border-ink bg-white shadow-[4px_4px_0_var(--color-ink)]"
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-5 px-5.5 py-5 text-left font-display text-lg font-bold tracking-[-0.01em] sm:text-[19px]"
              >
                {f.q}
                <span
                  className={cn(
                    "flex size-7.5 shrink-0 items-center justify-center rounded-full border-2 border-ink text-lg transition-transform duration-200",
                    isOpen ? "rotate-45 bg-purple text-white" : "bg-cream text-ink",
                  )}
                >
                  <Plus className="size-4" strokeWidth={2.5} />
                </span>
              </button>
              {isOpen && (
                <p className="max-w-[660px] px-5.5 pb-5.5 text-[15.5px] leading-relaxed text-text-secondary">
                  {f.a}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
