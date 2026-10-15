"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { api, ApiError } from "@/lib/api/client";
import type { CareerPlan, Currency, SalaryData, SalaryEstimate, Strategy } from "@/lib/api/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ActionButton, FormBanner, FormField, FormSection } from "./form-kit";
import { SalaryRange } from "./salary-range";

const CURRENCIES: Currency[] = ["AUD", "USD", "GBP"];
const STRATEGIES: { id: Strategy; title: string; blurb: string }[] = [
  { id: "collaborative", title: "Collaborative", blurb: "Win-win, relationship first." },
  { id: "data_driven", title: "Data-driven", blurb: "Lead with market evidence." },
  { id: "assertive", title: "Assertive", blurb: "Direct and confident." },
  { id: "flexible", title: "Flexible", blurb: "Open to trading across the package." },
];

type Values = { current_offer: string; target_salary: string; location: string; currency: Currency; strategy: Strategy };
type Errors = Partial<Record<keyof Values, string>>;

function validate(v: Values): Errors {
  const e: Errors = {};
  const target = Number(v.target_salary);
  if (v.target_salary === "" || !(target > 0) || target > 5_000_000) e.target_salary = "Enter the salary you are aiming for (a positive number).";
  if (v.current_offer !== "") {
    const o = Number(v.current_offer);
    if (!(o >= 0) || o > 5_000_000) e.current_offer = "Enter a valid offer amount, or leave it blank.";
  }
  if (v.location.trim().length < 2) e.location = "Enter a city or country, e.g. Melbourne.";
  return e;
}

