/**
 * Design system for résumé / CV documents.
 *
 * A template is NOT a component — it is a `ResumeTheme` (tokens) plus a
 * `layout`. One HTML renderer and one PDF renderer consume these tokens, so
 * every style is guaranteed to look the same on screen and in the export, and
 * adding a new style is a config object rather than two new files.
 *
 * Users can also freely change any token on any template (accent, font,
 * density, page size, heading style…) — templates are just good starting
 * points, not cages.
 */

// ── Tokens ──────────────────────────────────────────────────────────────────

export type LayoutKind =
  /** Everything in one column. The ATS-safest shape. */
  | "single"
  /** Coloured/tinted rail on the left, main content right. */
  | "sidebar-left"
  /** Rail on the right — reads as "modern" without hurting scanning. */
  | "sidebar-right"
  /** Full-bleed header block, single column beneath. */
  | "banner"
  /** Header spans the page; body splits into two balanced columns. */
  | "two-col-body"
  /** Dated left rail with a connector line and dots. */
  | "timeline"
  /** Magazine feel: oversized display name, hairline rules, wide gutters. */
  | "editorial"
  /** Multi-page academic CV: section-heavy, numbered, repeating page header. */
  | "academic";

export type FontKey =
  | "sans"
  | "grotesk"
  | "humanist"
  | "condensed"
  | "serif"
  | "slab"
  | "didone"
  | "mono";

export type HeadingStyle =
  | "rule" // underlined with an accent rule
  | "plain" // just weight + tracking
  | "block" // filled accent chip
  | "bracket" // [ Section ]
  | "underline" // thin ink underline, full width
  | "dot" // leading accent dot
  | "numbered" // 01 / 02 / 03
  | "sideRule" // vertical bar on the left
  | "hash" // "# section" (mono/technical)
  | "smallcaps"; // letterspaced small caps, no rule

export type HeaderStyle =
  | "stack" // name, title, contact — left aligned
  | "centered" // classic centred block
  | "banner" // full-bleed colour block
  | "band" // colour band behind name only
  | "split" // name left, contact right
  | "monogram" // initials tile beside the name
  | "boxed" // outlined box around the whole header
  | "display"; // oversized editorial name

export type BulletStyle = "disc" | "dash" | "arrow" | "square" | "chevron" | "none";
export type Density = "compact" | "cozy" | "airy";
export type PageSize = "LETTER" | "A4";
export type MarginSize = "narrow" | "normal" | "wide";
export type SidebarStyle = "solid" | "tint" | "outline" | "plain";

export type ResumeTheme = {
  layout: LayoutKind;
  accent: string;
  /** Second stop for gradient headers. Falls back to `accent`. */
  accent2: string;
  ink: string;
  muted: string;
  /** Page background — usually white; a few styles use warm paper. */
  paper: string;
  font: FontKey;
  headingFont: FontKey;
  /** Multiplier on the base 10.5pt body size. */
  fontScale: number;
  lineHeight: number;
  density: Density;
  pageSize: PageSize;
  margin: MarginSize;
  headerStyle: HeaderStyle;
  headingStyle: HeadingStyle;
  bulletStyle: BulletStyle;
  uppercaseHeadings: boolean;
  /** Heading tracking, in em. */
  tracking: number;
  /** Display size of the name, relative to base. */
  nameScale: number;
  sidebarWidth: number; // 0.26 – 0.4
  sidebarStyle: SidebarStyle;
  showPhoto: boolean;
  /** Renders skills/tags as filled chips instead of a comma line. */
  chipSkills: boolean;
  /** Hairline between entries. */
  entryRule: boolean;
};

export const DEFAULT_THEME: ResumeTheme = {
  layout: "single",
  accent: "#1f2937",
  accent2: "#1f2937",
  ink: "#171717",
  muted: "#6b7280",
  paper: "#ffffff",
  font: "sans",
  headingFont: "sans",
  fontScale: 1,
  lineHeight: 1.45,
  density: "cozy",
  pageSize: "LETTER",
  margin: "normal",
  headerStyle: "stack",
  headingStyle: "rule",
  bulletStyle: "disc",
  uppercaseHeadings: true,
  tracking: 0.08,
  nameScale: 1,
  sidebarWidth: 0.32,
  sidebarStyle: "solid",
  showPhoto: false,
  chipSkills: false,
  entryRule: false,
};

// ── Token → CSS / PDF maps ──────────────────────────────────────────────────

