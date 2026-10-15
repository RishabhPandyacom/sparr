/**
 * Canonical résumé / CV content model (v2).
 *
 * ONE shape that every template — on-screen and PDF — renders from. The key
 * idea: a document is `basics` + an ORDERED list of `sections`. Every section
 * is one of four kinds (text / entries / tags / groups), so a template never
 * needs to know about "publications" vs "experience" — it renders kinds. That
 * means:
 *   - adding a template is a pure config object, never a schema change
 *   - adding a section type (grants, patents, teaching…) is a preset, not code
 *   - users can reorder, rename, hide, and invent their own sections for free
 *
 * v1 documents (basics/experience/education/projects/skills) are migrated
 * transparently by `normalizeContent`, so existing rows keep working.
 */

import { DEFAULT_THEME, type ResumeTheme } from "./design";

// ── Primitives ──────────────────────────────────────────────────────────────

export type DocType = "resume" | "cv";

/**
 * Universal entry. Experience, education, projects, publications, awards and
 * everything else map onto these fields — only the labels differ per section.
 *
 *   experience    title=Role        subtitle=Company     meta=Location
 *   education     title=Degree      subtitle=School      meta=Location
 *   projects      title=Name        subtitle=Stack       link=URL
 *   publications  title=Paper       subtitle=Venue       meta=Authors
 *   certifications title=Cert       subtitle=Issuer      meta=Credential ID
 */
export type EntryItem = {
  id: string;
  title: string;
  subtitle?: string;
  /** Third line / right-hand detail: location, authors, credential id… */
  meta?: string;
  startDate?: string;
  endDate?: string;
  /** `true` renders the end date as "Present". */
  current?: boolean;
  link?: string;
  description?: string;
  bullets: string[];
  /** Per-entry tags (tech stack on a project, keywords on a paper). */
  tags?: string[];
};

export type TagGroup = {
  id: string;
  label: string;
  tags: string[];
};

export type SocialLink = {
  id: string;
  label: string;
  url: string;
};

export type ResumeBasics = {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  summary: string;
  /** Optional headshot (data URL or remote). Off by default — ATS-hostile. */
  photoUrl?: string;
  links: SocialLink[];
  /** Free-form line under the name on some academic layouts. */
  affiliation?: string;
};

// ── Sections ────────────────────────────────────────────────────────────────

export type SectionKind = "text" | "entries" | "tags" | "groups";

/** Which column a section prefers on two-column layouts. */
export type SectionColumn = "main" | "side";

type SectionBase = {
  id: string;
  /** Preset identity — drives default labels, icons and AI behaviour. */
  key: SectionKey;
  label: string;
  visible: boolean;
  column?: SectionColumn;
};

export type TextSection = SectionBase & { kind: "text"; text: string };
export type EntriesSection = SectionBase & { kind: "entries"; entries: EntryItem[] };
export type TagsSection = SectionBase & { kind: "tags"; tags: string[] };
export type GroupsSection = SectionBase & { kind: "groups"; groups: TagGroup[] };

export type Section = TextSection | EntriesSection | TagsSection | GroupsSection;

export const SECTION_KEYS = [
  "summary",
  "experience",
  "education",
  "projects",
  "skills",
  "skillGroups",
  "certifications",
  "awards",
  "publications",
  "research",
  "teaching",
  "grants",
  "patents",
  "conferences",
  "talks",
  "memberships",
  "languages",
  "volunteering",
  "leadership",
  "courses",
  "interests",
  "references",
  "portfolio",
  "custom",
] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export type SectionPreset = {
  key: SectionKey;
  label: string;
  kind: SectionKind;
  column: SectionColumn;
  /** Shown in the "add section" menu. */
  hint: string;
  /** Field labels used by the editor for entry sections. */
  fields?: { title: string; subtitle: string; meta: string };
  /** Which document families suggest this section by default. */
  families: DocType[];
};

