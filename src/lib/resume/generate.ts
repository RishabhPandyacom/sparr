/**
 * One-shot document generation.
 *
 * Give it a target role and it returns a complete, coherent, fully editable
 * document — header, summary, dated roles with quantified bullets, projects,
 * skills grouped the way that role's hiring managers expect, and the extra
 * sections that role needs (publications for researchers, certifications for
 * clinicians, a portfolio for designers).
 *
 * This module is deliberately PURE and dependency-free so it can run:
 *   - as the offline draft when no LLM key is configured
 *   - as the scaffold an LLM then rewrites, so the shape is never wrong
 *   - as the deterministic fallback when a model returns unusable JSON
 */

import {
  emptyContent,
  makeEntry,
  makeSection,
  newId,
  type DocType,
  type EntryItem,
  type ResumeContent,
  type Section,
  type SectionKey,
} from "./schema";
import { getTemplateDef } from "./design";
import { matchRoleFamily, type RoleFamily, type Seniority } from "./roleLibrary";
import { extractKeywords } from "./keywords";

export type GenerationSpec = {
  fullName: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  targetRole: string;
  seniority: Seniority;
  yearsExperience?: number;
  industry?: string;
  /** Free-text: anything the person wants reflected in the draft. */
  highlights?: string;
  /** Comma-separated or freeform skills the person already has. */
  skills?: string;
  currentCompany?: string;
  previousCompany?: string;
  degree?: string;
  school?: string;
  graduationYear?: string;
  docType: DocType;
  templateSlug: string;
  /** Optional posting to bias skills and summary toward. */
  jobDescription?: string;
};

// ── entry point ─────────────────────────────────────────────────────────────

export function generateDocument(spec: GenerationSpec): ResumeContent {
  const family = matchRoleFamily(`${spec.targetRole} ${spec.industry ?? ""}`);
  const rng = seededRng(`${spec.fullName}|${spec.targetRole}|${spec.seniority}`);
  const tpl = getTemplateDef(spec.templateSlug);

  const c = emptyContent(spec.docType);
  c.theme = { ...tpl.theme };
  c.basics = {
    fullName: spec.fullName.trim() || "Your Name",
    title: titleCase(spec.targetRole.trim()) || family.label,
    email: spec.email?.trim() ?? "",
    phone: spec.phone?.trim() ?? "",
    location: spec.location?.trim() ?? "",
    website: spec.website?.trim() ?? "",
    summary: "",
    links: [
      spec.linkedin?.trim() && { id: newId("l"), label: "LinkedIn", url: spec.linkedin.trim() },
      spec.github?.trim() && { id: newId("l"), label: "GitHub", url: spec.github.trim() },
    ].filter(Boolean) as ResumeContent["basics"]["links"],
  };

  const summary = buildSummary(spec, family, rng);
  c.basics.summary = summary;

  const sections: Section[] = [];
  sections.push(sec("summary", { kind: "text", text: summary }));

  if (spec.docType === "cv") {
    sections.push(educationSection(spec, family));
    sections.push(experienceSection(spec, family, rng, "Research & Professional Experience"));
    sections.push(sec("publications", { kind: "entries", entries: publicationStubs(spec) }));
    sections.push(sec("teaching", { kind: "entries", entries: [teachingStub(spec, rng)] }));
    sections.push(sec("grants", { kind: "entries", entries: [grantStub(spec, rng)] }));
    sections.push(sec("conferences", { kind: "entries", entries: [conferenceStub(spec)] }));
    sections.push(awardsSection(spec, rng));
    sections.push(skillsSection(spec, family));
    sections.push(sec("references", { kind: "entries", entries: [referenceStub()] }));
  } else {
    sections.push(experienceSection(spec, family, rng));
    if (spec.seniority === "student" || spec.seniority === "entry") {
      sections.push(projectsSection(family, rng));
      sections.push(educationSection(spec, family));
    } else {
      sections.push(educationSection(spec, family));
      sections.push(projectsSection(family, rng));
    }
    sections.push(skillsSection(spec, family));
    if (family.groups.length > 1 && !isJuniorish(spec.seniority)) {
      sections.push(sec("skillGroups", { kind: "groups", groups: buildGroups(family, spec) }));
    }
    if (family.certifications?.length) {
      sections.push(
        sec("certifications", {
          kind: "entries",
          entries: family.certifications.slice(0, 2).map((name) =>
            makeEntry({ title: name, subtitle: "Issuing body", endDate: String(currentYear()) }),
          ),
        }),
      );
    }
    for (const extra of family.extraSections ?? []) {
      if (!sections.some((s) => s.key === extra)) {
        sections.push(makeSection(extra));
      }
    }
  }

  c.sections = sections;
  return c;
}