export const FONT_STACKS: Record<FontKey, string> = {
  sans: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  grotesk: '"Helvetica Neue", Helvetica, "Arial Nova", Arial, ui-sans-serif, sans-serif',
  humanist: 'Optima, Candara, "Gill Sans", "Gill Sans MT", "Trebuchet MS", sans-serif',
  condensed:
    '"Avenir Next Condensed", "HelveticaNeue-CondensedBold", "Arial Narrow", "Roboto Condensed", sans-serif',
  serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
  slab: '"Roboto Slab", Rockwell, "Courier Bold", Georgia, serif',
  didone: '"Playfair Display", Didot, "Bodoni MT", "Times New Roman", Georgia, serif',
  mono: 'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, "Courier New", monospace',
};

export const FONT_LABELS: Record<FontKey, string> = {
  sans: "Sans — system",
  grotesk: "Grotesk — Helvetica",
  humanist: "Humanist — Optima",
  condensed: "Condensed",
  serif: "Serif — Georgia",
  slab: "Slab serif",
  didone: "Didone — display",
  mono: "Monospace",
};

/**
 * @react-pdf ships Helvetica / Times-Roman / Courier only. Mapping every key
 * onto those three keeps exports 100% offline and never falls back to tofu.
 */
export function pdfFontFamily(key: FontKey): { regular: string; bold: string; italic: string } {
  switch (key) {
    case "serif":
    case "slab":
    case "didone":
      return { regular: "Times-Roman", bold: "Times-Bold", italic: "Times-Italic" };
    case "mono":
      return { regular: "Courier", bold: "Courier-Bold", italic: "Courier-Oblique" };
    default:
      return { regular: "Helvetica", bold: "Helvetica-Bold", italic: "Helvetica-Oblique" };
  }
}

/** Page geometry in CSS inches / PDF points. */
export const PAGE_DIMENSIONS: Record<PageSize, { wIn: number; hIn: number }> = {
  LETTER: { wIn: 8.5, hIn: 11 },
  A4: { wIn: 8.27, hIn: 11.69 },
};

export const MARGIN_PT: Record<MarginSize, number> = {
  narrow: 28,
  normal: 40,
  wide: 56,
};

export const DENSITY_SCALE: Record<Density, number> = {
  compact: 0.78,
  cozy: 1,
  airy: 1.28,
};

export const BULLET_GLYPH: Record<BulletStyle, string> = {
  disc: "•",
  dash: "–",
  arrow: "→",
  square: "▪",
  chevron: "›",
  none: "",
};

/** Base body size in pt before `fontScale`. */
export const BASE_PT = 10;

// ── Curated accent palette ──────────────────────────────────────────────────

export const ACCENT_SWATCHES: { name: string; value: string }[] = [
  { name: "Graphite", value: "#1f2937" },
  { name: "Ink", value: "#0f172a" },
  { name: "Navy", value: "#1e3a8a" },
  { name: "Royal", value: "#4338ca" },
  { name: "Indigo", value: "#4f46e5" },
  { name: "Violet", value: "#7c3aed" },
  { name: "Sky", value: "#0284c7" },
  { name: "Teal", value: "#0d9488" },
  { name: "Emerald", value: "#047857" },
  { name: "Moss", value: "#4d7c0f" },
  { name: "Amber", value: "#b45309" },
  { name: "Rust", value: "#c2410c" },
  { name: "Crimson", value: "#be123c" },
  { name: "Maroon", value: "#881337" },
  { name: "Plum", value: "#86198f" },
  { name: "Slate", value: "#475569" },
];

// ── Template catalogue ──────────────────────────────────────────────────────

export type TemplateFamily = "resume" | "cv";

export type TemplateDef = {
  slug: string;
  name: string;
  family: TemplateFamily;
  /** One-line pitch shown in the gallery. */
  description: string;
  /** Short adjectives for filtering. */
  tags: string[];
  /** True when the layout is a single linear column with no colour blocks. */
  atsSafe: boolean;
  bestFor: string[];
  theme: ResumeTheme;
};

function t(overrides: Partial<ResumeTheme>): ResumeTheme {
  return { ...DEFAULT_THEME, ...overrides };
}

