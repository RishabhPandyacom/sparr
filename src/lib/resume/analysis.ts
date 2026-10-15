/**
 * Résumé analyzer.
 *
 * A real rubric, not a vanity meter: every point is traceable to a specific
 * check, every failed check names the section it came from and what to do about
 * it. Runs synchronously on the client so the score updates as you type — no
 * API call, no waiting, no credits burned.
 *
 * The rubric is drawn from what actually happens to a résumé: an ATS parses it,
 * then a human skims it for ~7 seconds looking for evidence of impact.
 */

import {
  formatRange,
  visibleSections,
  type EntryItem,
  type ResumeContent,
  type Section,
} from "./schema";
import { matchKeywords, type KeywordMatch } from "./keywords";

export type Severity = "critical" | "warning" | "idea";

export type Finding = {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  /** Section this came from, so the UI can scroll to it. */
  sectionId?: string;
  entryId?: string;
  /** Points lost, for "fix this to gain N" messaging. */
  cost: number;
};

export type CategoryScore = {
  key: CategoryKey;
  label: string;
  score: number;
  max: number;
  summary: string;
};

export type CategoryKey = "contact" | "impact" | "content" | "keywords" | "format" | "language";

export type ResumeAnalysis = {
  score: number;
  grade: "Excellent" | "Strong" | "Getting there" | "Needs work";
  categories: CategoryScore[];
  findings: Finding[];
  stats: {
    words: number;
    bullets: number;
    quantifiedBullets: number;
    quantifiedPct: number;
    actionVerbPct: number;
    estimatedPages: number;
    sections: number;
    longestBullet: number;
    uniqueVerbs: number;
    repeatedVerbs: string[];
  };
  keywords: KeywordMatch | null;
};

// ── vocabulary ──────────────────────────────────────────────────────────────

/** Openers that signal ownership. Used to score bullet quality. */
const ACTION_VERBS = new Set([
  "accelerated","achieved","acquired","adapted","addressed","administered","advanced","advised","advocated",
  "analyzed","analysed","architected","assembled","assessed","audited","authored","automated","balanced",
  "benchmarked","boosted","broadened","budgeted","built","calculated","captured","centralized","chaired",
  "championed","clarified","coached","collaborated","compiled","completed","composed","conceived","condensed",
  "conducted","configured","consolidated","constructed","consulted","converted","coordinated","created",
  "cultivated","curated","cut","debugged","decreased","defined","delivered","demonstrated","deployed",
  "designed","developed","devised","diagnosed","directed","discovered","documented","doubled","drafted",
  "drove","earned","edited","eliminated","enabled","engineered","enhanced","enforced","established",
  "evaluated","examined","executed","expanded","expedited","facilitated","figured","forecasted","formalized",
  "formed","founded","generated","grew","guided","halved","handled","headed","hired","identified",
  "implemented","improved","increased","influenced","informed","initiated","innovated","inspected","installed",
  "instituted","instructed","integrated","introduced","invented","investigated","launched","led","leveraged",
  "maintained","managed","mapped","marketed","measured","mediated","mentored","migrated","minimized",
  "modeled","modernized","monitored","negotiated","operated","optimized","orchestrated","organized",
  "outperformed","overhauled","owned","partnered","performed","piloted","pioneered","planned","prepared",
  "presented","prioritized","processed","produced","programmed","promoted","proposed","prototyped","provided",
  "published","purchased","quantified","raised","ran","rebuilt","recommended","reconciled","recruited",
  "redesigned","reduced","refactored","refined","reorganized","repaired","replaced","reported","researched",
  "resolved","restored","restructured","revamped","reviewed","revised","saved","scaled","scheduled","secured",
  "selected","shaped","shipped","simplified","solved","sourced","spearheaded","standardized","steered",
  "streamlined","strengthened","structured","supervised","supported","surveyed","sustained","synthesized",
  "taught","tested","tracked","trained","transformed","translated","tripled","troubleshot","unified",
  "upgraded","validated","verified","won","wrote",
]);

