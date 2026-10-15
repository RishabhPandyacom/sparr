/**
 * Résumé text importer.
 *
 * Paste the text of an existing résumé (from a PDF, Word doc, or LinkedIn
 * export) and get back a structured document. Pure and offline — it works by
 * recognising the shapes résumés actually take: a contact block at the top,
 * ALL-CAPS or Title Case section headings, bulleted lines under dated entries.
 *
 * It is deliberately conservative. Anything it can't confidently classify is
 * kept as text in the nearest section rather than dropped, because losing a
 * line of someone's career history is far worse than misfiling one.
 */

import {
  emptyContent,
  makeEntry,
  makeSection,
  newId,
  type DocType,
  type EntriesSection,
  type EntryItem,
  type ResumeContent,
  type Section,
  type SectionKey,
  SECTION_KEYS,
} from "./schema";

// ── heading vocabulary ──────────────────────────────────────────────────────

const HEADING_ALIASES: [SectionKey, string[]][] = [
  ["summary", ["summary", "professional summary", "profile", "about", "objective", "career objective", "personal statement"]],
  ["experience", ["experience", "work experience", "professional experience", "employment", "employment history", "work history", "career history", "relevant experience"]],
  ["education", ["education", "academic background", "academic qualifications", "qualifications", "educational background"]],
  ["projects", ["projects", "personal projects", "side projects", "selected projects", "technical projects"]],
  ["skills", ["skills", "technical skills", "core competencies", "competencies", "key skills", "areas of expertise", "expertise", "tools"]],
  ["certifications", ["certifications", "certificates", "licenses", "licences", "credentials"]],
  ["awards", ["awards", "honors", "honours", "achievements", "awards and honors", "accomplishments"]],
  ["publications", ["publications", "papers", "selected publications", "peer-reviewed publications"]],
  ["research", ["research", "research experience", "research interests"]],
  ["teaching", ["teaching", "teaching experience"]],
  ["grants", ["grants", "funding", "grants and funding", "fellowships"]],
  ["conferences", ["conferences", "conference presentations", "presentations", "posters"]],
  ["talks", ["talks", "invited talks", "speaking", "workshops"]],
  ["memberships", ["memberships", "professional memberships", "affiliations", "societies"]],
  ["languages", ["languages", "language skills"]],
  ["volunteering", ["volunteering", "volunteer experience", "community involvement", "community service"]],
  ["leadership", ["leadership", "activities", "leadership and activities", "extracurricular", "societies and clubs"]],
  ["courses", ["coursework", "relevant coursework", "courses"]],
  ["interests", ["interests", "hobbies", "personal interests"]],
  ["references", ["references", "referees"]],
  ["patents", ["patents"]],
  ["portfolio", ["selected work", "portfolio", "case studies"]],
];

const HEADING_LOOKUP = new Map<string, SectionKey>();
for (const [key, aliases] of HEADING_ALIASES) {
  for (const alias of aliases) HEADING_LOOKUP.set(alias, key);
}

/** Sections whose content is a keyword list rather than dated entries. */
const TAG_SECTIONS = new Set<SectionKey>(["skills", "languages", "courses", "interests"]);

