/**
 * Bullet rewriting engine.
 *
 * Pure, deterministic, and offline. Every rewrite is a rule someone could
 * explain in an interview: strip the filler, lead with a verb, cut the hedging,
 * name the outcome. Where a fact is genuinely missing — a number, a scale — it
 * inserts a visible `[…]` prompt rather than inventing one, because a résumé
 * with a made-up statistic is worse than one without.
 *
 * The same `RewriteMode` values are used by the AI path, so the UI is identical
 * whether or not a model is configured.
 */

import { ACTION_VERBS, FILLER_PHRASES, NUMBER_RE } from "./analysis";

export type RewriteMode = "action" | "quantify" | "concise" | "impact" | "keywords";

export const REWRITE_MODES: {
  mode: RewriteMode;
  label: string;
  hint: string;
}[] = [
  { mode: "action", label: "Lead with a verb", hint: "Strip filler and open with what you did." },
  { mode: "quantify", label: "Add a number", hint: "Mark where a metric belongs." },
  { mode: "concise", label: "Tighten", hint: "Cut hedging and padding to one line." },
  { mode: "impact", label: "Show the outcome", hint: "Say what changed because of the work." },
  { mode: "keywords", label: "Match the job", hint: "Work in terms from the posting." },
];

export type RewriteResult = {
  text: string;
  /** What changed, so the user can accept it knowingly rather than blindly. */
  notes: string[];
  changed: boolean;
};

export function rewriteBullet(
  original: string,
  mode: RewriteMode,
  options: { keywords?: string[] } = {},
): RewriteResult {
  const notes: string[] = [];
  let text = original.trim();
  if (!text) return { text: original, notes: [], changed: false };

  // Every mode benefits from these, so they run first.
  text = stripFiller(text, notes);
  text = dropPronouns(text, notes);
  text = normalizeSpacing(text);

  switch (mode) {
    case "action":
      text = leadWithVerb(text, notes);
      break;
    case "quantify":
      text = leadWithVerb(text, notes);
      text = markMetric(text, notes);
      break;
    case "concise":
      text = tighten(text, notes);
      text = trimToWords(text, 26, notes);
      break;
    case "impact":
      text = leadWithVerb(text, notes);
      text = addOutcomeClause(text, notes);
      break;
    case "keywords":
      text = leadWithVerb(text, notes);
      text = weaveKeywords(text, options.keywords ?? [], notes);
      break;
  }

  text = sentenceCase(stripTrailingPeriodDupes(normalizeSpacing(text)));
  return { text, notes, changed: text !== original.trim() };
}

// ── rules ───────────────────────────────────────────────────────────────────

function stripFiller(text: string, notes: string[]): string {
  let out = text;
  for (const phrase of FILLER_PHRASES) {
    const re = new RegExp(`^\\s*${escapeRe(phrase)}\\s+(the\\s+|a\\s+|an\\s+)?`, "i");
    if (re.test(out)) {
      out = out.replace(re, "");
      notes.push(`Removed "${phrase}"`);
      break;
    }
  }
  // Mid-sentence padding.
  const padding: [RegExp, string, string][] = [
    [/\bin order to\b/gi, "to", '"in order to" → "to"'],
    [/\bwas responsible for\b/gi, "owned", '"was responsible for" → "owned"'],
    [/\butiliz(?:e|ed|ing)\b/gi, "used", '"utilize" → "use"'],
    [/\bleverag(?:e|ed|ing)\b/gi, "used", '"leverage" → "use"'],
    [/\ba variety of\b/gi, "several", "tightened wording"],
    [/\bdue to the fact that\b/gi, "because", '"due to the fact that" → "because"'],
    [/\bin the process of\b/gi, "", "removed padding"],
    [/\bsuccessfully\b/gi, "", 'dropped "successfully" (implied)'],
    [/\bvery\s+/gi, "", 'dropped "very"'],
    [/\bhelped to\b/gi, "", 'dropped "helped to"'],
  ];
  for (const [re, replacement, note] of padding) {
    if (re.test(out)) {
      out = out.replace(re, replacement);
      if (!notes.includes(note)) notes.push(note);
    }
  }
  return out;
}

function dropPronouns(text: string, notes: string[]): string {
  const re = /^(?:I|We|My team|Our team)\s+(?:was\s+|were\s+|have\s+|had\s+)?/i;
  if (re.test(text)) {
    notes.push("Dropped the first-person opener");
    return text.replace(re, "");
  }
  return text;
}

/** Past-tense forms for the openers people actually write. */
const VERB_FORMS: Record<string, string> = {
  build: "Built", building: "Built", builds: "Built",
  create: "Created", creating: "Created", creates: "Created",
  develop: "Developed", developing: "Developed", develops: "Developed",
  design: "Designed", designing: "Designed", designs: "Designed",
  manage: "Managed", managing: "Managed", manages: "Managed",
  lead: "Led", leading: "Led", leads: "Led",
  run: "Ran", running: "Ran", runs: "Ran",
  write: "Wrote", writing: "Wrote", writes: "Wrote",
  test: "Tested", testing: "Tested", tests: "Tested",
  fix: "Fixed", fixing: "Fixed", fixes: "Fixed",
  improve: "Improved", improving: "Improved", improves: "Improved",
  support: "Supported", supporting: "Supported", supports: "Supported",
  handle: "Handled", handling: "Handled", handles: "Handled",
  maintain: "Maintained", maintaining: "Maintained", maintains: "Maintained",
  coordinate: "Coordinated", coordinating: "Coordinated",
  analyze: "Analyzed", analyzing: "Analyzed", analyse: "Analysed",
  teach: "Taught", teaching: "Taught",
  train: "Trained", training: "Trained",
  present: "Presented", presenting: "Presented",
  research: "Researched", researching: "Researched",
  collaborate: "Partnered", collaborating: "Partnered",
  assist: "Supported", assisting: "Supported",
  work: "Delivered", working: "Delivered",
  use: "Applied", using: "Applied",
  deploy: "Deployed", deploying: "Deployed",
  launch: "Launched", launching: "Launched",
  ship: "Shipped", shipping: "Shipped",
  own: "Owned", owning: "Owned",
};