/** Phrases that take up space without saying anything. */
const FILLER_PHRASES = [
  "responsible for","duties included","tasked with","worked on","helped with","assisted with",
  "in charge of","involved in","participated in","was part of","familiar with","exposure to",
  "hard worker","team player","go-getter","self-starter","detail-oriented","results-driven",
  "think outside the box","synergy","dynamic professional","proven track record","go above and beyond",
  "wear many hats","best of breed","value add","hit the ground running",
];

/** Pronouns and hedges that weaken a bullet. */
const WEAK_WORDS = ["i ", "my ", "me ", "we ", "our ", "various", "several", "many", "some", "stuff", "things", "etc"];

const PASSIVE_RE = /\b(was|were|been|being|is|are)\s+\w+(ed|en)\b/i;
const NUMBER_RE = /(\d[\d,.]*\s*(%|percent|k\b|m\b|bn?\b|x\b)|[$€£₹]\s?\d|\b\d[\d,.]*\b)/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /[\d][\d\s().+-]{6,}/;
const URL_RE = /([a-z0-9-]+\.)+[a-z]{2,}(\/\S*)?/i;

// ── main ────────────────────────────────────────────────────────────────────

export function analyzeResume(
  content: ResumeContent,
  jobDescription?: string,
): ResumeAnalysis {
  const findings: Finding[] = [];
  const sections = visibleSections(content);
  const entrySections = sections.filter((s): s is Extract<Section, { kind: "entries" }> => s.kind === "entries");
  const allEntries = entrySections.flatMap((s) => s.entries.map((e) => ({ section: s, entry: e })));
  const bullets = allEntries.flatMap(({ section, entry }) =>
    entry.bullets.filter((b) => b.trim()).map((text) => ({ text, section, entry })),
  );

  const stats = computeStats(content, bullets);

  const contact = scoreContact(content, findings);
  const impact = scoreImpact(bullets, stats, findings);
  const contentScore = scoreContent(content, sections, allEntries, findings);
  const language = scoreLanguage(bullets, findings);
  const format = scoreFormat(content, stats, findings);

  const keywords = jobDescription?.trim() ? matchKeywords(jobDescription, content) : null;
  const keywordCat = scoreKeywords(keywords, findings);

  const categories: CategoryScore[] = [contact, impact, contentScore, keywordCat, format, language];
  const earned = categories.reduce((a, c) => a + c.score, 0);
  const possible = categories.reduce((a, c) => a + c.max, 0);
  const score = Math.max(0, Math.min(100, Math.round((earned / possible) * 100)));

  findings.sort((a, b) => severityRank(a.severity) - severityRank(b.severity) || b.cost - a.cost);

  return {
    score,
    grade: score >= 88 ? "Excellent" : score >= 72 ? "Strong" : score >= 55 ? "Getting there" : "Needs work",
    categories,
    findings,
    stats,
    keywords,
  };
}

const severityRank = (s: Severity) => (s === "critical" ? 0 : s === "warning" ? 1 : 2);

// ── stats ───────────────────────────────────────────────────────────────────

type BulletRef = { text: string; section: Section; entry: EntryItem };

function computeStats(content: ResumeContent, bullets: BulletRef[]) {
  const words = countWords(content);
  const quantified = bullets.filter((b) => NUMBER_RE.test(b.text));
  const verbs = bullets.map((b) => firstWord(b.text)).filter(Boolean);
  const actionStarts = verbs.filter((v) => ACTION_VERBS.has(v));
  const counts = new Map<string, number>();
  verbs.forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1));
  const repeated = [...counts.entries()].filter(([, n]) => n >= 3).map(([v]) => v);

  return {
    words,
    bullets: bullets.length,
    quantifiedBullets: quantified.length,
    quantifiedPct: bullets.length ? Math.round((quantified.length / bullets.length) * 100) : 0,
    actionVerbPct: bullets.length ? Math.round((actionStarts.length / bullets.length) * 100) : 0,
    estimatedPages: estimatePages(content, words),
    sections: visibleSections(content).length,
    longestBullet: bullets.reduce((a, b) => Math.max(a, wordCount(b.text)), 0),
    uniqueVerbs: new Set(verbs).size,
    repeatedVerbs: repeated,
  };
}

