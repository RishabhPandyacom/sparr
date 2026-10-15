"use client";

import { useEffect, useMemo, useState } from "react";
import { ResumeDocument } from "./doc/document";
import { PAGE_DIMENSIONS, type TemplateDef } from "@/lib/resume/design";
import {
  emptyContent,
  makeEntry,
  makeSection,
  newId,
  type ResumeContent,
  type Section,
  type SectionKey,
} from "@/lib/resume/schema";

/**
 * A real, scaled render of the actual document engine — not a hand-drawn
 * silhouette. What you see in the gallery is precisely what you'll get, which
 * is the whole point of picking a template from a picture.
 *
 * Rendered client-side only. Previews build their document *during render*
 * (from a template fixture, the generator, or the importer), and section ids
 * come from `newId()`, which is random — so a server pass and the client pass
 * produce different `data-section-id` attributes and React reports a hydration
 * mismatch. Nothing here needs to exist in the server HTML: it is decorative,
 * behind auth, and `aria-hidden`. The placeholder holds the exact final box so
 * there is no layout shift when it appears.
 */
export function DocumentPreview({
  content,
  width,
  className,
  interactive = false,
}: {
  content: ResumeContent;
  /** Rendered width in px. The height follows the page aspect ratio. */
  width: number;
  className?: string;
  interactive?: boolean;
}) {
  const hydrated = useIsHydrated();

  const dims = PAGE_DIMENSIONS[content.theme.pageSize] ?? PAGE_DIMENSIONS.LETTER;
  const pageWidthPx = dims.wIn * 96;
  const scale = width / pageWidthPx;
  const height = width * (dims.hIn / dims.wIn);

  return (
    <div
      className={className}
      style={{
        width,
        height,
        overflow: "hidden",
        position: "relative",
        background: content.theme.paper,
      }}
      aria-hidden={!interactive}
    >
      {hydrated && (
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            width: pageWidthPx,
            pointerEvents: "none",
          }}
        >
          <ResumeDocument content={content} />
        </div>
      )}
    </div>
  );
}

/**
 * `false` during the server pass and the hydration pass, `true` after.
 *
 * `useSyncExternalStore(noopSubscribe, () => true, () => false)` is the usual
 * suggestion here and does NOT work: with a subscribe that never notifies,
 * React keeps the hydration snapshot and the preview stays blank forever.
 * Verified in the browser, not assumed.
 *
 * The lint rule below is a performance heuristic about cascading renders. One
 * extra render of an `aria-hidden` preview immediately after mount is precisely
 * the intent, so the exception is deliberate.
 */
function useIsHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

/** Preview fixture — short enough to render fast, real enough to judge. */
export function useTemplatePreviewContent(def: TemplateDef): ResumeContent {
  return useMemo(() => buildPreviewContent(def), [def]);
}

export function buildPreviewContent(def: TemplateDef): ResumeContent {
  const isCv = def.family === "cv";
  const c = emptyContent(def.family);
  c.theme = { ...def.theme };
  c.basics = {
    fullName: isCv ? "Dr. Amara Osei" : "Jordan Rivera",
    title: isCv ? "Postdoctoral Research Fellow" : "Senior Product Engineer",
    email: isCv ? "a.osei@university.edu" : "jordan@rivera.dev",
    phone: "(555) 018-4420",
    location: isCv ? "Cambridge, UK" : "Austin, TX",
    website: isCv ? "amaraosei.org" : "rivera.dev",
    summary: isCv
      ? "Computational biologist working on protein structure prediction, with a focus on methods that generalise beyond curated benchmarks."
      : "Product engineer who ships. I take fuzzy problems to production and measure whether they actually worked.",
    links: [
      { id: newId("l"), label: isCv ? "ORCID" : "LinkedIn", url: isCv ? "orcid.org/0000" : "in/jrivera" },
    ],
  };

  const sections: Section[] = [];
  const put = (key: SectionKey, patch: Partial<Section>) =>
    sections.push({ ...makeSection(key), ...patch } as Section);

  put("summary", { kind: "text", text: c.basics.summary });

  if (isCv) {
    put("education", {
      kind: "entries",
      entries: [
        makeEntry({
          title: "Ph.D. in Computational Biology",
          subtitle: "University of Cambridge",
          startDate: "2019",
          endDate: "2024",
          description: "Thesis: Generalisable representations for protein folding.",
        }),
        makeEntry({
          title: "M.Sc. in Bioinformatics",
          subtitle: "Imperial College London",
          startDate: "2018",
          endDate: "2019",
        }),
      ],
    });
    put("publications", {
      kind: "entries",
      entries: [
        makeEntry({
          title: "Structure priors improve low-homology folding accuracy",
          subtitle: "Nature Methods",
          meta: "Osei, A., Lindqvist, P.",
          endDate: "2025",
        }),
        makeEntry({
          title: "A benchmark for out-of-distribution protein tasks",
          subtitle: "NeurIPS",
          meta: "Osei, A., et al.",
          endDate: "2024",
        }),
      ],
    });
    put("grants", {
      kind: "entries",
      entries: [
        makeEntry({ title: "Wellcome Early Career Award", subtitle: "Wellcome Trust", meta: "£420,000", endDate: "2025" }),
      ],
    });
    put("skills", {
      kind: "tags",
      tags: ["Python", "PyTorch", "R", "Statistics", "LaTeX", "Grant writing"],
    });
  } else {
    put("experience", {
      kind: "entries",
      entries: [
        makeEntry({
          title: "Senior Product Engineer",
          subtitle: "Northwind",
          meta: "Austin, TX",
          startDate: "Mar 2022",
          endDate: "Present",
          current: true,
          bullets: [
            "Rebuilt onboarding around a single first action, lifting activation from 34% to 61%.",
            "Cut p95 checkout latency from 1.4s to 380ms by reshaping three N+1 queries.",
          ],
          tags: ["TypeScript", "React", "PostgreSQL"],
        }),
        makeEntry({
          title: "Product Engineer",
          subtitle: "Lumen Labs",
          meta: "Remote",
          startDate: "Jul 2019",
          endDate: "Feb 2022",
          bullets: ["Shipped the billing rewrite that unblocked $2.1M in annual contracts."],
        }),
      ],
    });
    put("projects", {
      kind: "entries",
      entries: [
        makeEntry({
          title: "Ledgerline",
          subtitle: "Open-source ledger",
          link: "github.com/jrivera/ledgerline",
          bullets: ["1.8k stars; used in production by four small finance teams."],
          tags: ["Go", "SQLite"],
        }),
      ],
    });
    put("education", {
      kind: "entries",
      entries: [
        makeEntry({
          title: "B.S. Computer Science",
          subtitle: "UT Austin",
          startDate: "2015",
          endDate: "2019",
        }),
      ],
    });
    put("skills", {
      kind: "tags",
      tags: ["TypeScript", "React", "Node.js", "PostgreSQL", "AWS", "Testing", "System design"],
    });
  }

  c.sections = sections;
  return c;
}