const sec = (key: SectionKey, patch: Partial<Section>): Section =>
  ({ ...makeSection(key), ...patch }) as Section;

// ── summary ─────────────────────────────────────────────────────────────────

function buildSummary(spec: GenerationSpec, family: RoleFamily, rng: Rng): string {
  const template = pick(family.summary, rng);
  const years = spec.yearsExperience
    ? `${spec.yearsExperience}+ years across ${spec.industry || "product teams"}. `
    : "";
  const focus =
    spec.industry?.trim() ||
    topKeywords(spec.jobDescription, 2).join(" and ") ||
    family.coreSkills.slice(0, 2).join(" and ");

  let text = template
    .replace("{seniority}", seniorityWord(spec.seniority))
    .replace("{years}", years)
    .replace("{focus}", focus);

  // Fold the user's own words in — their sentence beats our template.
  const own = firstSentence(spec.highlights ?? "");
  if (own) text = `${text} ${own}`;

  return collapse(text);
}

function seniorityWord(s: Seniority): string {
  switch (s) {
    case "student":
      return "Final-year student and aspiring";
    case "entry":
      return "Early-career";
    case "mid":
      return "Mid-level";
    case "senior":
      return "Senior";
    case "lead":
      return "Lead";
    case "executive":
      return "Executive";
  }
}

// ── experience ──────────────────────────────────────────────────────────────

function experienceSection(
  spec: GenerationSpec,
  family: RoleFamily,
  rng: Rng,
  label?: string,
): Section {
  const count = entryCountFor(spec.seniority);
  const pool = shuffle(family.bullets, rng);
  const leadPool = shuffle(family.leadership, rng);
  const senior = spec.seniority === "lead" || spec.seniority === "executive" || spec.seniority === "senior";

  const year = currentYear();
  const entries: EntryItem[] = [];
  let end = year;

  for (let i = 0; i < count; i++) {
    const span = i === 0 ? Math.max(1, Math.min(3, spec.yearsExperience ?? 2)) : 2;
    const start = end - span;
    const bulletCount = i === 0 ? 4 : i === 1 ? 3 : 2;
    const bullets: string[] = [];

    if (senior && i === 0) bullets.push(fill(pick(leadPool, rng), rng, spec));
    while (bullets.length < bulletCount) {
      const b = fill(pool[(i * 4 + bullets.length) % pool.length], rng, spec);
      if (!bullets.includes(b)) bullets.push(b);
    }

    entries.push(
      makeEntry({
        title: roleTitleFor(spec, i),
        subtitle:
          i === 0
            ? spec.currentCompany?.trim() || "Company name"
            : i === 1
              ? spec.previousCompany?.trim() || "Previous company"
              : "Earlier company",
        meta: spec.location?.trim() || "City, Country",
        startDate: monthYear(start, rng),
        endDate: i === 0 ? "Present" : monthYear(end, rng),
        current: i === 0,
        bullets,
        tags: i === 0 ? family.coreSkills.slice(0, 4) : undefined,
      }),
    );
    end = start;
  }

  const base = makeSection("experience");
  return { ...base, kind: "entries", entries, label: label ?? base.label } as Section;
}

function entryCountFor(s: Seniority): number {
  switch (s) {
    case "student":
      return 1;
    case "entry":
      return 2;
    case "mid":
      return 2;
    default:
      return 3;
  }
}

function roleTitleFor(spec: GenerationSpec, index: number): string {
  const role = titleCase(spec.targetRole.trim()) || "Professional";
  if (index === 0) {
    if (spec.seniority === "student") return `${role} Intern`;
    return role;
  }
  if (spec.seniority === "student" || spec.seniority === "entry") return `Junior ${role}`;
  if (index === 1) return spec.seniority === "executive" ? `Senior ${role}` : role;
  return `Junior ${role}`;
}

// ── other sections ──────────────────────────────────────────────────────────