// ── patterns ────────────────────────────────────────────────────────────────

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]{2,}/;
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/;
const URL_RE = /((?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.[a-z]{2,}(?:\/[^\s,|]*)?)/i;
const BULLET_RE = /^\s*[-•·▪◦*‣–—]\s+/;

const MONTH = "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*";
const DATE_TOKEN = `(?:${MONTH}\\.?\\s*)?(?:19|20)\\d{2}|present|current|ongoing`;
const DATE_RANGE_RE = new RegExp(
  `((?:${DATE_TOKEN}))\\s*(?:[-–—]|to)\\s*((?:${DATE_TOKEN}))`,
  "i",
);
const SINGLE_DATE_RE = new RegExp(`\\b((?:${MONTH}\\.?\\s*)?(?:19|20)\\d{2})\\b`, "i");

// ── entry point ─────────────────────────────────────────────────────────────

export function parseResumeText(raw: string, docType: DocType = "resume"): ResumeContent {
  const lines = raw
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => l.replace(/\s+$/g, ""))
    .filter((l, i, arr) => !(l.trim() === "" && arr[i - 1]?.trim() === ""));

  const doc = emptyContent(docType);
  const { headerEnd } = readHeader(lines, doc);
  const blocks = splitIntoSections(lines.slice(headerEnd));

  const sections: Section[] = [];
  for (const block of blocks) {
    const section = buildSection(block.key, block.label, block.lines);
    if (section) sections.push(section);
  }

  // A résumé with no recognised headings still deserves to survive the import.
  if (!sections.length) {
    const fallback = makeSection("summary");
    sections.push({ ...fallback, kind: "text", text: lines.join("\n").trim() } as Section);
  }

  // Keep summary text mirrored onto basics so templates and the analyzer agree.
  const summary = sections.find((s) => s.key === "summary" && s.kind === "text");
  if (summary && summary.kind === "text") doc.basics.summary = summary.text;

  doc.sections = sections;
  return doc;
}

// ── header ──────────────────────────────────────────────────────────────────

function readHeader(lines: string[], doc: ResumeContent): { headerEnd: number } {
  // The contact block is whatever appears before the first real section
  // heading, capped at 12 lines so a heading-less résumé doesn't swallow itself.
  let limit = lines.length;
  for (let i = 0; i < Math.min(lines.length, 14); i++) {
    if (headingKeyFor(lines[i])) {
      limit = i;
      break;
    }
  }
  limit = Math.min(limit, 12);

  const header = lines.slice(0, limit);
  const consumed = new Set<number>();

  header.forEach((line, i) => {
    const email = line.match(EMAIL_RE);
    if (email && !doc.basics.email) {
      doc.basics.email = email[0];
      consumed.add(i);
    }
    const phone = line.match(PHONE_RE);
    if (phone && !doc.basics.phone && phone[0].replace(/\D/g, "").length >= 8) {
      doc.basics.phone = phone[0].trim();
      consumed.add(i);
    }
  });

  // Links: anything that looks like a URL, labelled by the domain.
  for (const line of header) {
    for (const piece of line.split(/[|·•,]/)) {
      const m = piece.match(URL_RE);
      if (!m) continue;
      const url = m[0].trim();
      if (url.includes("@")) continue;
      const label = labelForUrl(url);
      if (label === "Website") {
        if (!doc.basics.website) doc.basics.website = url;
      } else if (!doc.basics.links.some((l) => l.label === label)) {
        doc.basics.links.push({ id: newId("l"), label, url });
      }
    }
  }

  // Name: the first substantial line that isn't contact detail.
  const nameLine = header.find(
    (l, i) => !consumed.has(i) && l.trim().length > 2 && !EMAIL_RE.test(l) && !URL_RE.test(l),
  );
  if (nameLine) doc.basics.fullName = cleanName(nameLine);

  // Title: the next non-contact line after the name.
  const nameIndex = nameLine ? header.indexOf(nameLine) : -1;
  const titleLine = header
    .slice(nameIndex + 1)
    .find((l) => l.trim() && !EMAIL_RE.test(l) && !PHONE_RE.test(l) && !URL_RE.test(l));
  if (titleLine) doc.basics.title = titleLine.trim().replace(/^[-–—•|]\s*/, "");

  // Location: a "City, ST" / "City, Country" shape in the header.
  const locLine = header.find((l) => /^[A-Z][\w.'-]+(?:\s[\w.'-]+)*,\s*[A-Z]/.test(l.trim()));
  if (locLine && locLine !== nameLine) {
    const piece = locLine.split(/[|·•]/).find((p) => /,/.test(p));
    if (piece) doc.basics.location = piece.trim();
  }

  return { headerEnd: limit };
}

