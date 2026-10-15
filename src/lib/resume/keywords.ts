/**
 * Job-description keyword engine.
 *
 * Extracts what a posting actually screens for, weights it, and matches it
 * against the document — the same job an ATS does, run locally so you can
 * iterate for free instead of guessing.
 *
 * Matching is deliberately forgiving in the ways ATS systems are forgiving
 * (case, plurals, "-ing"/"-ed" endings, punctuation inside tokens like
 * "node.js" or "CI/CD") and strict in the ways they are strict (a keyword you
 * never wrote is a keyword you don't have).
 */

import { resumePlainText, type ResumeContent } from "./schema";

export type ScoredKeyword = {
  term: string;
  /** 1–10, driven by frequency, position in the posting, and dictionary boost. */
  weight: number;
  /** Where the term appeared in the résumé, if it did. */
  foundIn?: string;
};

export type KeywordMatch = {
  matched: ScoredKeyword[];
  missing: ScoredKeyword[];
  /** Weighted percentage of the posting's vocabulary covered. */
  coverage: number;
  /** Terms in the résumé that the posting never mentions (possible noise). */
  extra: string[];
};

// ── vocabulary ──────────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  "the","and","for","are","but","not","you","all","any","can","her","was","one","our","out","day","get","has",
  "him","his","how","its","new","now","old","see","two","way","who","boy","did","use","with","that","this",
  "have","from","they","will","been","were","said","each","she","which","their","time","would","there","what",
  "about","into","than","them","only","other","some","could","these","also","your","work","working","role",
  "team","teams","join","looking","ideal","candidate","candidates","strong","excellent","great","good","must",
  "should","able","ability","experience","experienced","years","year","plus","well","help","helping","across",
  "within","using","used","include","includes","including","etc","company","companies","business","opportunity",
  "position","job","apply","applicants","required","requirements","responsibilities","qualifications","preferred",
  "nice","bonus","desired","skills","skill","knowledge","understanding","familiarity","proficiency","proficient",
  "environment","fast","paced","paced","dynamic","passionate","motivated","self","driven","world","class","best",
  "here","when","where","while","more","most","very","such","like","make","made","take","need","needs","want",
  "day-to-day","end","ensure","ensuring","support","supporting","provide","providing","develop","developing",
  "build","building","drive","driving","own","ownership","partner","partnering","stakeholders","cross",
  "functional","functionally","collaborate","collaborating","communication","communicate","written","verbal",
  "please","offer","offers","benefits","salary","equal","opportunity","employer","diversity","inclusive",
]);

/**
 * Terms that are worth more than their frequency suggests — concrete, testable
 * capabilities rather than adjectives. Multi-word entries are matched as
 * phrases before single tokens are considered.
 */
const HIGH_SIGNAL = new Set([
  // languages / runtimes
  "python","javascript","typescript","java","kotlin","swift","go","golang","rust","ruby","php","scala","c++","c#",
  "sql","nosql","bash","r","matlab","solidity","elixir","haskell","perl","dart",
  // web / frameworks
  "react","angular","vue","svelte","next.js","nextjs","node.js","nodejs","express","django","flask","fastapi",
  "rails","spring","laravel","graphql","rest","grpc","tailwind","redux","remix","astro",
  // data / ml
  "pandas","numpy","spark","hadoop","airflow","dbt","snowflake","databricks","kafka","tableau","looker","power bi",
  "pytorch","tensorflow","scikit-learn","keras","llm","nlp","computer vision","machine learning","deep learning",
  "statistics","a/b testing","experimentation","etl","elt","data warehouse","data pipeline","feature engineering",
  // cloud / infra
  "aws","azure","gcp","kubernetes","docker","terraform","ansible","jenkins","ci/cd","github actions","serverless",
  "lambda","s3","ec2","microservices","observability","prometheus","grafana","datadog","linux","nginx","redis",
  "postgresql","postgres","mysql","mongodb","dynamodb","elasticsearch",
  // product / design / business
  "roadmap","product strategy","user research","usability","wireframes","prototyping","figma","sketch",
  "design system","accessibility","wcag","seo","sem","crm","salesforce","hubspot","marketo","google analytics",
  "okrs","kpis","p&l","forecasting","budgeting","gaap","ifrs","financial modeling","valuation","due diligence",
  "agile","scrum","kanban","jira","stakeholder management","go-to-market","lifecycle marketing","attribution",
  // ops / people
  "supply chain","logistics","procurement","six sigma","lean","iso","onboarding","recruiting","compensation",
  "performance management","hipaa","gdpr","soc 2","pci","risk management","compliance","audit",
]);

/** Multi-word phrases worth detecting before tokenisation splits them apart. */
const PHRASES = [
  ...([...HIGH_SIGNAL].filter((t) => t.includes(" ")) as string[]),
  "end to end","end-to-end","version control","unit testing","integration testing","test driven",
  "code review","technical debt","system design","distributed systems","high availability",
  "customer success","account management","cold outreach","lead generation","content strategy",
  "public speaking","project management","change management","vendor management","data analysis",
  "clinical trials","patient care","grant writing","peer review","literature review",
];

// ── extraction ──────────────────────────────────────────────────────────────