function projectsSection(family: RoleFamily, rng: Rng): Section {
  const entries = family.projects.map((p) =>
    makeEntry({
      title: p.title,
      subtitle: p.subtitle,
      link: "",
      bullets: p.bullets.map((b) => fill(b, rng)),
      tags: p.tags,
    }),
  );
  const base = makeSection("projects");
  return { ...base, kind: "entries", entries } as Section;
}

function educationSection(spec: GenerationSpec, family: RoleFamily): Section {
  const grad = spec.graduationYear?.trim() || String(currentYear() - (spec.yearsExperience ?? 1));
  const startYear = Number(grad) - 4;
  const entry = makeEntry({
    title: spec.degree?.trim() || defaultDegree(family),
    subtitle: spec.school?.trim() || "University name",
    meta: spec.location?.trim() || "City, Country",
    startDate: Number.isFinite(startYear) ? String(startYear) : "",
    endDate: grad,
    description:
      spec.docType === "cv"
        ? "Thesis: working title. Advisor: name."
        : `Relevant coursework: ${family.coreSkills.slice(0, 3).join(", ")}.`,
    bullets: [],
  });
  const base = makeSection("education");
  return { ...base, kind: "entries", entries: [entry] } as Section;
}

function defaultDegree(family: RoleFamily): string {
  switch (family.id) {
    case "software":
    case "frontend":
    case "mobile":
    case "devops":
    case "security":
    case "qa":
      return "B.S. in Computer Science";
    case "data-science":
    case "data-engineer":
    case "data-analyst":
      return "B.S. in Statistics";
    case "design":
      return "B.A. in Design";
    case "finance":
      return "B.S. in Finance";
    case "healthcare":
      return "B.S. in Nursing";
    case "education":
      return "B.Ed. in Education";
    case "legal":
      return "LL.B. / J.D.";
    case "research":
      return "Ph.D. in your field";
    default:
      return "B.A. / B.S.";
  }
}

function skillsSection(spec: GenerationSpec, family: RoleFamily): Section {
  const own = splitList(spec.skills ?? "");
  const fromJd = topKeywords(spec.jobDescription, 6);
  const merged = dedupe([...own, ...fromJd, ...family.coreSkills, ...family.tools]).slice(0, 16);
  const base = makeSection("skills");
  return { ...base, kind: "tags", tags: merged } as Section;
}

function buildGroups(family: RoleFamily, spec: GenerationSpec) {
  const own = splitList(spec.skills ?? "");
  return family.groups.map((g, i) => ({
    id: newId(`g${i}`),
    label: g.label,
    tags: i === 0 ? dedupe([...own, ...g.tags]).slice(0, 8) : g.tags,
  }));
}

function awardsSection(spec: GenerationSpec, rng: Rng): Section {
  const base = makeSection("awards");
  return {
    ...base,
    kind: "entries",
    entries: [
      makeEntry({
        title: "Award or honour",
        subtitle: "Awarding body",
        endDate: String(currentYear() - int(rng, 0, 3)),
      }),
    ],
  } as Section;
}

function publicationStubs(spec: GenerationSpec): EntryItem[] {
  const year = currentYear();
  return [0, 1].map((i) =>
    makeEntry({
      title: `Paper title ${i + 1}`,
      subtitle: "Journal or conference",
      meta: `${lastNameOf(spec.fullName)}, A., & Co-author, B.`,
      endDate: String(year - i),
      description: "",
      bullets: [],
    }),
  );
}

function teachingStub(spec: GenerationSpec, rng: Rng): EntryItem {
  return makeEntry({
    title: "Teaching Assistant — Course name",
    subtitle: spec.school?.trim() || "University name",
    meta: `Semester ${currentYear() - 1}`,
    bullets: [`Led weekly sections for ${int(rng, 20, 60)} students and graded coursework.`],
  });
}

function grantStub(spec: GenerationSpec, rng: Rng): EntryItem {
  return makeEntry({
    title: "Research grant or fellowship",
    subtitle: "Funding body",
    meta: `$${(int(rng, 5, 90) * 1000).toLocaleString()}`,
    endDate: String(currentYear() - int(rng, 0, 2)),
    bullets: [],
  });
}

function conferenceStub(spec: GenerationSpec): EntryItem {
  return makeEntry({
    title: "Presentation title",
    subtitle: "Conference name",
    meta: spec.location?.trim() || "City, Country",
    endDate: String(currentYear()),
    bullets: [],
  });
}