function leadWithVerb(text: string, notes: string[]): string {
  const words = text.split(/\s+/);
  if (!words.length) return text;
  const first = words[0].toLowerCase().replace(/[^a-z]/g, "");

  if (ACTION_VERBS.has(first)) return text;

  const mapped = VERB_FORMS[first];
  if (mapped) {
    notes.push(`Opened with "${mapped}"`);
    return [mapped, ...words.slice(1)].join(" ");
  }

  // A noun-phrase opener ("Weekly reporting for the exec team") gets a verb
  // prepended rather than mangled — the user can swap it for a better one.
  if (!/(ed|ing)$/.test(first) && words.length > 2) {
    notes.push('Prepended an action verb — swap "Delivered" for the precise one');
    return `Delivered ${lowerFirst(text)}`;
  }
  return text;
}

function markMetric(text: string, notes: string[]): string {
  if (NUMBER_RE.test(text)) return text;
  notes.push("Marked where a number belongs — replace the bracket with the real figure");
  const trimmed = text.replace(/[.\s]+$/, "");
  return `${trimmed}, [add the number: %, $, users, or time saved]`;
}

function tighten(text: string, notes: string[]): string {
  const before = text;
  const out = text
    .replace(/\bthat\s+(?=\w+ed\b)/gi, "")
    .replace(/\bwhich\s+(?:was|were)\s+/gi, "")
    .replace(/\bthere\s+(?:was|were)\s+/gi, "")
    .replace(/\bin\s+addition\b/gi, "and")
    .replace(/\bas\s+well\s+as\b/gi, "and")
    .replace(/\bon\s+a\s+(daily|weekly|monthly)\s+basis\b/gi, "$1")
    .replace(/\s*\(\s*\)\s*/g, " ");
  if (out !== before) notes.push("Removed connective padding");
  return out;
}

function trimToWords(text: string, max: number, notes: string[]): string {
  const words = text.split(/\s+/);
  if (words.length <= max) return text;
  notes.push(`Cut from ${words.length} to ${max} words — check nothing essential was lost`);
  return `${words.slice(0, max).join(" ").replace(/[,;:]$/, "")}…`;
}

function addOutcomeClause(text: string, notes: string[]): string {
  const hasOutcome =
    /\b(result(?:ing|ed)?|which\s+(?:cut|raised|reduced|increased)|so that|enabling|leading to|cutting|raising|reducing|increasing|saving|driving|lifting|improving)\b/i.test(
      text,
    );
  if (hasOutcome) return text;
  notes.push("Added an outcome clause — fill in what actually changed");
  return `${text.replace(/[.\s]+$/, "")}, [what changed as a result — faster, cheaper, safer, or bigger]`;
}

function weaveKeywords(text: string, keywords: string[], notes: string[]): string {
  const lower = text.toLowerCase();
  const missing = keywords
    .map((k) => k.trim())
    .filter((k) => k && !lower.includes(k.toLowerCase()))
    .slice(0, 3);
  if (!missing.length) return text;
  notes.push(`Suggested terms from the posting: ${missing.join(", ")} — only keep what's true`);
  return `${text.replace(/[.\s]+$/, "")} using ${missing.join(", ")}`;
}

// ── formatting ──────────────────────────────────────────────────────────────

const normalizeSpacing = (s: string) =>
  s.replace(/\s+/g, " ").replace(/\s+([,.;:])/g, "$1").trim();

const stripTrailingPeriodDupes = (s: string) => s.replace(/\.{2,}$/, ".");

function sentenceCase(s: string): string {
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1);
}

const lowerFirst = (s: string) => (s ? s[0].toLowerCase() + s.slice(1) : s);
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ── summary rewriting ───────────────────────────────────────────────────────

/**
 * Rebuilds a professional summary from the document's own evidence. Used by the
 * "rewrite my summary" action so it stays factual — it can only reference
 * things the résumé already claims.
 */
export function rewriteSummary(input: {
  role: string;
  years?: number;
  topSkills: string[];
  strongestBullet?: string;
  seniorityWord?: string;
}): string {
  const { role, years, topSkills, strongestBullet } = input;
  const opener = input.seniorityWord ? `${input.seniorityWord} ` : "";
  const experience = years ? ` with ${years}+ years` : "";
  const skills = topSkills.slice(0, 3).join(", ");

  const parts = [
    `${opener}${role}${experience} focused on ${skills || "shipping work that holds up"}.`,
  ];
  if (strongestBullet) {
    parts.push(`Most recently: ${lowerFirst(strongestBullet.replace(/[.\s]+$/, ""))}.`);
  }
  parts.push("Looking for work where the impact is measurable and the bar is high.");
  return normalizeSpacing(parts.join(" "));
}