export function SalaryStep({ plan }: { plan: CareerPlan }) {
  const router = useRouter();
  const saved = plan.salary_data as Partial<SalaryData>;
  const resume = plan.resume_data;
  const [values, setValues] = useState<Values>({
    current_offer: saved.current_offer != null ? String(saved.current_offer) : "",
    target_salary: saved.target_salary != null ? String(saved.target_salary) : "",
    location: saved.location ?? "",
    currency: saved.currency ?? "AUD",
    strategy: saved.strategy ?? "collaborative",
  });
  const [touched, setTouched] = useState<Partial<Record<keyof Values, boolean>>>({});
  const [serverErrors, setServerErrors] = useState<Errors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [estimate, setEstimate] = useState<SalaryEstimate | null>(null);

  const errors = useMemo(() => validate(values), [values]);
  const visible = (k: keyof Values) => (touched[k] ? errors[k] : undefined) ?? serverErrors[k];

  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    setServerErrors((s) => ({ ...s, [k]: undefined }));
  };

  const seq = useRef(0);
  useEffect(() => {
    if (!resume.target_role || values.location.trim().length < 2) return;
    const mine = ++seq.current;
    const t = setTimeout(async () => {
      try {
        const r = await api<{ estimate: SalaryEstimate }>("/api/salary/estimate", {
          method: "POST",
          json: {
            role: resume.target_role,
            location: values.location.trim(),
            experience_years: resume.years_experience ?? 0,
            currency: values.currency,
            current_offer: values.current_offer === "" ? null : Number(values.current_offer),
            target_salary: Number(values.target_salary) > 0 ? Number(values.target_salary) : null,
            strategy: values.strategy,
          },
        });
        if (mine === seq.current) setEstimate(r.estimate);
      } catch {
        /* preview only */
      }
    }, 450);
    return () => clearTimeout(t);
  }, [resume.target_role, resume.years_experience, values]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ current_offer: true, target_salary: true, location: true });
    if (Object.keys(errors).length) return;
    setPending(true);
    setBanner(null);
    try {
      await api(`/api/career-plans/${plan.id}/salary`, {
        method: "PUT",
        json: {
          current_offer: values.current_offer === "" ? null : Number(values.current_offer),
          target_salary: Number(values.target_salary),
          location: values.location.trim(),
          currency: values.currency,
          strategy: values.strategy,
        },
      });
      await api(`/api/career-plans/${plan.id}/generate`, { method: "POST" });
      router.push(`/dashboard/career-plan/${plan.id}/summary`);
    } catch (err) {
      if (err instanceof ApiError) {
        setServerErrors(err.fields as Errors);
        setBanner(err.message);
      } else setBanner("Something went wrong. Please try again.");
      setPending(false);
    }
  }

  if (!resume.target_role) {
    return (
      <FormBanner tone="info">
        Finish the résumé step first, then come back here.{" "}
        <Link className="underline" href={`/dashboard/career-plan/${plan.id}/resume`}>Go to résumé step</Link>
      </FormBanner>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="grid gap-6">
        <FormSection title="Pay" description={`For ${resume.target_role}. Figures are yearly, before tax.`}>
          <div>
            <span className="text-sm font-bold">Currency</span>
            <div role="radiogroup" aria-label="Currency" className="mt-1.5 flex gap-2">
              {CURRENCIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={values.currency === c}
                  onClick={() => setValues((v) => ({ ...v, currency: c }))}
                  className={cn(
                    "rounded-xl border-2 border-ink px-4 py-2 font-mono-label text-sm font-bold transition",
                    values.currency === c ? "bg-purple text-cream shadow-[2px_2px_0_var(--brand-ink)]" : "bg-white hover:bg-surface",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="target_salary" label="Target salary" error={visible("target_salary")} hint="What you would be happy to land.">
              <Input id="target_salary" type="number" inputMode="numeric" min={1} value={values.target_salary} onChange={set("target_salary")} onBlur={() => setTouched((t) => ({ ...t, target_salary: true }))} aria-invalid={!!visible("target_salary")} />
            </FormField>
            <FormField id="current_offer" label="Offer on the table" optional error={visible("current_offer")} hint="If you already have one.">
              <Input id="current_offer" type="number" inputMode="numeric" min={0} value={values.current_offer} onChange={set("current_offer")} onBlur={() => setTouched((t) => ({ ...t, current_offer: true }))} aria-invalid={!!visible("current_offer")} />
            </FormField>
          </div>
          <FormField id="location" label="Where is the job?" error={visible("location")} hint="City or country. We adjust for the market.">
            <Input id="location" value={values.location} onChange={set("location")} onBlur={() => setTouched((t) => ({ ...t, location: true }))} aria-invalid={!!visible("location")} maxLength={80} />
          </FormField>
        </FormSection>

        <FormSection title="Negotiation style" description="This changes the tone of your six-line script. You can regenerate with a different style any time.">
          <div role="radiogroup" aria-label="Negotiation style" className="grid gap-3 sm:grid-cols-2">
            {STRATEGIES.map((s) => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={values.strategy === s.id}
                onClick={() => setValues((v) => ({ ...v, strategy: s.id }))}
                className={cn(
                  "rounded-xl border-2 border-ink p-4 text-left transition",
                  values.strategy === s.id ? "bg-lime shadow-[3px_3px_0_var(--brand-ink)]" : "bg-white hover:bg-surface",
                )}
              >
                <div className="font-display text-base font-extrabold">{s.title}</div>
                <div className="text-sm text-text-secondary">{s.blurb}</div>
              </button>
            ))}
          </div>
        </FormSection>

        {banner && <FormBanner tone="error">{banner}</FormBanner>}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="lg" render={<Link href={`/dashboard/career-plan/${plan.id}/resume`} />}>
            <ArrowLeft /> Back
          </Button>
          <ActionButton type="submit" pending={pending} pendingLabel="Building your plan…">
            Generate my career plan <ArrowRight />
          </ActionButton>
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border-2 border-ink bg-cream p-5 shadow-[4px_4px_0_var(--brand-ink)]">
          <h2 className="font-display text-lg font-extrabold">Live salary range</h2>
          <p className="mt-1 text-xs text-text-secondary">Indicative baselines, with every multiplier shown.</p>
          {estimate && values.location.trim().length >= 2 ? (
            <div className="mt-4"><SalaryRange estimate={estimate} compact /></div>
          ) : (
            <p className="mt-6 rounded-xl border-2 border-dashed border-ink/40 p-4 text-sm text-text-secondary">
              Enter a location to see the range.
            </p>
          )}
        </div>
      </aside>
    </form>
  );
}
