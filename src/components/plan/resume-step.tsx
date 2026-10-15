"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { api, ApiError } from "@/lib/api/client";
import type { CareerPlan, Readiness, ResumeData } from "@/lib/api/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ActionButton, FormBanner, FormField, FormSection } from "./form-kit";
import { ChecksList, ScoreRing } from "./readiness-panel";

type Values = {
  target_role: string;
  years_experience: string;
  key_skills: string;
  experience: string;
  job_description: string;
};
type Errors = Partial<Record<keyof Values, string>>;

/** Mirrors the API's rules so people see problems before submitting. */
function validate(v: Values): Errors {
  const e: Errors = {};
  if (v.target_role.trim().length < 2) e.target_role = "Tell us the role you are aiming for (at least 2 characters).";
  if (v.key_skills.trim().length < 2) e.key_skills = "List at least one skill, separated by commas.";
  if (v.experience.trim().length < 20) e.experience = "Describe your experience in at least 20 characters.";
  const y = Number(v.years_experience);
  if (v.years_experience === "" || !Number.isInteger(y) || y < 0 || y > 40) e.years_experience = "Enter whole years between 0 and 40.";
  if (v.job_description.length > 8000) e.job_description = "Keep the posting under 8,000 characters.";
  return e;
}

export function ResumeStep({ plan }: { plan: CareerPlan }) {
  const router = useRouter();
  const saved = plan.resume_data as Partial<ResumeData>;
  // State lives here, in the step's parent; fields receive values + callbacks.
  const [values, setValues] = useState<Values>({
    target_role: saved.target_role ?? "",
    years_experience: saved.years_experience !== undefined ? String(saved.years_experience) : "",
    key_skills: saved.key_skills ?? "",
    experience: saved.experience ?? "",
    job_description: saved.job_description ?? "",
  });
  const [touched, setTouched] = useState<Partial<Record<keyof Values, boolean>>>({});
  const [serverErrors, setServerErrors] = useState<Errors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [preview, setPreview] = useState<Readiness | null>(null);

  const errors = useMemo(() => validate(values), [values]);
  const visible = (k: keyof Values) => (touched[k] ? errors[k] : undefined) ?? serverErrors[k];
  const valid = Object.keys(errors).length === 0;

  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    setServerErrors((s) => ({ ...s, [k]: undefined }));
  };
  const blur = (k: keyof Values) => () => setTouched((t) => ({ ...t, [k]: true }));

  // Live readiness preview, debounced so typing doesn't spam the API.
  const seq = useRef(0);
  useEffect(() => {
    if (values.target_role.trim().length < 2) return;
    const mine = ++seq.current;
    const t = setTimeout(async () => {
      try {
        const r = await api<Readiness>("/api/resume/readiness", {
          method: "POST",
          json: {
            target_role: values.target_role.trim(),
            key_skills: values.key_skills,
            experience: values.experience,
            job_description: values.job_description || null,
          },
        });
        if (mine === seq.current) setPreview(r);
      } catch {
        /* preview is a bonus; the save path reports real errors */
      }
    }, 450);
    return () => clearTimeout(t);
  }, [values.target_role, values.key_skills, values.experience, values.job_description]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ target_role: true, years_experience: true, key_skills: true, experience: true, job_description: true });
    if (!valid) return;
    setPending(true);
    setBanner(null);
    try {
      await api(`/api/career-plans/${plan.id}/resume`, {
        method: "PUT",
        json: {
          target_role: values.target_role.trim(),
          key_skills: values.key_skills.trim(),
          experience: values.experience.trim(),
          years_experience: Number(values.years_experience),
          job_description: values.job_description.trim() || null,
        },
      });
      router.push(`/dashboard/career-plan/${plan.id}/salary`);
    } catch (err) {
      if (err instanceof ApiError) {
        setServerErrors(err.fields as Errors);
        setBanner(err.message);
      } else setBanner("Something went wrong. Please try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="grid gap-6">
        <FormSection title="Your target" description="The role family you pick decides which skills and benchmarks we compare you against.">
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_160px]">
            <FormField id="target_role" label="Target role" error={visible("target_role")} hint="e.g. Data Analyst, Software Engineer, Marketing Coordinator">
              <Input id="target_role" value={values.target_role} onChange={set("target_role")} onBlur={blur("target_role")} aria-invalid={!!visible("target_role")} aria-describedby={visible("target_role") ? "target_role-error" : "target_role-hint"} maxLength={80} />
            </FormField>
            <FormField id="years_experience" label="Years of experience" error={visible("years_experience")}>
              <Input id="years_experience" type="number" inputMode="numeric" min={0} max={40} value={values.years_experience} onChange={set("years_experience")} onBlur={blur("years_experience")} aria-invalid={!!visible("years_experience")} />
            </FormField>
          </div>
        </FormSection>

        <FormSection title="Your résumé content" description="Paste or type what is on your résumé. We only score what you write; nothing is invented.">
          <FormField id="key_skills" label="Key skills" error={visible("key_skills")} hint="Comma-separated: SQL, Python, Tableau, stakeholder communication" counter={`${values.key_skills.length}/1200`}>
            <Textarea id="key_skills" rows={3} value={values.key_skills} onChange={set("key_skills")} onBlur={blur("key_skills")} aria-invalid={!!visible("key_skills")} maxLength={1200} />
          </FormField>
          <FormField id="experience" label="Experience and projects" error={visible("experience")} hint="Include real numbers where you have them: time saved, users, revenue, team size." counter={`${values.experience.length}/4000`}>
            <Textarea id="experience" rows={7} value={values.experience} onChange={set("experience")} onBlur={blur("experience")} aria-invalid={!!visible("experience")} maxLength={4000} />
          </FormField>
          <FormField id="job_description" label="Job posting you are aiming at" optional error={visible("job_description")} hint="Paste one to add a keyword-match check to your score.">
            <Textarea id="job_description" rows={5} value={values.job_description} onChange={set("job_description")} onBlur={blur("job_description")} maxLength={8000} />
          </FormField>
        </FormSection>

        {banner && <FormBanner tone="error">{banner}</FormBanner>}
        <div className="flex justify-end">
          <ActionButton type="submit" pending={pending} pendingLabel="Saving…">
            Save and continue <ArrowRight />
          </ActionButton>
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border-2 border-ink bg-cream p-5 shadow-[4px_4px_0_var(--brand-ink)]">
          <h2 className="font-display text-lg font-extrabold">Live readiness preview</h2>
          <p className="mt-1 text-xs text-text-secondary">Updates as you type. Rule-based: every point is explained.</p>
          {preview && values.target_role.trim().length >= 2 ? (
            <>
              <div className="mt-4 flex items-center gap-4">
                <ScoreRing score={preview.score} size={104} />
                <div>
                  <div className="font-display text-lg font-extrabold leading-tight">{preview.band}</div>
                  <div className="text-xs text-text-secondary">{preview.role_family}</div>
                </div>
              </div>
              <div className="mt-4 max-h-[420px] overflow-y-auto pr-1">
                <ChecksList checks={preview.checks} />
              </div>
            </>
          ) : (
            <p className="mt-6 rounded-xl border-2 border-dashed border-ink/40 p-4 text-sm text-text-secondary">
              Enter a target role to see your score build up.
            </p>
          )}
        </div>
      </aside>
    </form>
  );
}