function countWords(c: ResumeContent): number {
  let n = wordCount(`${c.basics.fullName} ${c.basics.title} ${c.basics.summary}`);
  for (const s of visibleSections(c)) {
    if (s.kind === "text") n += wordCount(s.text);
    if (s.kind === "tags") n += s.tags.length;
    if (s.kind === "groups") n += s.groups.reduce((a, g) => a + g.tags.length + wordCount(g.label), 0);
    if (s.kind === "entries") {
      for (const e of s.entries) {
        n += wordCount([e.title, e.subtitle, e.meta, e.description].filter(Boolean).join(" "));
        n += e.bullets.reduce((a, b) => a + wordCount(b), 0);
        n += e.tags?.length ?? 0;
      }
    }
  }
  return n;
}

/**
 * Words-per-page varies with type size and density, so the estimate is scaled
 * by the live theme rather than a fixed constant.
 */
function estimatePages(c: ResumeContent, words: number): number {
  const t = c.theme;
  const densityFactor = t.density === "compact" ? 1.18 : t.density === "airy" ? 0.82 : 1;
  const sizeFactor = 1 / (t.fontScale * t.lineHeight * 0.7);
  const perPage = 420 * densityFactor * sizeFactor;
  const sectionOverhead = visibleSections(c).length * 12;
  return Math.max(1, Math.round(((words + sectionOverhead) / perPage) * 10) / 10);
}

const wordCount = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);
const firstWord = (s: string) =>
  s.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "") ?? "";

// ── categories ──────────────────────────────────────────────────────────────

function scoreContact(c: ResumeContent, out: Finding[]): CategoryScore {
  const b = c.basics;
  let score = 0;
  const max = 12;

  if (b.fullName.trim()) score += 3;
  else out.push(f("no-name", "critical", "No name on the document", "The single most important field is blank.", 3));

  if (EMAIL_RE.test(b.email.trim())) score += 3;
  else
    out.push(
      f("bad-email", "critical", "Email is missing or malformed", "Recruiters copy this field straight into their ATS — it has to parse.", 3),
    );

  if (PHONE_RE.test(b.phone)) score += 2;
  else out.push(f("no-phone", "warning", "No phone number", "Most recruiters still call first. Add one with country code.", 2));

  if (b.location.trim()) score += 2;
  else out.push(f("no-location", "warning", "No location", "Location filters are the first cut in most ATS searches.", 2));

  const hasLink = URL_RE.test(b.website) || b.links.some((l) => URL_RE.test(l.url));
  if (hasLink) score += 2;
  else
    out.push(
      f("no-link", "idea", "No portfolio or LinkedIn link", "One link — GitHub, LinkedIn or a personal site — gives a reader somewhere to go next.", 2),
    );

  return {
    key: "contact",
    label: "Contact & header",
    score,
    max,
    summary: score === max ? "Everything a recruiter needs is here." : "Fill the gaps so you're reachable and filterable.",
  };
}