function labelForUrl(url: string): string {
  const u = url.toLowerCase();
  if (u.includes("linkedin")) return "LinkedIn";
  if (u.includes("github")) return "GitHub";
  if (u.includes("gitlab")) return "GitLab";
  if (u.includes("behance")) return "Behance";
  if (u.includes("dribbble")) return "Dribbble";
  if (u.includes("medium")) return "Medium";
  if (u.includes("scholar.google")) return "Scholar";
  if (u.includes("orcid")) return "ORCID";
  if (u.includes("twitter") || u.includes("x.com")) return "X";
  return "Website";
}

const cleanName = (line: string) =>
  line
    .replace(/[|·•].*$/, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 80);

// ── section splitting ───────────────────────────────────────────────────────

type Block = { key: SectionKey; label: string; lines: string[] };

function splitIntoSections(lines: string[]): Block[] {
  const blocks: Block[] = [];
  let current: Block | null = null;

  for (const line of lines) {
    const key = headingKeyFor(line);
    if (key) {
      if (current) blocks.push(current);
      current = { key, label: prettyHeading(line), lines: [] };
      continue;
    }
    if (current) current.lines.push(line);
    else if (line.trim()) {
      // Content before any heading — treat as the summary.
      current = { key: "summary", label: "Summary", lines: [line] };
    }
  }
  if (current) blocks.push(current);
  return blocks.filter((b) => b.lines.some((l) => l.trim()));
}

/** A heading is a short line that matches the vocabulary and carries no prose. */
function headingKeyFor(line: string): SectionKey | null {
  const t = line.trim().replace(/[:•|]+$/, "").trim();
  if (!t || t.length > 46) return null;
  if (BULLET_RE.test(line)) return null;
  if (/[.;]$/.test(t)) return null;

  const normalized = t.toLowerCase().replace(/[^a-z& ]/g, "").replace(/\s+/g, " ").trim();
  const direct = HEADING_LOOKUP.get(normalized);
  if (direct) return direct;

  // "WORK EXPERIENCE & INTERNSHIPS" style headings: match on the leading words.
  for (const [key, aliases] of HEADING_ALIASES) {
    if (aliases.some((a) => normalized.startsWith(`${a} `) || normalized.endsWith(` ${a}`))) {
      return key;
    }
  }

  // An ALL-CAPS short line is a heading even if we don't know the word.
  const isShoutedHeading =
    t === t.toUpperCase() && /[A-Z]/.test(t) && t.split(/\s+/).length <= 5 && t.length >= 3;
  return isShoutedHeading ? "custom" : null;
}

function prettyHeading(line: string): string {
  const t = line.trim().replace(/[:•|]+$/, "").trim();
  if (t !== t.toUpperCase()) return t;
  return t
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w.length > 2 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

// ── section bodies ──────────────────────────────────────────────────────────

function buildSection(key: SectionKey, label: string, lines: string[]): Section | null {
  const base = makeSection(key);
  const withLabel = { ...base, label } as Section;
  const body = lines.filter((l) => l.trim().length > 0);
  if (!body.length) return null;

  if (key === "summary") {
    return { ...withLabel, kind: "text", text: body.join(" ").replace(/\s+/g, " ").trim() } as Section;
  }

  if (TAG_SECTIONS.has(key)) {
    const tags = body
      .flatMap((l) => l.replace(BULLET_RE, "").split(/[,;|·•]/))
      .map((t) => t.replace(/^[-–—\s]+/, "").trim())
      .filter((t) => t.length > 1 && t.length < 42);
    // A "Languages: Python, Go" style line keeps its label as a group prefix.
    return { ...withLabel, kind: "tags", tags: dedupe(tags) } as Section;
  }

  const entries = parseEntries(body);
  if (!entries.length) {
    return { ...withLabel, kind: "text", text: body.join(" ").trim() } as Section;
  }
  return { ...withLabel, kind: "entries", entries } as EntriesSection;
}

/**
 * Groups lines into entries. A new entry starts at a non-bullet line; bullets
 * and continuation lines attach to whatever entry is open.
 */
function parseEntries(lines: string[]): EntryItem[] {
  const entries: EntryItem[] = [];
  let current: EntryItem | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (BULLET_RE.test(line)) {
      const text = trimmed.replace(BULLET_RE, "").trim();
      if (!current) current = makeEntry({ title: "" });
      current.bullets.push(text);
      continue;
    }

    // A non-bullet line either opens a new entry or fills in the open one.
    if (current && !current.subtitle && !current.bullets.length && looksLikeSubtitle(trimmed)) {
      const { text, range } = extractDates(trimmed);
      current.subtitle = text;
      if (range && !current.startDate) applyRange(current, range);
      continue;
    }

    if (current) entries.push(current);
    const { text, range } = extractDates(trimmed);
    current = makeEntry({ title: cleanTitle(text) });
    if (range) applyRange(current, range);
    const split = splitTitleSubtitle(current.title);
    if (split) {
      current.title = split.title;
      current.subtitle = split.subtitle;
    }
  }
  if (current) entries.push(current);

  return entries.filter((e) => e.title.trim() || e.bullets.length);
}

