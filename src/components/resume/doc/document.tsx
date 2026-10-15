"use client";

import { useMemo } from "react";
import type { ResumeContent, Section } from "@/lib/resume/schema";
import { visibleSections } from "@/lib/resume/schema";
import { SectionBody, SectionHeading, type PartProps } from "./parts";
import { ContactRow, DocHeader, isBleedHeader } from "./header";
import { makeTokens, pt, sidebarBackground, sidebarText, type DocTokens } from "./tokens";

/**
 * THE renderer. Every one of the 38 styles — résumé and CV — is this component
 * plus a different `theme`. The same tree is used for the live editor, the
 * gallery thumbnails and the public share page; only `editable` changes.
 */

export type ResumeDocumentProps = {
  content: ResumeContent;
  editable?: boolean;
  onChange?: (c: ResumeContent) => void;
  onFocusSection?: (sectionId: string) => void;
  /** Draws faint page-break rules at multiples of the page height. */
  showPageGuides?: boolean;
  className?: string;
};

export function ResumeDocument({
  content,
  editable = false,
  onChange = () => {},
  onFocusSection,
  showPageGuides = false,
  className,
}: ResumeDocumentProps) {
  const k = useMemo(() => makeTokens(content.theme), [content.theme]);
  const parts: PartProps = { content, k, editable, onChange, onFocusSection };
  const layout = k.theme.layout;

  const pageStyle: React.CSSProperties = {
    width: `${k.pageWidthIn}in`,
    minHeight: `${k.pageHeightIn}in`,
    background: k.paper,
    color: k.ink,
    fontFamily: k.fontBody,
    fontSize: pt(k.body),
    lineHeight: k.lineHeight,
    position: "relative",
    overflow: "hidden",
  };

  let body: React.ReactNode;
  switch (layout) {
    case "sidebar-left":
      body = <SidebarLayout {...parts} side="left" />;
      break;
    case "sidebar-right":
      body = <SidebarLayout {...parts} side="right" />;
      break;
    case "two-col-body":
      body = <TwoColumnLayout {...parts} />;
      break;
    case "editorial":
      body = <EditorialLayout {...parts} />;
      break;
    case "timeline":
      body = <LinearLayout {...parts} timeline />;
      break;
    case "academic":
      body = <LinearLayout {...parts} academic />;
      break;
    case "banner":
    case "single":
    default:
      body = <LinearLayout {...parts} />;
  }

  return (
    <div className={className} style={pageStyle} data-resume-page>
      {body}
      {showPageGuides && <PageGuides k={k} />}
    </div>
  );
}

// ── layouts ─────────────────────────────────────────────────────────────────

function LinearLayout(
  props: PartProps & { timeline?: boolean; academic?: boolean },
) {
  const { k, content, timeline, academic } = props;
  const bleed = isBleedHeader(k);
  const sections = visibleSections(content);

  return (
    <div style={{ padding: bleed ? 0 : pt(k.pad) }}>
      <DocHeader {...props} />
      <div style={{ padding: bleed ? `0 ${pt(k.pad)} ${pt(k.pad)}` : 0 }}>
        {academic && content.basics.affiliation && (
          <div
            style={{
              fontSize: pt(k.small),
              color: k.muted,
              marginTop: pt(-4),
              marginBottom: pt(k.sectionGap * 0.6),
            }}
          >
            {content.basics.affiliation}
          </div>
        )}
        {sections.map((s, i) => (
          <SectionShell key={s.id} section={s} index={i} k={k}>
            <SectionBody {...props} section={s} timeline={timeline && s.kind === "entries"} />
          </SectionShell>
        ))}
      </div>
    </div>
  );
}