function scoreImpact(bullets: BulletRef[], stats: ResumeAnalysis["stats"], out: Finding[]): CategoryScore {
  const max = 26;
  if (!bullets.length) {
    out.push(
      f("no-bullets", "critical", "No accomplishment bullets anywhere", "Roles without bullets read as a job title list. Add 2–4 per recent role.", 26),
    );
    return { key: "impact", label: "Impact & evidence", score: 0, max, summary: "Nothing to evaluate yet." };
  }

  let score = 0;

  // Quantification — the highest-signal thing on any résumé.
  const q = stats.quantifiedPct;
  score += Math.round(Math.min(q, 60) / 60 * 14);
  if (q < 30) {
    const unquantified = bullets.filter((b) => !NUMBER_RE.test(b.text)).slice(0, 3);
    out.push(
      f(
        "low-quantification",
        q < 15 ? "critical" : "warning",
        `Only ${q}% of bullets contain a number`,
        `Aim for half. "${truncate(unquantified[0]?.text ?? "")}" would land harder with a scale, percentage, or dollar figure attached.`,
        14 - Math.round(Math.min(q, 60) / 60 * 14),
        unquantified[0]?.section.id,
        unquantified[0]?.entry.id,
      ),
    );
  }

  // Action-verb openers.
  const a = stats.actionVerbPct;
  score += Math.round(Math.min(a, 90) / 90 * 8);
  if (a < 70) {
    const weak = bullets.find((b) => !ACTION_VERBS.has(firstWord(b.text)));
    out.push(
      f(
        "weak-openers",
        a < 45 ? "warning" : "idea",
        `${100 - a}% of bullets don't start with an action verb`,
        `Lead with what you did. "${truncate(weak?.text ?? "")}" could open with Led, Built, Cut, Shipped…`,
        8 - Math.round(Math.min(a, 90) / 90 * 8),
        weak?.section.id,
        weak?.entry.id,
      ),
    );
  }

  // Density: enough bullets to be credible, not so many nobody reads them.
  if (bullets.length >= 6) score += 4;
  else
    out.push(
      f("thin-evidence", "warning", `Only ${bullets.length} bullets in the whole document`, "Six is the floor for a credible one-pager. Three to four per recent role.", 4),
    );

  // Verb variety.
  if (!stats.repeatedVerbs.length) score += 4;
  else
    out.push(
      f(
        "repeated-verbs",
        "idea",
        `"${stats.repeatedVerbs[0]}" opens ${stats.repeatedVerbs.length > 1 ? "several bullets" : "three or more bullets"}`,
        `Repetition flattens the read. Vary the openers: ${stats.repeatedVerbs.slice(0, 3).join(", ")}.`,
        4,
      ),
    );

  return {
    key: "impact",
    label: "Impact & evidence",
    score,
    max,
    summary:
      q >= 50 && a >= 70
        ? "Your bullets show ownership and outcomes."
        : "Bullets describe activity more than results.",
  };
}

function scoreContent(
  c: ResumeContent,
  sections: Section[],
  entries: { section: Section; entry: EntryItem }[],
  out: Finding[],
): CategoryScore {
  const max = 22;
  let score = 0;
  const keys = new Set(sections.map((s) => s.key));

  const summary = c.basics.summary.trim();
  const summaryWords = wordCount(summary);
  if (summaryWords >= 18 && summaryWords <= 70) score += 5;
  else if (summaryWords > 0) {
    score += 2;
    out.push(
      f(
        "summary-length",
        "idea",
        summaryWords < 18 ? "Summary is too short to say anything" : "Summary is too long to be read",
        "Two to three sentences: what you do, the strongest proof, and what you're aiming at next.",
        3,
      ),
    );
  } else {
    out.push(f("no-summary", "warning", "No summary", "It's the only place you get to frame the rest of the page.", 5));
  }

  if (c.docType === "cv") {
    if (keys.has("publications") || keys.has("research")) score += 5;
    else out.push(f("cv-no-research", "warning", "A CV without research or publications", "Add the sections that make it a CV rather than a long résumé.", 5));
  } else {
    if (keys.has("experience") && entries.some((e) => e.section.key === "experience")) score += 5;
    else out.push(f("no-experience", "critical", "No experience entries", "Internships, freelance, coursework projects — anything with a date and an outcome counts.", 5));
  }

  if (keys.has("education")) score += 3;
  else out.push(f("no-education", "warning", "No education section", "Even without a degree, list bootcamps, certifications or relevant coursework.", 3));

  const skillCount = sections
    .filter((s) => s.kind === "tags" && s.key === "skills")
    .reduce((a, s) => a + (s.kind === "tags" ? s.tags.length : 0), 0) +
    sections
      .filter((s) => s.kind === "groups")
      .reduce((a, s) => a + (s.kind === "groups" ? s.groups.reduce((x, g) => x + g.tags.length, 0) : 0), 0);
  if (skillCount >= 8) score += 4;
  else if (skillCount > 0) {
    score += 2;
    out.push(f("few-skills", "idea", `Only ${skillCount} skills listed`, "Eight to fifteen concrete, searchable skills is the sweet spot.", 2));
  } else {
    out.push(f("no-skills", "critical", "No skills section", "This is what keyword search runs against. It is not optional.", 4));
  }

  const missingDates = entries.filter(
    ({ section, entry }) =>
      (section.key === "experience" || section.key === "education") && !formatRange(entry) && entry.title.trim(),
  );
  if (!missingDates.length) score += 5;
  else
    out.push(
      f(
        "missing-dates",
        "warning",
        `${missingDates.length} ${missingDates.length === 1 ? "entry has" : "entries have"} no dates`,
        `Undated roles read as concealment. Add at least the years to "${missingDates[0].entry.title}".`,
        5,
        missingDates[0].section.id,
        missingDates[0].entry.id,
      ),
    );

  const empty = sections.filter(isEmptySection);
  if (empty.length) {
    out.push(
      f(
        "empty-sections",
        "warning",
        `${empty.length} empty ${empty.length === 1 ? "section" : "sections"}`,
        `"${empty[0].label}" has a heading but no content. Fill it or hide it.`,
        0,
        empty[0].id,
      ),
    );
  }

  return {
    key: "content",
    label: "Completeness",
    score,
    max,
    summary: score >= max - 4 ? "All the sections a reader expects are present." : "Some expected sections are thin or missing.",
  };
}