export const TEMPLATES: TemplateDef[] = [
  // ── Résumés ──────────────────────────────────────────────────────────────
  {
    slug: "classic",
    name: "Classic",
    family: "resume",
    description: "Timeless centred serif header with ruled sections. The safe default.",
    tags: ["Traditional", "ATS-safe", "Serif"],
    atsSafe: true,
    bestFor: ["Finance", "Law", "Consulting", "First job"],
    theme: t({
      layout: "single",
      headerStyle: "centered",
      headingStyle: "rule",
      font: "serif",
      headingFont: "serif",
      accent: "#1f2937",
      nameScale: 1.15,
    }),
  },
  {
    slug: "modern",
    name: "Modern",
    family: "resume",
    description: "Indigo sidebar for contact and skills beside a clean main column.",
    tags: ["Two-column", "Colour", "Popular"],
    atsSafe: false,
    bestFor: ["Tech", "Marketing", "Design-adjacent"],
    theme: t({
      layout: "sidebar-left",
      headerStyle: "stack",
      headingStyle: "plain",
      accent: "#4f46e5",
      accent2: "#6366f1",
      sidebarStyle: "solid",
      chipSkills: true,
    }),
  },
  {
    slug: "minimal",
    name: "Minimal",
    family: "resume",
    description: "Nothing but type and air. Understated, confident, hard to get wrong.",
    tags: ["Minimal", "ATS-safe", "Airy"],
    atsSafe: true,
    bestFor: ["Product", "Research", "Senior IC"],
    theme: t({
      layout: "single",
      headerStyle: "stack",
      headingStyle: "plain",
      accent: "#404040",
      muted: "#8a8a8a",
      density: "airy",
      tracking: 0.16,
      margin: "wide",
    }),
  },
  {
    slug: "creative",
    name: "Creative",
    family: "resume",
    description: "Full-bleed gradient banner with a warm rose accent. High energy.",
    tags: ["Bold", "Gradient", "Colour"],
    atsSafe: false,
    bestFor: ["Design", "Marketing", "Startups"],
    theme: t({
      layout: "banner",
      headerStyle: "banner",
      headingStyle: "rule",
      accent: "#e11d48",
      accent2: "#fb923c",
      nameScale: 1.35,
    }),
  },
  {
    slug: "technical",
    name: "Technical",
    family: "resume",
    description: "Monospaced, dense, hash-marked sections. Reads like a well-kept README.",
    tags: ["Monospace", "Dense", "Engineering"],
    atsSafe: true,
    bestFor: ["Backend", "Infra", "Open source"],
    theme: t({
      layout: "single",
      headerStyle: "stack",
      headingStyle: "hash",
      font: "mono",
      headingFont: "mono",
      accent: "#047857",
      density: "compact",
      fontScale: 0.94,
      bulletStyle: "dash",
    }),
  },
  {
    slug: "executive",
    name: "Executive",
    family: "resume",
    description: "Split header, heavy rule, navy authority. Built for leadership stories.",
    tags: ["Senior", "Serif", "Formal"],
    atsSafe: true,
    bestFor: ["Director+", "Operations", "Finance"],
    theme: t({
      layout: "single",
      headerStyle: "split",
      headingStyle: "underline",
      font: "serif",
      headingFont: "didone",
      accent: "#1e3a8a",
      nameScale: 1.25,
      tracking: 0.12,
    }),
  },
  {
    slug: "atlas",
    name: "Atlas",
    family: "resume",
    description: "Soft tinted rail instead of a colour block — structure without shouting.",
    tags: ["Two-column", "Subtle", "Tinted"],
    atsSafe: false,
    bestFor: ["Analytics", "Operations", "Generalists"],
    theme: t({
      layout: "sidebar-left",
      headerStyle: "stack",
      headingStyle: "sideRule",
      accent: "#475569",
      sidebarStyle: "tint",
      sidebarWidth: 0.3,
    }),
  },
  {
    slug: "meridian",
    name: "Meridian",
    family: "resume",
    description: "Right-hand teal rail keeps the reading order intact for scanners.",
    tags: ["Two-column", "Colour", "Teal"],
    atsSafe: false,
    bestFor: ["Product", "Data", "Consulting"],
    theme: t({
      layout: "sidebar-right",
      headerStyle: "stack",
      headingStyle: "plain",
      accent: "#0d9488",
      accent2: "#14b8a6",
      sidebarStyle: "solid",
      chipSkills: true,
    }),
  },
  {
    slug: "compact",
    name: "Compact",
    family: "resume",
    description: "Two body columns and tight leading — fits a long career on one page.",
    tags: ["Dense", "One-page", "Two-column"],
    atsSafe: false,
    bestFor: ["10+ years", "Career changers"],
    theme: t({
      layout: "two-col-body",
      headerStyle: "split",
      headingStyle: "block",
      accent: "#334155",
      density: "compact",
      fontScale: 0.92,
      margin: "narrow",
    }),
  },
  {
    slug: "timeline",
    name: "Timeline",
    family: "resume",
    description: "A dated rail with connector dots makes career progression obvious.",
    tags: ["Timeline", "Narrative", "Blue"],
    atsSafe: false,
    bestFor: ["Steady progression", "Long tenure"],
    theme: t({
      layout: "timeline",
      headerStyle: "stack",
      headingStyle: "dot",
      accent: "#2563eb",
      bulletStyle: "disc",
    }),
  },
  {
    slug: "onyx",
    name: "Onyx",
    family: "resume",
    description: "Black band, white type, surgical spacing. Quietly expensive.",
    tags: ["Monochrome", "Bold", "Band"],
    atsSafe: false,
    bestFor: ["Design", "Architecture", "Brand"],
    theme: t({
      layout: "banner",
      headerStyle: "band",
      headingStyle: "smallcaps",
      font: "grotesk",
      headingFont: "grotesk",
      accent: "#111827",
      accent2: "#111827",
      tracking: 0.2,
      nameScale: 1.3,
    }),
  },
  {
    slug: "aurora",
    name: "Aurora",
    family: "resume",
    description: "Violet-to-sky gradient header with chip skills. Modern SaaS energy.",
    tags: ["Gradient", "Colour", "Chips"],
    atsSafe: false,
    bestFor: ["Growth", "Product", "Startups"],
    theme: t({
      layout: "banner",
      headerStyle: "banner",
      headingStyle: "block",
      accent: "#7c3aed",
      accent2: "#38bdf8",
      chipSkills: true,
      nameScale: 1.3,
    }),
  },
  {
    slug: "nordic",
    name: "Nordic",
    family: "resume",
    description: "Humanist type, hairline rules, cool grey-blue. Calm and legible.",
    tags: ["Calm", "Humanist", "ATS-safe"],
    atsSafe: true,
    bestFor: ["UX", "Healthcare", "Education"],
    theme: t({
      layout: "single",
      headerStyle: "stack",
      headingStyle: "underline",
      font: "humanist",
      headingFont: "humanist",
      accent: "#3f6d8e",
      muted: "#7b8794",
      lineHeight: 1.55,
      entryRule: true,
    }),
  },
  {
    slug: "ledger",
    name: "Ledger",
    family: "resume",
    description: "Slab serif with boxed section chips and a warm amber accent.",
    tags: ["Slab", "Structured", "Amber"],
    atsSafe: true,
    bestFor: ["Finance", "Accounting", "Supply chain"],
    theme: t({
      layout: "single",
      headerStyle: "split",
      headingStyle: "block",
      font: "slab",
      headingFont: "slab",
      accent: "#b45309",
      bulletStyle: "square",
    }),
  },
  {
    slug: "cascade",
    name: "Cascade",
    family: "resume",
    description: "Full-width header over two balanced body columns. Great for skills-heavy CVs.",
    tags: ["Two-column", "Balanced", "Green"],
    atsSafe: false,
    bestFor: ["Full-stack", "Multi-disciplinary"],
    theme: t({
      layout: "two-col-body",
      headerStyle: "stack",
      headingStyle: "rule",
      accent: "#15803d",
      density: "compact",
    }),
  },
  {
    slug: "monogram",
    name: "Monogram",
    family: "resume",
    description: "Initials tile anchors the page. Personal without being loud.",
    tags: ["Personal", "Serif", "Maroon"],
    atsSafe: false,
    bestFor: ["Client-facing", "Sales", "Hospitality"],
    theme: t({
      layout: "single",
      headerStyle: "monogram",
      headingStyle: "smallcaps",
      font: "serif",
      headingFont: "serif",
      accent: "#881337",
      tracking: 0.18,
    }),
  },
  {
    slug: "helio",
    name: "Helio",
    family: "resume",
    description: "Condensed type and a sunset band. A lot of content, very little page.",
    tags: ["Condensed", "Band", "Warm"],
    atsSafe: false,
    bestFor: ["Media", "Events", "Retail leadership"],
    theme: t({
      layout: "banner",
      headerStyle: "band",
      headingStyle: "rule",
      font: "condensed",
      headingFont: "condensed",
      accent: "#c2410c",
      accent2: "#f59e0b",
      density: "compact",
    }),
  },
  {
    slug: "slate",
    name: "Slate",
    family: "resume",
    description: "Deep slate rail with monospaced headings — engineering, but polished.",
    tags: ["Two-column", "Mono headings", "Dark rail"],
    atsSafe: false,
    bestFor: ["DevOps", "Security", "Platform"],
    theme: t({
      layout: "sidebar-left",
      headerStyle: "stack",
      headingStyle: "hash",
      headingFont: "mono",
      accent: "#334155",
      accent2: "#475569",
      sidebarStyle: "solid",
      chipSkills: true,
    }),
  },
  {
    slug: "bold",
    name: "Bold",
    family: "resume",
    description: "Oversized name, filled section chips, zero hesitation.",
    tags: ["Bold", "Display", "High contrast"],
    atsSafe: true,
    bestFor: ["Sales", "Brand", "Leadership"],
    theme: t({
      layout: "single",
      headerStyle: "display",
      headingStyle: "block",
      font: "grotesk",
      headingFont: "grotesk",
      accent: "#111827",
      nameScale: 1.6,
      tracking: -0.01,
    }),
  },
  {
    slug: "editorial",
    name: "Editorial",
    family: "resume",
    description: "Magazine masthead, hairline rules, wide gutters. For people with taste.",
    tags: ["Display", "Didone", "Magazine"],
    atsSafe: false,
    bestFor: ["Design", "Editorial", "Creative direction"],
    theme: t({
      layout: "editorial",
      headerStyle: "display",
      headingStyle: "smallcaps",
      font: "serif",
      headingFont: "didone",
      accent: "#1c1917",
      nameScale: 1.75,
      margin: "wide",
      tracking: 0.24,
      lineHeight: 1.5,
    }),
  },
  {
    slug: "quartz",
    name: "Quartz",
    family: "resume",
    description: "Pale right rail with a rose accent. Soft, contemporary, readable.",
    tags: ["Two-column", "Soft", "Tinted"],
    atsSafe: false,
    bestFor: ["HR", "Communications", "Customer success"],
    theme: t({
      layout: "sidebar-right",
      headerStyle: "stack",
      headingStyle: "dot",
      accent: "#be123c",
      sidebarStyle: "tint",
      sidebarWidth: 0.29,
      lineHeight: 1.5,
    }),
  },
  {
    slug: "graphite",
    name: "Graphite",
    family: "resume",
    description: "Tight grotesk single column. Maximum signal per square inch.",
    tags: ["Dense", "ATS-safe", "Neutral"],
    atsSafe: true,
    bestFor: ["Engineering", "Data", "Any ATS gauntlet"],
    theme: t({
      layout: "single",
      headerStyle: "stack",
      headingStyle: "underline",
      font: "grotesk",
      headingFont: "grotesk",
      accent: "#374151",
      density: "compact",
      fontScale: 0.96,
      margin: "narrow",
      bulletStyle: "dash",
    }),
  },
  {
    slug: "horizon",
    name: "Horizon",
    family: "resume",
    description: "Photo-ready banner in sky blue — the standard outside the US.",
    tags: ["Photo", "Banner", "International"],
    atsSafe: false,
    bestFor: ["EU/LatAm/Asia applications"],
    theme: t({
      layout: "banner",
      headerStyle: "banner",
      headingStyle: "rule",
      accent: "#0284c7",
      accent2: "#0ea5e9",
      showPhoto: true,
      pageSize: "A4",
    }),
  },
  {
    slug: "verve",
    name: "Verve",
    family: "resume",
    description: "Purple timeline with dotted headings. Progression you can see at a glance.",
    tags: ["Timeline", "Colour", "Narrative"],
    atsSafe: false,
    bestFor: ["Career switchers", "Agencies"],
    theme: t({
      layout: "timeline",
      headerStyle: "band",
      headingStyle: "dot",
      accent: "#7e22ce",
      accent2: "#a855f7",
      bulletStyle: "chevron",
    }),
  },
  {
    slug: "paper",
    name: "Paper",
    family: "resume",
    description: "Zero colour, zero tricks — pure black on warm white. Parses perfectly.",
    tags: ["ATS-safe", "No colour", "Serif"],
    atsSafe: true,
    bestFor: ["Government", "Academia-adjacent", "Strict ATS"],
    theme: t({
      layout: "single",
      headerStyle: "centered",
      headingStyle: "underline",
      font: "serif",
      headingFont: "serif",
      accent: "#111111",
      paper: "#fffdf8",
      muted: "#555555",
      bulletStyle: "disc",
    }),
  },
  {
    slug: "terminal",
    name: "Terminal",
    family: "resume",
    description: "Bracketed sections, monospace everything. Unapologetically engineer.",
    tags: ["Monospace", "Playful", "Engineering"],
    atsSafe: true,
    bestFor: ["Open source", "Hacker roles", "Infra"],
    theme: t({
      layout: "single",
      headerStyle: "boxed",
      headingStyle: "bracket",
      font: "mono",
      headingFont: "mono",
      accent: "#15803d",
      fontScale: 0.93,
      density: "compact",
      bulletStyle: "arrow",
    }),
  },

  // ── Academic / long-form CVs ─────────────────────────────────────────────
  {
    slug: "academic",
    name: "Academic",
    family: "cv",
    description: "The standard multi-page academic CV: numbered sections, full publication lists.",
    tags: ["Multi-page", "Numbered", "Serif"],
    atsSafe: true,
    bestFor: ["PhD applications", "Postdoc", "Faculty"],
    theme: t({
      layout: "academic",
      headerStyle: "centered",
      headingStyle: "numbered",
      font: "serif",
      headingFont: "serif",
      accent: "#1f2937",
      lineHeight: 1.5,
      margin: "wide",
    }),
  },
  {
    slug: "scholar",
    name: "Scholar",
    family: "cv",
    description: "Restrained serif CV with wide margins and quiet section headings.",
    tags: ["Multi-page", "Minimal", "Serif"],
    atsSafe: true,
    bestFor: ["Humanities", "Grant applications"],
    theme: t({
      layout: "academic",
      headerStyle: "stack",
      headingStyle: "plain",
      font: "serif",
      headingFont: "serif",
      accent: "#292524",
      margin: "wide",
      density: "airy",
      tracking: 0.14,
    }),
  },
  {
    slug: "oxford",
    name: "Oxford",
    family: "cv",
    description: "Centred masthead in didone small caps. Formal, European, unmistakable.",
    tags: ["Formal", "Didone", "Centred"],
    atsSafe: true,
    bestFor: ["UK/EU academia", "Fellowships"],
    theme: t({
      layout: "academic",
      headerStyle: "centered",
      headingStyle: "smallcaps",
      font: "serif",
      headingFont: "didone",
      accent: "#1e293b",
      nameScale: 1.3,
      tracking: 0.26,
      pageSize: "A4",
    }),
  },
  {
    slug: "lab",
    name: "Lab",
    family: "cv",
    description: "Sans-serif research CV with teal side rules. Reads fast, prints clean.",
    tags: ["Research", "Sans", "Teal"],
    atsSafe: true,
    bestFor: ["STEM postdocs", "Industry research"],
    theme: t({
      layout: "academic",
      headerStyle: "split",
      headingStyle: "sideRule",
      accent: "#0f766e",
      lineHeight: 1.45,
    }),
  },
  {
    slug: "clinical",
    name: "Clinical",
    family: "cv",
    description: "Navy boxed headings and generous leading — built for long credential lists.",
    tags: ["Medical", "Structured", "Navy"],
    atsSafe: true,
    bestFor: ["Medicine", "Nursing", "Allied health"],
    theme: t({
      layout: "academic",
      headerStyle: "boxed",
      headingStyle: "block",
      font: "humanist",
      headingFont: "humanist",
      accent: "#1e3a8a",
      lineHeight: 1.55,
    }),
  },
  {
    slug: "fellow",
    name: "Fellow",
    family: "cv",
    description: "Split header with hairline rules between every entry. Immaculate structure.",
    tags: ["Structured", "Serif", "Rules"],
    atsSafe: true,
    bestFor: ["Fellowships", "Tenure packets"],
    theme: t({
      layout: "academic",
      headerStyle: "split",
      headingStyle: "underline",
      font: "serif",
      headingFont: "serif",
      accent: "#334155",
      entryRule: true,
    }),
  },
  {
    slug: "curator",
    name: "Curator",
    family: "cv",
    description: "Editorial CV for arts and culture — display name, warm ink, airy sections.",
    tags: ["Arts", "Display", "Warm"],
    atsSafe: false,
    bestFor: ["Curators", "Musicians", "Writers"],
    theme: t({
      layout: "editorial",
      headerStyle: "display",
      headingStyle: "smallcaps",
      font: "serif",
      headingFont: "didone",
      accent: "#7c2d12",
      paper: "#fffdf9",
      nameScale: 1.7,
      margin: "wide",
      tracking: 0.22,
    }),
  },
  {
    slug: "praxis",
    name: "Praxis",
    family: "cv",
    description: "Slab-serif CV with amber section chips. Applied research and practice.",
    tags: ["Slab", "Applied", "Amber"],
    atsSafe: true,
    bestFor: ["Policy", "Applied science", "Think tanks"],
    theme: t({
      layout: "academic",
      headerStyle: "stack",
      headingStyle: "block",
      font: "slab",
      headingFont: "slab",
      accent: "#a16207",
      bulletStyle: "square",
    }),
  },
  {
    slug: "archive",
    name: "Archive",
    family: "cv",
    description: "Monospaced metadata against serif body. Dense, catalogued, precise.",
    tags: ["Mono headings", "Dense", "Precise"],
    atsSafe: true,
    bestFor: ["Librarians", "Data curation", "Archives"],
    theme: t({
      layout: "academic",
      headerStyle: "stack",
      headingStyle: "hash",
      font: "serif",
      headingFont: "mono",
      accent: "#3f3f46",
      density: "compact",
      fontScale: 0.95,
    }),
  },
  {
    slug: "tenure",
    name: "Tenure",
    family: "cv",
    description: "Numbered sections and compact leading for CVs that run past ten pages.",
    tags: ["Multi-page", "Dense", "Numbered"],
    atsSafe: true,
    bestFor: ["Senior faculty", "Long publication lists"],
    theme: t({
      layout: "academic",
      headerStyle: "centered",
      headingStyle: "numbered",
      font: "serif",
      headingFont: "serif",
      accent: "#111827",
      density: "compact",
      fontScale: 0.95,
      margin: "normal",
    }),
  },
  {
    slug: "atrium",
    name: "Atrium",
    family: "cv",
    description: "Industry CV with a tinted rail for languages, tools and memberships.",
    tags: ["Two-column", "Industry", "Tinted"],
    atsSafe: false,
    bestFor: ["EU industry CVs", "Engineering leads"],
    theme: t({
      layout: "sidebar-left",
      headerStyle: "stack",
      headingStyle: "sideRule",
      accent: "#3730a3",
      sidebarStyle: "tint",
      pageSize: "A4",
      lineHeight: 1.5,
    }),
  },
  {
    slug: "europass",
    name: "Continental",
    family: "cv",
    description: "A4, structured, photo-ready — the shape European employers expect.",
    tags: ["A4", "Photo", "Structured"],
    atsSafe: true,
    bestFor: ["EU applications", "Public sector"],
    theme: t({
      layout: "single",
      headerStyle: "boxed",
      headingStyle: "block",
      accent: "#1d4ed8",
      pageSize: "A4",
      showPhoto: true,
      entryRule: true,
      lineHeight: 1.5,
    }),
  },
];