export const SECTION_PRESETS: Record<SectionKey, SectionPreset> = {
  summary: {
    key: "summary",
    label: "Summary",
    kind: "text",
    column: "main",
    hint: "A 2–3 sentence pitch at the top of the page.",
    families: ["resume", "cv"],
  },
  experience: {
    key: "experience",
    label: "Experience",
    kind: "entries",
    column: "main",
    hint: "Jobs, internships and contract work.",
    fields: { title: "Role", subtitle: "Company", meta: "Location" },
    families: ["resume", "cv"],
  },
  education: {
    key: "education",
    label: "Education",
    kind: "entries",
    column: "main",
    hint: "Degrees, schools and coursework.",
    fields: { title: "Degree", subtitle: "Institution", meta: "Location" },
    families: ["resume", "cv"],
  },
  projects: {
    key: "projects",
    label: "Projects",
    kind: "entries",
    column: "main",
    hint: "Things you built, with links and impact.",
    fields: { title: "Project", subtitle: "Stack / role", meta: "Context" },
    families: ["resume", "cv"],
  },
  skills: {
    key: "skills",
    label: "Skills",
    kind: "tags",
    column: "side",
    hint: "A flat, scannable keyword list. Best for ATS.",
    families: ["resume", "cv"],
  },
  skillGroups: {
    key: "skillGroups",
    label: "Technical Skills",
    kind: "groups",
    column: "main",
    hint: "Skills bucketed by category (Languages, Cloud, Tools…).",
    families: ["resume", "cv"],
  },
  certifications: {
    key: "certifications",
    label: "Certifications",
    kind: "entries",
    column: "side",
    hint: "Licences and credentials with issuer and date.",
    fields: { title: "Certification", subtitle: "Issuer", meta: "Credential ID" },
    families: ["resume", "cv"],
  },
  awards: {
    key: "awards",
    label: "Awards & Honours",
    kind: "entries",
    column: "side",
    hint: "Prizes, scholarships, hackathon wins.",
    fields: { title: "Award", subtitle: "Awarded by", meta: "Detail" },
    families: ["resume", "cv"],
  },
  publications: {
    key: "publications",
    label: "Publications",
    kind: "entries",
    column: "main",
    hint: "Papers, preprints and book chapters with venue and authors.",
    fields: { title: "Title", subtitle: "Venue", meta: "Authors" },
    families: ["cv"],
  },
  research: {
    key: "research",
    label: "Research Experience",
    kind: "entries",
    column: "main",
    hint: "Labs, advisors and research programmes.",
    fields: { title: "Position", subtitle: "Lab / Advisor", meta: "Institution" },
    families: ["cv"],
  },
  teaching: {
    key: "teaching",
    label: "Teaching Experience",
    kind: "entries",
    column: "main",
    hint: "Courses taught, TA roles, mentoring.",
    fields: { title: "Course / Role", subtitle: "Institution", meta: "Term" },
    families: ["cv"],
  },
  grants: {
    key: "grants",
    label: "Grants & Funding",
    kind: "entries",
    column: "main",
    hint: "Awarded funding with agency and amount.",
    fields: { title: "Grant", subtitle: "Funding body", meta: "Amount" },
    families: ["cv"],
  },
  patents: {
    key: "patents",
    label: "Patents",
    kind: "entries",
    column: "main",
    hint: "Filed or granted patents with number and status.",
    fields: { title: "Patent", subtitle: "Office", meta: "Number" },
    families: ["cv", "resume"],
  },
  conferences: {
    key: "conferences",
    label: "Conference Presentations",
    kind: "entries",
    column: "main",
    hint: "Posters, panels and conference talks.",
    fields: { title: "Presentation", subtitle: "Conference", meta: "Location" },
    families: ["cv"],
  },
  talks: {
    key: "talks",
    label: "Talks & Workshops",
    kind: "entries",
    column: "main",
    hint: "Invited talks, meetups, internal workshops.",
    fields: { title: "Talk", subtitle: "Event", meta: "Audience" },
    families: ["resume", "cv"],
  },
  memberships: {
    key: "memberships",
    label: "Professional Memberships",
    kind: "entries",
    column: "side",
    hint: "Societies, committees and editorial boards.",
    fields: { title: "Organisation", subtitle: "Role", meta: "Detail" },
    families: ["cv"],
  },
  languages: {
    key: "languages",
    label: "Languages",
    kind: "tags",
    column: "side",
    hint: "Spoken languages with fluency, e.g. “Spanish — Fluent”.",
    families: ["resume", "cv"],
  },
  volunteering: {
    key: "volunteering",
    label: "Volunteering",
    kind: "entries",
    column: "main",
    hint: "Community work and pro-bono contributions.",
    fields: { title: "Role", subtitle: "Organisation", meta: "Location" },
    families: ["resume", "cv"],
  },
  leadership: {
    key: "leadership",
    label: "Leadership & Activities",
    kind: "entries",
    column: "main",
    hint: "Clubs, societies and student leadership.",
    fields: { title: "Role", subtitle: "Organisation", meta: "Location" },
    families: ["resume", "cv"],
  },
  courses: {
    key: "courses",
    label: "Relevant Coursework",
    kind: "tags",
    column: "side",
    hint: "Named courses that support your target role.",
    families: ["resume", "cv"],
  },
  interests: {
    key: "interests",
    label: "Interests",
    kind: "tags",
    column: "side",
    hint: "A short, human line. Keep it to one row.",
    families: ["resume", "cv"],
  },
  references: {
    key: "references",
    label: "References",
    kind: "entries",
    column: "main",
    hint: "Named referees — expected on academic CVs.",
    fields: { title: "Name", subtitle: "Title & institution", meta: "Contact" },
    families: ["cv"],
  },
  portfolio: {
    key: "portfolio",
    label: "Selected Work",
    kind: "entries",
    column: "main",
    hint: "Case studies and portfolio pieces with outcomes.",
    fields: { title: "Piece", subtitle: "Client / context", meta: "Role" },
    families: ["resume"],
  },
  custom: {
    key: "custom",
    label: "Custom Section",
    kind: "entries",
    column: "main",
    hint: "Anything else — name it whatever you like.",
    fields: { title: "Title", subtitle: "Subtitle", meta: "Detail" },
    families: ["resume", "cv"],
  },
};