function isEmptySection(s: Section): boolean {
  if (s.kind === "text") return !s.text.trim();
  if (s.kind === "tags") return s.tags.length === 0;
  if (s.kind === "groups") return s.groups.every((g) => g.tags.length === 0);
  return s.entries.every((e) => !e.title.trim() && !e.bullets.some((b) => b.trim()));
}

function scoreLanguage(bullets: BulletRef[], out: Finding[]): CategoryScore {
  const max = 16;
  let score = max;

  const filler = bullets.filter((b) => FILLER_PHRASES.some((p) => b.text.toLowerCase().includes(p)));
  if (filler.length) {
    const hit = FILLER_PHRASES.find((p) => filler[0].text.toLowerCase().includes(p));
    score -= Math.min(6, filler.length * 2);
    out.push(
      f(
        "filler",
        "warning",
        `${filler.length} ${filler.length === 1 ? "bullet uses" : "bullets use"} filler language`,
        `"${hit}" describes the job, not your contribution. Replace it with the verb for what you actually did.`,
        Math.min(6, filler.length * 2),
        filler[0].section.id,
        filler[0].entry.id,
      ),
    );
  }

  const passive = bullets.filter((b) => PASSIVE_RE.test(b.text));
  if (passive.length > bullets.length * 0.25) {
    score -= 4;
    out.push(
      f(
        "passive-voice",
        "idea",
        `${passive.length} bullets are in the passive voice`,
        `"${truncate(passive[0].text)}" — say who did it: you.`,
        4,
        passive[0].section.id,
        passive[0].entry.id,
      ),
    );
  }

  const weak = bullets.filter((b) => WEAK_WORDS.some((w) => ` ${b.text.toLowerCase()} `.includes(` ${w.trim()} `)));
  if (weak.length) {
    score -= Math.min(3, weak.length);
    out.push(
      f(
        "weak-words",
        "idea",
        "First-person pronouns or vague quantifiers",
        `Résumé bullets drop "I" and "we", and swap "several" for the actual number.`,
        Math.min(3, weak.length),
        weak[0].section.id,
        weak[0].entry.id,
      ),
    );
  }

  const long = bullets.filter((b) => wordCount(b.text) > 32);
  if (long.length) {
    score -= Math.min(3, long.length);
    out.push(
      f(
        "long-bullets",
        "warning",
        `${long.length} ${long.length === 1 ? "bullet runs" : "bullets run"} past two lines`,
        `Cut to under 30 words. "${truncate(long[0].text)}" is doing the work of two bullets.`,
        Math.min(3, long.length),
        long[0].section.id,
        long[0].entry.id,
      ),
    );
  }

  const stubs = bullets.filter((b) => wordCount(b.text) < 5);
  if (stubs.length) {
    score -= 2;
    out.push(
      f("stub-bullets", "idea", `${stubs.length} very short ${stubs.length === 1 ? "bullet" : "bullets"}`, "A bullet under five words rarely carries evidence. Expand or merge it.", 2, stubs[0].section.id, stubs[0].entry.id),
    );
  }

  return {
    key: "language",
    label: "Language quality",
    score: Math.max(0, score),
    max,
    summary: score >= max - 2 ? "Tight, active, specific." : "Some bullets hedge or pad.",
  };
}