export const TEMPLATE_BY_SLUG: Record<string, TemplateDef> = Object.fromEntries(
  TEMPLATES.map((tpl) => [tpl.slug, tpl]),
);

export function getTemplateDef(slug: string | null | undefined): TemplateDef {
  return (slug && TEMPLATE_BY_SLUG[slug]) || TEMPLATE_BY_SLUG.classic;
}

export const TEMPLATE_SLUGS = TEMPLATES.map((tpl) => tpl.slug);
export type TemplateSlug = string;

/** All distinct tags, for gallery filter chips. */
export const TEMPLATE_TAGS = [...new Set(TEMPLATES.flatMap((tpl) => tpl.tags))].sort();

// ── Colour helpers (shared by HTML + PDF renderers) ─────────────────────────

/** #rrggbb → {r,g,b}. Tolerates 3-digit hex and bad input. */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
  const n = Number.parseInt(full.slice(0, 6) || "000000", 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Mixes a colour toward white — used for tinted rails and soft chips. */
export function tint(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

/** Mixes a colour toward black. */
export function shade(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const mix = (c: number) => Math.round(c * (1 - amount));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

export function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Picks black or white text for a background, by perceived luminance. */
export function readableOn(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const l = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return l > 0.6 ? "#111111" : "#ffffff";
}
