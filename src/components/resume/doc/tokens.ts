/**
 * Derives concrete, unit-bearing values from a `ResumeTheme`.
 *
 * Everything is expressed in **points**, the same unit @react-pdf uses. Because
 * the on-screen page is sized in inches (8.5in) and 1pt = 1/72in, a `10pt`
 * heading is physically identical on screen and in the exported PDF — that's
 * what makes the preview genuinely WYSIWYG rather than approximately so.
 */

import {
  BASE_PT,
  DENSITY_SCALE,
  FONT_STACKS,
  MARGIN_PT,
  PAGE_DIMENSIONS,
  rgba,
  readableOn,
  tint,
  type ResumeTheme,
} from "@/lib/resume/design";

export type DocTokens = {
  theme: ResumeTheme;
  /** Page box */
  pageWidthIn: number;
  pageHeightIn: number;
  pad: number;
  /** Type scale (pt) */
  body: number;
  small: number;
  tiny: number;
  name: number;
  jobTitle: number;
  heading: number;
  entryTitle: number;
  /** Rhythm (pt) */
  sectionGap: number;
  entryGap: number;
  bulletGap: number;
  lineHeight: number;
  /** Fonts */
  fontBody: string;
  fontHeading: string;
  /** Colour */
  accent: string;
  accent2: string;
  ink: string;
  muted: string;
  paper: string;
  /** Derived colour */
  accentSoft: string;
  accentFaint: string;
  hairline: string;
  onAccent: string;
  /** Layout */
  sidebarPct: number;
};

export function makeTokens(theme: ResumeTheme): DocTokens {
  const d = DENSITY_SCALE[theme.density];
  const body = BASE_PT * theme.fontScale;
  const dims = PAGE_DIMENSIONS[theme.pageSize] ?? PAGE_DIMENSIONS.LETTER;

  return {
    theme,
    pageWidthIn: dims.wIn,
    pageHeightIn: dims.hIn,
    pad: MARGIN_PT[theme.margin],
    body,
    small: body * 0.9,
    tiny: body * 0.8,
    name: body * 2.1 * theme.nameScale,
    jobTitle: body * 1.1,
    heading: body * 1.05,
    entryTitle: body * 1.02,
    sectionGap: 10 * d,
    entryGap: 6 * d,
    bulletGap: 1.5 * d,
    lineHeight: theme.lineHeight,
    fontBody: FONT_STACKS[theme.font],
    fontHeading: FONT_STACKS[theme.headingFont],
    accent: theme.accent,
    accent2: theme.accent2 || theme.accent,
    ink: theme.ink,
    muted: theme.muted,
    paper: theme.paper,
    accentSoft: tint(theme.accent, 0.86),
    accentFaint: tint(theme.accent, 0.94),
    hairline: rgba(theme.ink, 0.16),
    onAccent: readableOn(theme.accent),
    sidebarPct: Math.round(theme.sidebarWidth * 100),
  };
}

/** CSS background for banner/band headers — gradient when accent2 differs. */
export function headerBackground(k: DocTokens): string {
  return k.accent2 && k.accent2.toLowerCase() !== k.accent.toLowerCase()
    ? `linear-gradient(100deg, ${k.accent} 0%, ${k.accent2} 100%)`
    : k.accent;
}

/** Sidebar background per `sidebarStyle`. */
export function sidebarBackground(k: DocTokens): string {
  switch (k.theme.sidebarStyle) {
    case "solid":
      return headerBackground(k);
    case "tint":
      return k.accentFaint;
    case "outline":
    case "plain":
    default:
      return "transparent";
  }
}

export function sidebarText(k: DocTokens): string {
  return k.theme.sidebarStyle === "solid" ? k.onAccent : k.ink;
}

/** Initials for the monogram header, e.g. "Ada Byron Lovelace" → "AL". */
export function initialsOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const pt = (n: number) => `${round(n)}pt`;
const round = (n: number) => Math.round(n * 100) / 100;