// ── Document ────────────────────────────────────────────────────────────────

export type ResumeContent = {
  version: 2;
  docType: DocType;
  basics: ResumeBasics;
  sections: Section[];
  theme: ResumeTheme;
};

// ── ids ─────────────────────────────────────────────────────────────────────

let idCounter = 0;
/** Stable-enough id for array items (collision-safe within a session). */
export function newId(prefix = "item"): string {
  idCounter += 1;
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${idCounter}`;
}

// ── Builders ────────────────────────────────────────────────────────────────

export function makeEntry(partial: Partial<EntryItem> = {}): EntryItem {
  return {
    id: newId("e"),
    title: "",
    subtitle: "",
    meta: "",
    startDate: "",
    endDate: "",
    bullets: [],
    ...partial,
  };
}

export function makeSection(
  key: SectionKey,
  overrides: Partial<Section> = {},
): Section {
  const preset = SECTION_PRESETS[key];
  const base = {
    id: newId("s"),
    key,
    label: preset.label,
    visible: true,
    column: preset.column,
  };
  switch (preset.kind) {
    case "text":
      return { ...base, kind: "text", text: "", ...(overrides as object) } as TextSection;
    case "tags":
      return { ...base, kind: "tags", tags: [], ...(overrides as object) } as TagsSection;
    case "groups":
      return { ...base, kind: "groups", groups: [], ...(overrides as object) } as GroupsSection;
    case "entries":
    default:
      return { ...base, kind: "entries", entries: [], ...(overrides as object) } as EntriesSection;
  }
}

// ── Selectors ───────────────────────────────────────────────────────────────

export function findSection(c: ResumeContent, key: SectionKey): Section | undefined {
  return c.sections.find((s) => s.key === key);
}

export function getEntries(c: ResumeContent, key: SectionKey): EntryItem[] {
  const s = findSection(c, key);
  return s && s.kind === "entries" ? s.entries : [];
}

export function getTags(c: ResumeContent, key: SectionKey): string[] {
  const s = findSection(c, key);
  if (!s) return [];
  if (s.kind === "tags") return s.tags;
  if (s.kind === "groups") return s.groups.flatMap((g) => g.tags);
  return [];
}

export function getText(c: ResumeContent, key: SectionKey): string {
  const s = findSection(c, key);
  return s && s.kind === "text" ? s.text : "";
}

/** Every skill-ish keyword in the document (flat + grouped + entry tags). */
export function allSkills(c: ResumeContent): string[] {
  const out = new Set<string>();
  for (const s of c.sections) {
    if (s.kind === "tags" && (s.key === "skills" || s.key === "courses")) {
      s.tags.forEach((t) => out.add(t));
    }
    if (s.kind === "groups") s.groups.forEach((g) => g.tags.forEach((t) => out.add(t)));
    if (s.kind === "entries") {
      s.entries.forEach((e) => (e.tags ?? []).forEach((t) => out.add(t)));
    }
  }
  return [...out];
}

export const visibleSections = (c: ResumeContent) => c.sections.filter((s) => s.visible);

/** Flattens the document into plain text (ATS export, AI context, analysis). */
export function resumePlainText(c: ResumeContent): string {
  const lines: string[] = [];
  const b = c.basics;
  lines.push(b.fullName, b.title);
  lines.push(
    [b.email, b.phone, b.location, b.website, ...b.links.map((l) => l.url)]
      .filter(Boolean)
      .join(" | "),
  );
  for (const s of visibleSections(c)) {
    lines.push("", s.label.toUpperCase());
    if (s.kind === "text") lines.push(s.text);
    if (s.kind === "tags") lines.push(s.tags.join(", "));
    if (s.kind === "groups") s.groups.forEach((g) => lines.push(`${g.label}: ${g.tags.join(", ")}`));
    if (s.kind === "entries") {
      for (const e of s.entries) {
        lines.push(
          [e.title, e.subtitle, e.meta].filter(Boolean).join(" — ") +
            (e.startDate || e.endDate ? ` (${formatRange(e)})` : ""),
        );
        if (e.description) lines.push(e.description);
        e.bullets.filter(Boolean).forEach((x) => lines.push(`- ${x}`));
        if (e.tags?.length) lines.push(e.tags.join(", "));
      }
    }
  }
  return lines.filter((l) => l !== undefined).join("\n");
}

export function formatRange(e: {
  startDate?: string;
  endDate?: string;
  current?: boolean;
}): string {
  const end = e.current ? "Present" : (e.endDate ?? "");
  return [e.startDate, end].filter(Boolean).join(" – ");
}

/** Short context blob handed to the AI so prompts stay small. */
export function resumeContextForAi(c: ResumeContent, limit = 3000): string {
  const text = resumePlainText(c);
  return text.length > limit ? `${text.slice(0, limit)}…` : text;
}

// ── Defaults / migration ────────────────────────────────────────────────────

const DEFAULT_RESUME_ORDER: SectionKey[] = [
  "summary",
  "experience",
  "projects",
  "education",
  "skills",
];

const DEFAULT_CV_ORDER: SectionKey[] = [
  "summary",
  "education",
  "research",
  "publications",
  "teaching",
  "grants",
  "conferences",
  "awards",
  "memberships",
  "skills",
  "references",
];

export function emptyContent(docType: DocType = "resume"): ResumeContent {
  const order = docType === "cv" ? DEFAULT_CV_ORDER : DEFAULT_RESUME_ORDER;
  return {
    version: 2,
    docType,
    basics: {
      fullName: "",
      title: "",
      email: "",
      phone: "",
      location: "",
      website: "",
      summary: "",
      links: [],
    },
    sections: order.map((k) => makeSection(k)),
    theme: { ...DEFAULT_THEME },
  };
}

/** Starter content used when a document is created from a blank template. */
export function sampleResumeContent(fullName = "", docType: DocType = "resume"): ResumeContent {
  const c = emptyContent(docType);
  c.basics = {
    ...c.basics,
    fullName: fullName || "Your Name",
    title: "Aspiring Software Engineer",
    email: "you@example.com",
    phone: "(555) 123-4567",
    location: "City, Country",
    website: "yourportfolio.com",
    summary:
      "Final-year CS student who ships. Comfortable across the stack, fast to learn, and happiest when a thing I built is in someone's hands.",
    links: [
      { id: newId("l"), label: "LinkedIn", url: "linkedin.com/in/you" },
      { id: newId("l"), label: "GitHub", url: "github.com/you" },
    ],
  };

  set(c, "summary", { kind: "text", text: c.basics.summary });
  set(c, "experience", {
    kind: "entries",
    entries: [
      makeEntry({
        title: "Software Engineering Intern",
        subtitle: "Tech Company",
        meta: "Remote",
        startDate: "Jun 2024",
        endDate: "Aug 2024",
        bullets: [
          "Shipped a search feature used by 10k+ monthly users, cutting support tickets 20%.",
          "Raised test coverage from 60% to 85%, reducing regressions in the release train.",
        ],
        tags: ["TypeScript", "React", "PostgreSQL"],
      }),
    ],
  });
  set(c, "projects", {
    kind: "entries",
    entries: [
      makeEntry({
        title: "Side Project",
        subtitle: "Full-stack build",
        link: "github.com/you/project",
        bullets: ["Describe what it does, who uses it, and the scale or impact."],
        tags: ["Next.js", "Supabase"],
      }),
    ],
  });
  set(c, "education", {
    kind: "entries",
    entries: [
      makeEntry({
        title: "B.S. in Computer Science",
        subtitle: "Your University",
        meta: "City, Country",
        startDate: "2021",
        endDate: "2025",
        description: "Relevant coursework: Data Structures, Algorithms, Databases.",
        bullets: [],
      }),
    ],
  });
  set(c, "skills", {
    kind: "tags",
    tags: ["TypeScript", "React", "Node.js", "Python", "SQL", "Git", "Communication"],
  });
  return c;
}

function set(c: ResumeContent, key: SectionKey, patch: Partial<Section>) {
  c.sections = c.sections.map((s) =>
    s.key === key ? ({ ...s, ...patch } as Section) : s,
  );
}

// ── v1 → v2 migration ───────────────────────────────────────────────────────

type LegacyContent = {
  basics?: Partial<ResumeBasics>;
  experience?: Array<Record<string, unknown>>;
  education?: Array<Record<string, unknown>>;
  projects?: Array<Record<string, unknown>>;
  skills?: string[];
};

/**
 * Accepts anything stored in `resumes.content` and returns a valid v2 document.
 * Handles: v2 (validated + gap-filled), v1 (migrated), and junk (fresh sample).
 */
export function normalizeContent(raw: unknown, docType: DocType = "resume"): ResumeContent {
  if (!raw || typeof raw !== "object") return sampleResumeContent("", docType);
  const r = raw as Record<string, unknown>;

  if (r.version === 2 && Array.isArray(r.sections)) return validateV2(r, docType);
  return migrateV1(r as LegacyContent, docType);
}

function validateV2(r: Record<string, unknown>, docType: DocType): ResumeContent {
  const base = emptyContent((r.docType as DocType) ?? docType);
  const rb = (r.basics ?? {}) as Partial<ResumeBasics>;
  const sections = (r.sections as unknown[])
    .filter((s): s is Record<string, unknown> => !!s && typeof s === "object")
    .map(normalizeSection);

  return {
    version: 2,
    docType: (r.docType as DocType) === "cv" ? "cv" : "resume",
    basics: {
      ...base.basics,
      ...rb,
      links: Array.isArray(rb.links)
        ? rb.links.map((l, i) => ({
            id: l?.id ?? newId(`l${i}`),
            label: l?.label ?? "",
            url: l?.url ?? "",
          }))
        : [],
    },
    sections: sections.length ? sections : base.sections,
    theme: { ...DEFAULT_THEME, ...((r.theme as Partial<ResumeTheme>) ?? {}) },
  };
}

function normalizeSection(s: Record<string, unknown>): Section {
  const key = (SECTION_KEYS as readonly string[]).includes(s.key as string)
    ? (s.key as SectionKey)
    : "custom";
  const base = {
    id: (s.id as string) ?? newId("s"),
    key,
    label: (s.label as string) ?? SECTION_PRESETS[key].label,
    visible: s.visible !== false,
    column: (s.column as SectionColumn) ?? SECTION_PRESETS[key].column,
  };
  const kind = (s.kind as SectionKind) ?? SECTION_PRESETS[key].kind;
  switch (kind) {
    case "text":
      return { ...base, kind: "text", text: String(s.text ?? "") };
    case "tags":
      return {
        ...base,
        kind: "tags",
        tags: Array.isArray(s.tags) ? (s.tags as string[]).map(String) : [],
      };
    case "groups":
      return {
        ...base,
        kind: "groups",
        groups: Array.isArray(s.groups)
          ? (s.groups as TagGroup[]).map((g, i) => ({
              id: g?.id ?? newId(`g${i}`),
              label: g?.label ?? "Group",
              tags: Array.isArray(g?.tags) ? g.tags.map(String) : [],
            }))
          : [],
      };
    default:
      return {
        ...base,
        kind: "entries",
        entries: Array.isArray(s.entries)
          ? (s.entries as Partial<EntryItem>[]).map((e, i) =>
              makeEntry({
                ...e,
                id: e?.id ?? newId(`e${i}`),
                bullets: Array.isArray(e?.bullets) ? e.bullets.map(String) : [],
              }),
            )
          : [],
      };
  }
}

function migrateV1(v1: LegacyContent, docType: DocType): ResumeContent {
  const c = emptyContent(docType);
  const b = v1.basics ?? {};
  c.basics = {
    ...c.basics,
    fullName: String(b.fullName ?? ""),
    title: String(b.title ?? ""),
    email: String(b.email ?? ""),
    phone: String(b.phone ?? ""),
    location: String(b.location ?? ""),
    website: String(b.website ?? ""),
    summary: String(b.summary ?? ""),
    links: [],
  };

  set(c, "summary", { kind: "text", text: c.basics.summary });
  set(c, "experience", {
    kind: "entries",
    entries: (v1.experience ?? []).map((e) =>
      makeEntry({
        title: str(e.role),
        subtitle: str(e.company),
        meta: str(e.location),
        startDate: str(e.startDate),
        endDate: str(e.endDate),
        bullets: Array.isArray(e.bullets) ? (e.bullets as string[]).map(String) : [],
      }),
    ),
  });
  set(c, "education", {
    kind: "entries",
    entries: (v1.education ?? []).map((e) =>
      makeEntry({
        title: str(e.degree),
        subtitle: str(e.school),
        meta: str(e.location),
        startDate: str(e.startDate),
        endDate: str(e.endDate),
        description: str(e.details),
        bullets: [],
      }),
    ),
  });
  set(c, "projects", {
    kind: "entries",
    entries: (v1.projects ?? []).map((e) =>
      makeEntry({
        title: str(e.name),
        description: str(e.description),
        link: str(e.link),
        bullets: Array.isArray(e.bullets) ? (e.bullets as string[]).map(String) : [],
      }),
    ),
  });
  set(c, "skills", {
    kind: "tags",
    tags: Array.isArray(v1.skills) ? v1.skills.map(String) : [],
  });
  return c;
}

const str = (v: unknown) => (typeof v === "string" ? v : "");