function looksLikeSubtitle(line: string): boolean {
  // Short, no sentence punctuation — typically "Company — City" or a date line.
  return line.length <= 70 && !/[.!?]$/.test(line);
}

function extractDates(line: string): { text: string; range?: { start: string; end: string } } {
  const range = line.match(DATE_RANGE_RE);
  if (range) {
    return {
      text: line.replace(range[0], "").replace(/[|·•,\s]+$/, "").replace(/^[|·•,\s]+/, "").trim(),
      range: { start: titleCaseDate(range[1]), end: titleCaseDate(range[2]) },
    };
  }
  const single = line.match(SINGLE_DATE_RE);
  if (single && line.length - single[0].length > 4) {
    return {
      text: line.replace(single[0], "").replace(/[|·•,\s]+$/, "").trim(),
      range: { start: "", end: titleCaseDate(single[1]) },
    };
  }
  return { text: line };
}

function applyRange(entry: EntryItem, range: { start: string; end: string }) {
  entry.startDate = range.start;
  const end = range.end;
  if (/^(present|current|ongoing)$/i.test(end)) {
    entry.endDate = "Present";
    entry.current = true;
  } else {
    entry.endDate = end;
  }
}

/** "Senior Engineer — Acme" / "Senior Engineer at Acme" → title + subtitle. */
function splitTitleSubtitle(title: string): { title: string; subtitle: string } | null {
  const m = title.match(/^(.{3,60}?)\s+(?:[-–—|,]|\bat\b)\s+(.{2,60})$/i);
  if (!m) return null;
  return { title: m[1].trim(), subtitle: m[2].trim() };
}

const cleanTitle = (s: string) => s.replace(/^[-–—•\s]+/, "").replace(/[|·•\s]+$/, "").trim();

function titleCaseDate(s: string): string {
  const t = s.trim();
  if (/^(present|current|ongoing)$/i.test(t)) return "Present";
  return t.replace(/\b[a-z]/g, (c) => c.toUpperCase()).replace(/\./g, "");
}

function dedupe(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    const k = item.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

/** Exposed for the import preview so the UI can explain what it recognised. */
export function summarizeImport(doc: ResumeContent): string[] {
  const notes: string[] = [];
  if (doc.basics.fullName) notes.push(`Name: ${doc.basics.fullName}`);
  if (doc.basics.email) notes.push(`Email: ${doc.basics.email}`);
  if (doc.basics.phone) notes.push(`Phone: ${doc.basics.phone}`);
  if (doc.basics.links.length) {
    notes.push(`Links: ${doc.basics.links.map((l) => l.label).join(", ")}`);
  }
  for (const s of doc.sections) {
    if (s.kind === "entries") notes.push(`${s.label}: ${s.entries.length} entries`);
    if (s.kind === "tags") notes.push(`${s.label}: ${s.tags.length} items`);
    if (s.kind === "text" && s.text) notes.push(`${s.label}: captured`);
  }
  return notes;
}

export { SECTION_KEYS };