function SidebarLayout(props: PartProps & { side: "left" | "right" }) {
  const { k, content, side } = props;
  const sections = visibleSections(content);
  const rail = sections.filter((s) => (s.column ?? "main") === "side");
  const main = sections.filter((s) => (s.column ?? "main") !== "side");
  const solid = k.theme.sidebarStyle === "solid";

  const railNode = (
    <aside
      style={{
        width: `${k.sidebarPct}%`,
        flexShrink: 0,
        background: sidebarBackground(k),
        color: sidebarText(k),
        padding: `${pt(k.pad * 0.85)} ${pt(k.pad * 0.6)}`,
        borderRight:
          side === "left" && k.theme.sidebarStyle === "outline" ? `0.6pt solid ${k.hairline}` : undefined,
        borderLeft:
          side === "right" && k.theme.sidebarStyle === "outline" ? `0.6pt solid ${k.hairline}` : undefined,
      }}
    >
      <DocHeader {...props} variant="rail" />
      <div style={{ marginBottom: pt(k.sectionGap) }}>
        <SectionHeading label="Contact" index={0} k={k} onSide />
        <ContactRow
          content={content}
          k={k}
          editable={props.editable}
          onChange={props.onChange}
          color={solid ? "rgba(255,255,255,0.9)" : k.muted}
          stacked
        />
      </div>
      {rail.map((s, i) => (
        <SectionShell key={s.id} section={s} index={i} k={k} onSide>
          <SectionBody {...props} section={s} onSide />
        </SectionShell>
      ))}
    </aside>
  );

  const mainNode = (
    <main style={{ flex: 1, minWidth: 0, padding: `${pt(k.pad * 0.85)} ${pt(k.pad * 0.75)}` }}>
      {main.map((s, i) => (
        <SectionShell key={s.id} section={s} index={i} k={k}>
          <SectionBody {...props} section={s} />
        </SectionShell>
      ))}
    </main>
  );

  return (
    <div style={{ display: "flex", alignItems: "stretch", minHeight: `${k.pageHeightIn}in` }}>
      {side === "left" ? railNode : mainNode}
      {side === "left" ? mainNode : railNode}
    </div>
  );
}

function TwoColumnLayout(props: PartProps) {
  const { k, content } = props;
  const bleed = isBleedHeader(k);
  const sections = visibleSections(content);
  const right = sections.filter((s) => (s.column ?? "main") === "side");
  const left = sections.filter((s) => (s.column ?? "main") !== "side");

  return (
    <div style={{ padding: bleed ? 0 : pt(k.pad) }}>
      <DocHeader {...props} />
      <div
        style={{
          padding: bleed ? `0 ${pt(k.pad)} ${pt(k.pad)}` : 0,
          display: "flex",
          gap: pt(k.pad * 0.6),
          alignItems: "flex-start",
        }}
      >
        <div style={{ flex: "1 1 62%", minWidth: 0 }}>
          {left.map((s, i) => (
            <SectionShell key={s.id} section={s} index={i} k={k}>
              <SectionBody {...props} section={s} />
            </SectionShell>
          ))}
        </div>
        <div
          style={{
            flex: "1 1 38%",
            minWidth: 0,
            borderLeft: `0.5pt solid ${k.hairline}`,
            paddingLeft: pt(k.pad * 0.5),
          }}
        >
          {right.map((s, i) => (
            <SectionShell key={s.id} section={s} index={i} k={k}>
              <SectionBody {...props} section={s} />
            </SectionShell>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Magazine treatment: section labels live in a left gutter beside the body. */
function EditorialLayout(props: PartProps) {
  const { k, content } = props;
  const sections = visibleSections(content);
  return (
    <div style={{ padding: pt(k.pad) }}>
      <DocHeader {...props} />
      {sections.map((s, i) => (
        <section
          key={s.id}
          style={{
            display: "flex",
            gap: pt(k.pad * 0.5),
            marginBottom: pt(k.sectionGap * 1.15),
            paddingTop: pt(k.sectionGap * 0.5),
            borderTop: i === 0 ? undefined : `0.4pt solid ${k.hairline}`,
            breakInside: "avoid",
          }}
        >
          <div style={{ width: "22%", flexShrink: 0 }}>
            <SectionHeading label={s.label} index={i} k={k} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <SectionBody {...props} section={s} />
          </div>
        </section>
      ))}
    </div>
  );
}

// ── shell ───────────────────────────────────────────────────────────────────

function SectionShell({
  section,
  index,
  k,
  onSide = false,
  children,
}: {
  section: Section;
  index: number;
  k: DocTokens;
  onSide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{ marginBottom: pt(k.sectionGap) }}
      data-section-id={section.id}
      data-section-key={section.key}
    >
      <SectionHeading label={section.label} index={index} k={k} onSide={onSide} />
      {children}
    </section>
  );
}

/**
 * Faint rules where the printed page will break. Nothing else in the market
 * shows you this while you type — it's the difference between "looks fine" and
 * "fits on one page".
 */
function PageGuides({ k }: { k: DocTokens }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 print:hidden">
      {[1, 2, 3, 4, 5, 6, 7].map((n) => (
        <div
          key={n}
          style={{
            position: "absolute",
            top: `${k.pageHeightIn * n}in`,
            left: 0,
            right: 0,
            borderTop: "1px dashed rgba(15,23,42,0.22)",
          }}
        >
          <span
            style={{
              position: "absolute",
              right: 4,
              top: 2,
              fontSize: "7pt",
              color: "rgba(15,23,42,0.4)",
              fontFamily: "ui-sans-serif, system-ui, sans-serif",
              letterSpacing: "0.04em",
            }}
          >
            page {n + 1}
          </span>
        </div>
      ))}
    </div>
  );
}