export function extractKeywords(jobDescription: string, limit = 34): ScoredKeyword[] {
  const raw = jobDescription.toLowerCase();
  const total = Math.max(raw.length, 1);
  const scores = new Map<string, number>();

  const bump = (term: string, amount: number) =>
    scores.set(term, (scores.get(term) ?? 0) + amount);

  // Phrases first — "machine learning" should never become "machine" + "learning".
  let remaining = raw;
  for (const phrase of PHRASES) {
    const re = new RegExp(escapeRe(phrase), "g");
    const hits = raw.match(re);
    if (!hits) continue;
    const at = raw.indexOf(phrase) / total;
    bump(phrase, hits.length * 2.2 + positionBoost(at) + 2);
    remaining = remaining.replace(re, " ");
  }

  // Then single tokens, keeping the punctuation that matters (node.js, ci/cd, c++).
  const tokens = remaining.match(/[a-z][a-z0-9+#./-]{1,}/g) ?? [];
  tokens.forEach((tokenRaw, i) => {
    const token = tokenRaw.replace(/[.,;:]+$/, "");
    if (token.length < 2 || STOPWORDS.has(token)) return;
    if (/^\d+$/.test(token)) return;
    const boost = HIGH_SIGNAL.has(token) ? 2.6 : 0;
    bump(token, 1 + boost + positionBoost(i / Math.max(tokens.length, 1)));
  });

  return [...scores.entries()]
    .filter(([term, s]) => s > 1.4 && term.length > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term, s]) => ({ term, weight: clamp(Math.round(s * 1.3), 1, 10) }));
}

/** Requirements near the top of a posting are the ones that get screened. */
const positionBoost = (fraction: number) => (fraction < 0.35 ? 0.8 : fraction < 0.7 ? 0.3 : 0);

// ── matching ────────────────────────────────────────────────────────────────

export function matchKeywords(jobDescription: string, content: ResumeContent): KeywordMatch {
  const keywords = extractKeywords(jobDescription);
  const haystack = normalize(resumePlainText(content));

  const matched: ScoredKeyword[] = [];
  const missing: ScoredKeyword[] = [];

  for (const kw of keywords) {
    const where = locate(kw.term, haystack, content);
    if (where) matched.push({ ...kw, foundIn: where });
    else missing.push(kw);
  }

  const totalWeight = keywords.reduce((a, k) => a + k.weight, 0) || 1;
  const matchedWeight = matched.reduce((a, k) => a + k.weight, 0);

  const postingTerms = new Set(keywords.map((k) => k.term));
  const extra = topResumeTerms(content)
    .filter((t) => !postingTerms.has(t))
    .slice(0, 12);

  return {
    matched: matched.sort((a, b) => b.weight - a.weight),
    missing: missing.sort((a, b) => b.weight - a.weight),
    coverage: Math.round((matchedWeight / totalWeight) * 100),
    extra,
  };
}

/** Returns the section label a term was found in, or null. */
function locate(term: string, haystack: string, content: ResumeContent): string | null {
  if (!containsTerm(haystack, term)) return null;
  for (const s of content.sections) {
    const text = normalize(sectionText(s));
    if (containsTerm(text, term)) return s.label;
  }
  return "Document";
}

function sectionText(s: ResumeContent["sections"][number]): string {
  if (s.kind === "text") return s.text;
  if (s.kind === "tags") return s.tags.join(" ");
  if (s.kind === "groups") return s.groups.map((g) => `${g.label} ${g.tags.join(" ")}`).join(" ");
  return s.entries
    .map((e) =>
      [e.title, e.subtitle, e.meta, e.description, ...e.bullets, ...(e.tags ?? [])].join(" "),
    )
    .join(" ");
}

/**
 * Matches the way a lenient parser does: whole-token, case-insensitive, and
 * tolerant of plural / gerund / past-tense endings on either side.
 */
function containsTerm(haystack: string, term: string): boolean {
  if (haystack.includes(` ${term} `)) return true;
  const stem = stemOf(term);
  if (stem.length < 4) return false;
  return new RegExp(`\\s${escapeRe(stem)}(s|es|ed|ing|er|ers)?\\s`).test(haystack);
}

function stemOf(term: string): string {
  return term.replace(/(ing|ed|es|s)$/, "");
}

function topResumeTerms(content: ResumeContent): string[] {
  const counts = new Map<string, number>();
  const tokens = normalize(resumePlainText(content)).match(/[a-z][a-z0-9+#./-]{2,}/g) ?? [];
  for (const t of tokens) {
    if (STOPWORDS.has(t)) continue;
    counts.set(t, (counts.get(t) ?? 0) + (HIGH_SIGNAL.has(t) ? 3 : 1));
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([t]) => t);
}

// ── utils ───────────────────────────────────────────────────────────────────

const normalize = (s: string) => ` ${s.toLowerCase().replace(/[^\w+#./-]+/g, " ").replace(/\s+/g, " ")} `;
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Best-effort role title guess from a posting — seeds the generate form. */
export function guessRoleFromJd(jd: string): string | null {
  const patterns = [
    /(?:hiring|seeking|looking for)\s+(?:an?\s+)?([A-Z][\w/&+-]*(?:\s+[A-Z][\w/&+-]*){0,3})/,
    /^\s*(?:job\s*title|role|position)\s*[:–-]\s*(.+)$/im,
    /^\s*([A-Z][\w/&+-]*(?:\s+[A-Z][\w/&+-]*){1,3})\s*$/m,
  ];
  for (const re of patterns) {
    const m = jd.match(re);
    if (m?.[1] && m[1].trim().length > 3 && m[1].trim().length < 60) return m[1].trim();
  }
  return null;
}
