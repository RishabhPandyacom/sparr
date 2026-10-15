"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { generateResume } from "@/lib/resume/actions";
import { TEMPLATES } from "@/lib/resume/design";
import { ROLE_SUGGESTIONS, SENIORITY_OPTIONS, matchRoleFamily } from "@/lib/resume/roleLibrary";
import { guessRoleFromJd } from "@/lib/resume/keywords";
import { generateDocument } from "@/lib/resume/generate";
import { DocumentPreview } from "./preview";

type DocType = "resume" | "cv";

/**
 * One-shot generation.
 *
 * Type a role and press the button — everything else is optional. The preview
 * on the right is the real document engine running on the real generator, so
 * what you see before you commit is what you get after.
 */
export function GenerateForm({ defaultName }: { defaultName: string }) {
  const [docType, setDocType] = useState<DocType>("resume");
  const [templateSlug, setTemplateSlug] = useState("classic");
  const [targetRole, setTargetRole] = useState("");
  const [seniority, setSeniority] = useState("entry");
  const [fullName, setFullName] = useState(defaultName);
  const [industry, setIndustry] = useState("");
  const [years, setYears] = useState("");
  const [skills, setSkills] = useState("");
  const [jd, setJd] = useState("");

  const templates = useMemo(() => TEMPLATES.filter((t) => t.family === docType), [docType]);
  const family = useMemo(() => matchRoleFamily(`${targetRole} ${industry}`), [targetRole, industry]);

  // A live draft, regenerated as you type. Deterministic, so it doesn't flicker.
  const preview = useMemo(
    () =>
      generateDocument({
        fullName: fullName || "Your Name",
        targetRole: targetRole || (docType === "cv" ? "Researcher" : "Professional"),
        seniority: seniority as never,
        yearsExperience: Number(years) || undefined,
        industry,
        skills,
        docType,
        templateSlug,
        jobDescription: jd,
      }),
    [fullName, targetRole, seniority, years, industry, skills, docType, templateSlug, jd],
  );

  function switchDocType(next: DocType) {
    setDocType(next);
    setTemplateSlug(next === "cv" ? "academic" : "classic");
  }

  return (
    <form action={generateResume} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <input type="hidden" name="docType" value={docType} />
      <input type="hidden" name="templateSlug" value={templateSlug} />

      <div className="space-y-7">
        {/* Document type */}
        <Section title="What are you building?">
          <div className="grid gap-3 sm:grid-cols-2">
            <TypeCard
              active={docType === "resume"}
              onClick={() => switchDocType("resume")}
              title="Résumé"
              body="One or two pages. Industry roles, internships, career changes."
            />
            <TypeCard
              active={docType === "cv"}
              onClick={() => switchDocType("cv")}
              title="Academic CV"
              body="Multi-page. Publications, teaching, grants, conferences, referees."
            />
          </div>
        </Section>

        {/* Role */}
        <Section title="The role you're targeting" required>
          <Input
            name="targetRole"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder={docType === "cv" ? "Postdoctoral Researcher" : "Product Designer"}
            required
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ROLE_SUGGESTIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setTargetRole(r)}
                className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                {r}
              </button>
            ))}
          </div>
          {targetRole.trim().length > 2 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Drafting with the <strong className="text-foreground">{family.label}</strong>{" "}
              playbook — {family.coreSkills.slice(0, 4).join(", ")}, and accomplishment patterns
              hiring managers in that field recognise.
            </p>
          )}
        </Section>

        {/* Level */}
        <Section title="Where are you in your career?">
          <div className="grid gap-2 sm:grid-cols-3">
            {SENIORITY_OPTIONS.map((o) => (
              <label
                key={o.value}
                className={cn(
                  "cursor-pointer rounded-lg border p-2.5 transition-colors",
                  seniority === o.value
                    ? "border-primary bg-primary/5"
                    : "hover:border-foreground/25",
                )}
              >
                <input
                  type="radio"
                  name="seniority"
                  value={o.value}
                  checked={seniority === o.value}
                  onChange={() => setSeniority(o.value)}
                  className="sr-only"
                />
                <span className="block text-sm font-medium">{o.label}</span>
                <span className="block text-xs text-muted-foreground">{o.hint}</span>
              </label>
            ))}
          </div>
        </Section>

        {/* Identity */}
        <Section title="Your details">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name">
              <Input
                name="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Chen"
              />
            </Field>
            <Field label="Email">
              <Input name="email" type="email" placeholder="alex@example.com" />
            </Field>
            <Field label="Phone">
              <Input name="phone" placeholder="(555) 123-4567" />
            </Field>
            <Field label="Location">
              <Input name="location" placeholder="Berlin, Germany" />
            </Field>
            <Field label="Website / portfolio">
              <Input name="website" placeholder="alexchen.dev" />
            </Field>
            <Field label="LinkedIn">
              <Input name="linkedin" placeholder="linkedin.com/in/alexchen" />
            </Field>
          </div>
        </Section>

        {/* Background */}
        <Section title="Background (all optional — it just makes the draft closer)">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Industry or focus">
              <Input
                name="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="Fintech, healthcare, climate…"
              />
            </Field>
            <Field label="Years of experience">
              <Input
                name="yearsExperience"
                type="number"
                min={0}
                max={50}
                value={years}
                onChange={(e) => setYears(e.target.value)}
                placeholder="4"
              />
            </Field>
            <Field label="Current / most recent employer">
              <Input name="currentCompany" placeholder="Northwind" />
            </Field>
            <Field label="Previous employer">
              <Input name="previousCompany" placeholder="Lumen Labs" />
            </Field>
            <Field label="Degree">
              <Input name="degree" placeholder="B.S. Computer Science" />
            </Field>
            <Field label="School">
              <Input name="school" placeholder="TU Berlin" />
            </Field>
            <Field label="Graduation year">
              <Input name="graduationYear" placeholder="2021" />
            </Field>
            <Field label="Skills (comma separated)">
              <Input
                name="skills"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="Figma, user research, prototyping"
              />
            </Field>
          </div>
          <Field label="Anything you want reflected in the summary" className="mt-3">
            <Textarea
              name="highlights"
              rows={3}
              placeholder="I've spent four years on onboarding and activation; I care about accessibility and I want to move into a lead role."
            />
          </Field>
        </Section>

        {/* Optional JD */}
        <Section title="Tailor it to a specific posting (optional)">
          <Textarea
            name="jobDescription"
            rows={5}
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste a job description and the draft will lean toward its vocabulary — you'll get a full keyword match in the editor afterwards."
          />
          {jd.trim().length > 60 && guessRoleFromJd(jd) && (
            <button
              type="button"
              onClick={() => setTargetRole(guessRoleFromJd(jd)!)}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <Wand2 className="size-3.5" />
              Use &ldquo;{guessRoleFromJd(jd)}&rdquo; as the target role
            </button>
          )}
        </Section>

        <SubmitButton docType={docType} />

        <p className="text-xs text-muted-foreground">
          The draft is a starting point, not a submission. It fills every section with the shape
          of a strong document and marks anything it can&apos;t know — dates, numbers, employer
          names — so you can replace them. It will never invent a statistic for you.
        </p>
      </div>

      {/* Live preview */}
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Live preview
        </p>
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <DocumentPreview content={preview} width={288} />
        </div>

        <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Template
        </p>
        <select
          value={templateSlug}
          onChange={(e) => setTemplateSlug(e.target.value)}
          aria-label="Template"
          className="h-9 w-full rounded-lg border bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          {templates.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.name} — {t.tags.join(", ")}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-muted-foreground">
          You can change the template, colours, fonts and layout at any time without touching the
          content.
        </p>
      </aside>
    </form>
  );
}

function SubmitButton({ docType }: { docType: DocType }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
      {pending ? "Building your draft…" : `Generate my ${docType === "cv" ? "CV" : "résumé"}`}
    </Button>
  );
}

function Section({
  title,
  required,
  children,
}: {
  title: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2.5 text-sm font-semibold">
        {title}
        {required && <span className="ml-1 text-destructive">*</span>}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function TypeCard({
  active,
  onClick,
  title,
  body,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  body: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-xl border p-4 text-left transition-colors",
        active ? "border-primary bg-primary/5" : "hover:border-foreground/25",
      )}
    >
      <span className="block font-medium">{title}</span>
      <span className="mt-0.5 block text-sm text-muted-foreground">{body}</span>
    </button>
  );
}
