"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { joinWaitlist, type WaitlistState } from "@/lib/waitlist/actions";
import { cn } from "@/lib/utils";

const stages = [
  "Still studying",
  "Final year",
  "Graduated, job hunting",
  "Switching careers",
];

const goalOptions = [
  "Mock interviews",
  "Resume",
  "Cover letters",
  "Salary talk",
  "Job board",
  "Staying on track",
];

function Chip({
  active,
  activeBg,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active: boolean;
  activeBg: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-full border-2 border-ink px-4 py-2.5 text-sm font-bold transition-transform",
        active
          ? `${activeBg} text-ink shadow-[3px_3px_0_var(--color-ink)]`
          : "bg-cream text-text-secondary",
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function WaitlistSection({ waitlistCount }: { waitlistCount: number }) {
  const [state, formAction] = useActionState<WaitlistState, FormData>(
    joinWaitlist,
    undefined,
  );
  const [stage, setStage] = useState(stages[1]);
  const [goals, setGoals] = useState<string[]>(["Mock interviews"]);

  const displayCount = waitlistCount > 0 ? waitlistCount : 128;
  const pct = Math.min(96, Math.max(8, Math.round((displayCount / 500) * 100)));

  function toggleGoal(g: string) {
    setGoals((gs) => (gs.includes(g) ? gs.filter((x) => x !== g) : [...gs, g]));
  }

  return (
    <section id="waitlist" className="mx-auto max-w-[1240px] px-5 pt-20 sm:px-7 sm:pt-24">
      <div className="grid items-stretch gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        {/* Info panel */}
        <div className="flex flex-col rounded-[28px] border-2 border-ink bg-ink p-8 text-cream shadow-[8px_8px_0_var(--color-lime)] sm:p-9">
          <span className="font-mono-label text-xs font-bold uppercase tracking-[0.14em] text-lime">
            07 — Early access
          </span>
          <h2 className="mt-3.5 text-balance font-display text-3xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[40px]">
            The job board that applies for you.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[#BDB6CC] sm:text-base">
            We&apos;re building a board that reads your profile, finds the
            roles worth your time, and files the application while
            you&apos;re in class. Join the waitlist — early members get first
            access when it launches.
          </p>
          <div className="mt-auto flex flex-col gap-3.5 pt-7">
            <div className="flex items-center gap-3 rounded-2xl border-2 border-[#3A3550] px-4 py-3.5">
              <span className="font-display text-2xl font-extrabold text-lime">
                {displayCount.toLocaleString("en-IN")}
              </span>
              <span className="text-sm text-[#BDB6CC]">
                students already on the list
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full border-2 border-[#3A3550] bg-[#3A3550]">
              <div
                className="h-full bg-[linear-gradient(90deg,var(--color-pink),var(--color-amber),var(--color-lime))]"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="font-mono-label text-xs text-text-muted-2">
              {pct}% of early-access seats claimed
            </span>
          </div>
        </div>

        {/* Form panel */}
        <div className="rounded-[28px] border-2 border-ink bg-white p-8 shadow-[8px_8px_0_var(--color-ink)] sm:p-9">
          {state?.ok ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
              <span className="flex size-[70px] items-center justify-center rounded-full border-2 border-ink bg-lime shadow-[4px_4px_0_var(--color-ink)]">
                <Check className="size-8 text-ink" strokeWidth={3} />
              </span>
              <h3 className="mt-6 font-display text-[28px] font-extrabold tracking-[-0.02em] sm:text-[32px]">
                You&apos;re on the list{state.firstName ? `, ${state.firstName}` : ""}
              </h3>
              <p className="mt-3 max-w-[380px] text-[15px] leading-relaxed text-text-secondary">
                We&apos;ll email you the moment early access opens.
              </p>
            </div>
          ) : (
            <form action={formAction}>
              <h3 className="font-display text-2xl font-extrabold tracking-[-0.02em] sm:text-[28px]">
                Grab your seat
              </h3>
              <p className="mt-2 text-sm text-text-secondary">
                Two minutes now, a much shorter job hunt later.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-bold">Full name</span>
                  <input
                    name="name"
                    type="text"
                    placeholder="Ada Lovelace"
                    required
                    className="rounded-xl border-2 border-ink bg-cream px-3.5 py-3 text-[15px] text-ink outline-none focus:border-purple focus:shadow-[0_0_0_4px_rgba(108,59,255,0.18)]"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-bold">
                    Pronouns{" "}
                    <span className="font-medium text-text-muted-2">(optional)</span>
                  </span>
                  <input
                    name="pronouns"
                    type="text"
                    placeholder="they/them"
                    className="rounded-xl border-2 border-ink bg-cream px-3.5 py-3 text-[15px] text-ink outline-none focus:border-purple focus:shadow-[0_0_0_4px_rgba(108,59,255,0.18)]"
                  />
                </label>
              </div>

              <label className="mt-4 flex flex-col gap-1.5">
                <span className="text-[13px] font-bold">Email</span>
                <input
                  name="email"
                  type="email"
                  placeholder="you@college.edu"
                  required
                  className="rounded-xl border-2 border-ink bg-cream px-3.5 py-3 text-[15px] text-ink outline-none focus:border-purple focus:shadow-[0_0_0_4px_rgba(108,59,255,0.18)]"
                />
              </label>

              <div className="mt-5">
                <span className="mb-2.5 block text-[13px] font-bold">
                  Where are you right now?
                </span>
                <input type="hidden" name="stage" value={stage} />
                <div className="flex flex-wrap gap-2.5">
                  {stages.map((s) => (
                    <Chip
                      key={s}
                      active={stage === s}
                      activeBg="bg-cyan"
                      onClick={() => setStage(s)}
                    >
                      {s}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <span className="mb-2.5 block text-[13px] font-bold">
                  What should we help with first?{" "}
                  <span className="font-medium text-text-muted-2">
                    Pick as many as you like
                  </span>
                </span>
                {goals.map((g) => (
                  <input key={g} type="hidden" name="goals" value={g} />
                ))}
                <div className="flex flex-wrap gap-2.5">
                  {goalOptions.map((g) => (
                    <Chip
                      key={g}
                      active={goals.includes(g)}
                      activeBg="bg-lime"
                      onClick={() => toggleGoal(g)}
                    >
                      {g}
                    </Chip>
                  ))}
                </div>
              </div>

              <label className="mt-5 flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  name="consent"
                  className="mt-0.5 size-5 shrink-0 accent-purple"
                />
                <span className="text-sm leading-relaxed text-text-secondary">
                  Send me interview prep tips and launch news. No spam, no
                  recruiter nonsense — unsubscribe in one click.
                </span>
              </label>

              {state?.error && (
                <div className="mt-4.5 rounded-xl border-2 border-pink bg-pink-tint px-3.5 py-3 text-sm font-semibold text-pink-dark">
                  {state.error}
                </div>
              )}

              <WaitlistSubmitButton />
              <p className="mt-3.5 text-center font-mono-label text-xs text-text-muted-2">
                Free forever plan · no card · leave whenever
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function WaitlistSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-ink bg-purple py-4 text-[17px] font-bold text-white shadow-[5px_5px_0_var(--color-ink)] transition-all duration-150 ease-out hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-pink hover:shadow-[2px_2px_0_var(--color-ink)] disabled:opacity-70"
    >
      {pending ? (
        <Loader2 className="size-4.5 animate-spin" />
      ) : (
        <>
          Join the waitlist
          <ArrowRight className="size-4.5" />
        </>
      )}
    </button>
  );
}