function scoreFormat(c: ResumeContent, stats: ResumeAnalysis["stats"], out: Finding[]): CategoryScore {
  const max = 12;
  let score = max;
  const t = c.theme;

  const target = c.docType === "cv" ? 12 : 2;
  if (c.docType === "resume") {
    if (stats.estimatedPages > 2.2) {
      score -= 4;
      out.push(
        f(
          "too-long",
          "warning",
          `Estimated ${stats.estimatedPages} pages`,
          "Two pages is the ceiling for a résumé. Cut the oldest roles to a single line, or switch to a compact density.",
          4,
        ),
      );
    } else if (stats.estimatedPages < 0.6) {
      score -= 3;
      out.push(f("too-short", "warning", "The page looks half empty", "Add depth to your recent roles, or a projects section.", 3));
    }
  } else if (stats.estimatedPages > target) {
    out.push(f("cv-long", "idea", `Estimated ${stats.estimatedPages} pages`, "Long is fine for a CV — just make sure the first page carries the headline facts.", 0));
  }

  if (t.fontScale < 0.9) {
    score -= 2;
    out.push(f("tiny-type", "warning", "Type is smaller than 9.5pt", "Under 9.5pt, print becomes hard to read and some parsers drop characters.", 2));
  }
  if (t.margin === "narrow" && t.density === "compact") {
    score -= 1;
    out.push(f("cramped", "idea", "Narrow margins plus compact density", "You've squeezed both axes. Loosen one so the page still breathes.", 1));
  }
  if (t.showPhoto && c.docType === "resume") {
    score -= 2;
    out.push(
      f(
        "photo-risk",
        "warning",
        "Photo enabled",
        "US, UK and Canadian employers routinely discard résumés with photos to avoid bias claims. Keep it only for EU/LatAm/Asia applications.",
        2,
      ),
    );
  }
  const twoCol = t.layout === "sidebar-left" || t.layout === "sidebar-right" || t.layout === "two-col-body";
  if (twoCol) {
    out.push(
      f(
        "two-column-parsing",
        "idea",
        "Two-column layout",
        "Older ATS parsers read columns in the wrong order. Export the plain-text version alongside it when a job board looks dated.",
        0,
      ),
    );
  }

  return {
    key: "format",
    label: "Format & length",
    score: Math.max(0, score),
    max,
    summary: `About ${stats.estimatedPages} ${stats.estimatedPages === 1 ? "page" : "pages"} at the current type size.`,
  };
}

function scoreKeywords(match: KeywordMatch | null, out: Finding[]): CategoryScore {
  const max = 12;
  if (!match) {
    return {
      key: "keywords",
      label: "Job match",
      score: max * 0.5,
      max,
      summary: "Paste a job description to score this against the actual posting.",
    };
  }
  const score = Math.round((match.coverage / 100) * max);
  if (match.missing.length) {
    const top = match.missing.slice(0, 4).map((k) => k.term);
    out.push(
      f(
        "missing-keywords",
        match.coverage < 45 ? "critical" : "warning",
        `${match.missing.length} keywords from the posting are missing`,
        `Highest-weighted gaps: ${top.join(", ")}. Only add the ones that are genuinely true of you.`,
        max - score,
      ),
    );
  }
  return {
    key: "keywords",
    label: "Job match",
    score,
    max,
    summary: `${match.coverage}% of the posting's key terms appear in your document.`,
  };
}

// ── helpers ─────────────────────────────────────────────────────────────────

function f(
  id: string,
  severity: Severity,
  title: string,
  detail: string,
  cost: number,
  sectionId?: string,
  entryId?: string,
): Finding {
  return { id, severity, title, detail, cost: Math.round(cost), sectionId, entryId };
}

function truncate(s: string, n = 58): string {
  const t = s.trim();
  return t.length > n ? `${t.slice(0, n)}…` : t;
}

export { ACTION_VERBS, FILLER_PHRASES, NUMBER_RE };