function referenceStub(): EntryItem {
  return makeEntry({
    title: "Referee name",
    subtitle: "Title, Institution",
    meta: "email@institution.edu",
    bullets: [],
  });
}

// ── placeholder filling ─────────────────────────────────────────────────────

/**
 * Fills {metric} placeholders with plausible, internally-consistent numbers.
 * These are explicitly starting points — the editor flags any bullet the user
 * hasn't touched so nobody ships an invented statistic by accident.
 */
function fill(template: string, rng: Rng, spec?: GenerationSpec): string {
  const pctLow = int(rng, 12, 45);
  const ms3 = int(rng, 3, 9);
  const money = `$${int(rng, 40, 900)}K`;
  return template
    .replace(/{feature}/g, pick(FEATURES, rng))
    .replace(/{subject}/g, spec?.industry?.trim() || "the core subject")
    .replace(/{metricArea}/g, pick(["fall", "medication error", "infection", "readmission"], rng))
    .replace(/{role}/g, "co-investigator")
    .replace(/{pctLow}/g, String(pctLow))
    .replace(/{pctHigh}/g, String(int(rng, 82, 98)))
    .replace(/{pctVar}/g, String(int(rng, 2, 6)))
    .replace(/{pct}/g, String(int(rng, 18, 62)))
    .replace(/{k}/g, `${int(rng, 2, 90)}K`)
    .replace(/{n3}/g, String(int(rng, 40, 400)))
    .replace(/{n2}/g, String(int(rng, 3, 12)))
    .replace(/{n}/g, String(int(rng, 3, 24)))
    .replace(/{team}/g, String(int(rng, 4, 12)))
    .replace(/{ms2}/g, String(int(rng, 40, 180)))
    .replace(/{ms3}/g, String(ms3))
    .replace(/{ms4}/g, String(Math.max(1, ms3 - int(rng, 1, 3))))
    .replace(/{ms}/g, String(int(rng, 400, 1800)))
    .replace(/{sec2}/g, (int(rng, 8, 16) / 10).toFixed(1))
    .replace(/{sec}/g, (int(rng, 24, 52) / 10).toFixed(1))
    .replace(/{money2}/g, `$${int(rng, 1, 40)}M`)
    .replace(/{money}/g, money)
    .replace(/{avail2}/g, "99.95")
    .replace(/{avail}/g, "99.5")
    .replace(/{auc}/g, `0.${int(rng, 78, 94)}`)
    .replace(/{rating}/g, (int(rng, 42, 49) / 10).toFixed(1));
}

const FEATURES = [
  "the onboarding flow",
  "the search experience",
  "the billing system",
  "the reporting module",
  "the notification service",
  "the customer dashboard",
  "the checkout flow",
  "the admin console",
];

// ── deterministic randomness ────────────────────────────────────────────────

type Rng = () => number;

/** xmur3 + mulberry32 — small, fast, and stable across runs and platforms. */
function seededRng(seed: string): Rng {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const int = (rng: Rng, lo: number, hi: number) => Math.floor(rng() * (hi - lo + 1)) + lo;
const pick = <T,>(list: T[], rng: Rng): T => list[Math.floor(rng() * list.length) % list.length];

function shuffle<T>(list: T[], rng: Rng): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ── text utils ──────────────────────────────────────────────────────────────

const currentYear = () => new Date().getFullYear();

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthYear = (year: number, rng: Rng) => `${MONTHS[int(rng, 0, 11)]} ${year}`;

function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => (w.length > 2 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function splitList(s: string): string[] {
  return s
    .split(/[,;\n•|]/)
    .map((x) => x.trim())
    .filter((x) => x.length > 1 && x.length < 40);
}

function dedupe(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function topKeywords(jd: string | undefined, n: number): string[] {
  if (!jd?.trim()) return [];
  return extractKeywords(jd, n * 3)
    .slice(0, n)
    .map((k) => titleCase(k.term));
}

function firstSentence(s: string): string {
  const t = s.trim();
  if (!t) return "";
  const m = t.match(/^[^.!?]{10,200}[.!?]/);
  return m ? m[0].trim() : t.length <= 200 ? `${t.replace(/[.\s]+$/, "")}.` : "";
}

const collapse = (s: string) => s.replace(/\s+/g, " ").trim();
const isJuniorish = (s: Seniority) => s === "student" || s === "entry";
const lastNameOf = (name: string) => name.trim().split(/\s+/).pop() || "Author";
