"use client";

import { X, Plus, ImagePlus } from "lucide-react";
import { EditableText } from "@/components/resume/editable";
import { rgba } from "@/lib/resume/design";
import * as m from "@/lib/resume/mutations";
import { GhostButton } from "./parts";
import { headerBackground, initialsOf, pt, type DocTokens } from "./tokens";
import type { ResumeContent } from "@/lib/resume/schema";

type HeaderProps = {
  content: ResumeContent;
  k: DocTokens;
  editable: boolean;
  onChange: (c: ResumeContent) => void;
  /** Sidebar headers stack vertically and inherit the rail's text colour. */
  variant?: "page" | "rail";
};

/** True when the header paints edge-to-edge and owns its own padding. */
export function isBleedHeader(k: DocTokens): boolean {
  return k.theme.headerStyle === "banner" || k.theme.headerStyle === "band";
}

export function DocHeader(props: HeaderProps) {
  const { k, variant = "page" } = props;
  if (variant === "rail") return <RailHeader {...props} />;

  switch (k.theme.headerStyle) {
    case "banner":
      return <BannerHeader {...props} />;
    case "band":
      return <BandHeader {...props} />;
    case "split":
      return <SplitHeader {...props} />;
    case "centered":
      return <StackHeader {...props} align="center" />;
    case "monogram":
      return <MonogramHeader {...props} />;
    case "boxed":
      return <BoxedHeader {...props} />;
    case "display":
      return <DisplayHeader {...props} />;
    case "stack":
    default:
      return <StackHeader {...props} align="left" />;
  }
}

// ── shared pieces ───────────────────────────────────────────────────────────

function Name({
  content,
  k,
  editable,
  onChange,
  color,
  align = "left",
  scale = 1,
}: HeaderProps & { color: string; align?: "left" | "center"; scale?: number }) {
  return (
    <EditableText
      editable={editable}
      value={content.basics.fullName}
      onChange={(v) => onChange(m.setBasics(content, "fullName", v))}
      placeholder="Your Name"
      ariaLabel="Full name"
      style={{
        fontFamily: k.fontHeading,
        fontSize: pt(k.name * scale),
        fontWeight: 700,
        lineHeight: 1.05,
        color,
        textAlign: align,
        letterSpacing: k.theme.headerStyle === "display" ? "-0.02em" : "-0.01em",
      }}
    />
  );
}

function JobTitle({
  content,
  k,
  editable,
  onChange,
  color,
  align = "left",
}: HeaderProps & { color: string; align?: "left" | "center" }) {
  return (
    <EditableText
      editable={editable}
      value={content.basics.title}
      onChange={(v) => onChange(m.setBasics(content, "title", v))}
      placeholder="Target role"
      ariaLabel="Professional title"
      style={{
        fontSize: pt(k.jobTitle),
        color,
        textAlign: align,
        marginTop: pt(1.5),
        letterSpacing: `${Math.min(k.theme.tracking, 0.1)}em`,
      }}
    />
  );
}

/** email · phone · location · website · custom links */
export function ContactRow({
  content,
  k,
  editable,
  onChange,
  color,
  align = "left",
  stacked = false,
}: HeaderProps & { color: string; align?: "left" | "center"; stacked?: boolean }) {
  const fields = ["email", "phone", "location", "website"] as const;
  const style: React.CSSProperties = { fontSize: pt(k.small), color };

  if (stacked) {
    return (
      <div style={{ ...style, display: "flex", flexDirection: "column", gap: pt(1.5) }}>
        {fields.map((f) => (
          <EditableText
            key={f}
            editable={editable}
            value={content.basics[f]}
            onChange={(v) => onChange(m.setBasics(content, f, v))}
            placeholder={f}
            ariaLabel={f}
          />
        ))}
        {content.basics.links.map((l) => (
          <span key={l.id} className="group flex items-center gap-1">
            <EditableText
              editable={editable}
              value={l.url}
              onChange={(v) => onChange(m.setLink(content, l.id, "url", v))}
              placeholder="link.com/you"
              ariaLabel={l.label}
            />
            {editable && (
              <GhostButton label="Remove link" onClick={() => onChange(m.removeLink(content, l.id))}>
                <X className="size-2.5" />
              </GhostButton>
            )}
          </span>
        ))}
        {editable && (
          <button
            type="button"
            onClick={() => onChange(m.addLink(content))}
            className="mt-0.5 inline-flex items-center gap-1 text-[7pt] opacity-0 transition-opacity hover:underline focus-visible:opacity-100 group-hover:opacity-100 print:hidden"
          >
            <Plus className="size-2.5" /> link
          </button>
        )}
      </div>
    );
  }

  const items: React.ReactNode[] = [];
  fields.forEach((f) => {
    items.push(
      <EditableText
        key={f}
        editable={editable}
        inline
        value={content.basics[f]}
        onChange={(v) => onChange(m.setBasics(content, f, v))}
        placeholder={f}
        ariaLabel={f}
      />,
    );
  });
  content.basics.links.forEach((l) => {
    items.push(
      <span key={l.id} className="group/l inline-flex items-center">
        <EditableText
          editable={editable}
          inline
          value={l.url}
          onChange={(v) => onChange(m.setLink(content, l.id, "url", v))}
          placeholder="link"
          ariaLabel={l.label}
        />
        {editable && (
          <GhostButton
            label="Remove link"
            className="opacity-0 group-hover/l:opacity-100"
            onClick={() => onChange(m.removeLink(content, l.id))}
          >
            <X className="size-2.5" />
          </GhostButton>
        )}
      </span>,
    );
  });

  return (
    <div
      className="group"
      style={{
        ...style,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "baseline",
        gap: `${pt(1)} ${pt(4)}`,
        justifyContent: align === "center" ? "center" : "flex-start",
        marginTop: pt(3),
      }}
    >
      {items.map((node, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "baseline", gap: pt(4) }}>
          {i > 0 && <span style={{ opacity: 0.45 }}>·</span>}
          {node}
        </span>
      ))}
      {editable && (
        <button
          type="button"
          onClick={() => onChange(m.addLink(content))}
          className="inline-flex items-center gap-0.5 text-[7pt] opacity-0 transition-opacity hover:underline focus-visible:opacity-100 group-hover:opacity-100 print:hidden"
        >
          <Plus className="size-2.5" /> link
        </button>
      )}
    </div>
  );
}

export function Photo({
  content,
  k,
  editable,
  onChange,
  size,
  round = true,
}: HeaderProps & { size: number; round?: boolean }) {
  const url = content.basics.photoUrl;
  const box: React.CSSProperties = {
    width: pt(size),
    height: pt(size),
    borderRadius: round ? "50%" : pt(4),
    objectFit: "cover",
    flexShrink: 0,
    background: rgba(k.ink, 0.08),
  };

  if (url) {
    return (
      <span className="group relative inline-block print:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" style={box} />
        {editable && (
          <button
            type="button"
            aria-label="Remove photo"
            onClick={() => onChange(m.setBasics(content, "photoUrl", ""))}
            className="absolute -right-1 -top-1 hidden size-4 items-center justify-center rounded-full bg-neutral-800 text-white group-hover:flex print:hidden"
          >
            <X className="size-2.5" />
          </button>
        )}
      </span>
    );
  }
  if (!editable) return null;

  return (
    <label
      style={{ ...box, display: "flex", alignItems: "center", justifyContent: "center" }}
      className="cursor-pointer text-neutral-400 hover:text-neutral-700 print:hidden"
      title="Add a photo"
    >
      <ImagePlus className="size-4" />
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const dataUrl = await downscaleImage(file, 320);
          onChange(m.setBasics(content, "photoUrl", dataUrl));
        }}
      />
    </label>
  );
}

/** Re-encodes an upload to a square-ish JPEG so the document JSON stays small. */
async function downscaleImage(file: File, max: number): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.82);
}

// ── header variants ─────────────────────────────────────────────────────────

function StackHeader(props: HeaderProps & { align: "left" | "center" }) {
  const { k, align } = props;
  const withPhoto = k.theme.showPhoto;
  return (
    <header
      style={{
        display: "flex",
        gap: pt(12),
        alignItems: "center",
        justifyContent: align === "center" ? "center" : "flex-start",
        marginBottom: pt(k.sectionGap),
        paddingBottom: pt(k.sectionGap * 0.5),
        borderBottom:
          k.theme.headingStyle === "rule" ? `1.4pt solid ${k.accent}` : `0.6pt solid ${k.hairline}`,
      }}
    >
      {withPhoto && <Photo {...props} size={k.name * 1.5} />}
      <div style={{ flex: 1, textAlign: align }}>
        <Name {...props} color={k.ink} align={align} />
        <JobTitle {...props} color={k.accent} align={align} />
        <ContactRow {...props} color={k.muted} align={align} />
      </div>
    </header>
  );
}

function SplitHeader(props: HeaderProps) {
  const { k } = props;
  return (
    <header
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: pt(16),
        marginBottom: pt(k.sectionGap),
        paddingBottom: pt(k.sectionGap * 0.6),
        borderBottom: `2pt solid ${k.accent}`,
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <Name {...props} color={k.ink} />
        <JobTitle {...props} color={k.accent} />
      </div>
      <div style={{ width: "40%", textAlign: "right" }}>
        <ContactRow {...props} color={k.muted} stacked />
      </div>
    </header>
  );
}

function BannerHeader(props: HeaderProps) {
  const { k } = props;
  return (
    <header
      style={{
        background: headerBackground(k),
        color: k.onAccent,
        padding: `${pt(k.pad * 0.7)} ${pt(k.pad)}`,
        display: "flex",
        alignItems: "center",
        gap: pt(14),
      }}
    >
      {k.theme.showPhoto && <Photo {...props} size={k.name * 1.7} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Name {...props} color={k.onAccent} />
        <JobTitle {...props} color={rgba("#ffffff", 0.85)} />
        <ContactRow {...props} color={rgba("#ffffff", 0.85)} />
      </div>
    </header>
  );
}

function BandHeader(props: HeaderProps) {
  const { k } = props;
  return (
    <header style={{ marginBottom: pt(k.sectionGap) }}>
      <div
        style={{
          background: headerBackground(k),
          color: k.onAccent,
          padding: `${pt(k.pad * 0.45)} ${pt(k.pad)}`,
        }}
      >
        <Name {...props} color={k.onAccent} />
        <JobTitle {...props} color={rgba("#ffffff", 0.85)} />
      </div>
      <div style={{ padding: `${pt(6)} ${pt(k.pad)} 0` }}>
        <ContactRow {...props} color={k.muted} />
      </div>
    </header>
  );
}

function MonogramHeader(props: HeaderProps) {
  const { k, content } = props;
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: pt(14),
        marginBottom: pt(k.sectionGap),
        paddingBottom: pt(k.sectionGap * 0.6),
        borderBottom: `0.6pt solid ${k.hairline}`,
      }}
    >
      <span
        aria-hidden
        style={{
          width: pt(k.name * 1.5),
          height: pt(k.name * 1.5),
          background: k.accent,
          color: k.onAccent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: k.fontHeading,
          fontSize: pt(k.name * 0.62),
          fontWeight: 700,
          letterSpacing: "0.02em",
          flexShrink: 0,
          borderRadius: pt(3),
        }}
      >
        {initialsOf(content.basics.fullName)}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Name {...props} color={k.ink} scale={0.85} />
        <JobTitle {...props} color={k.accent} />
        <ContactRow {...props} color={k.muted} />
      </div>
    </header>
  );
}

function BoxedHeader(props: HeaderProps) {
  const { k } = props;
  return (
    <header
      style={{
        border: `1pt solid ${k.accent}`,
        padding: pt(10),
        marginBottom: pt(k.sectionGap),
        display: "flex",
        gap: pt(12),
        alignItems: "center",
      }}
    >
      {k.theme.showPhoto && <Photo {...props} size={k.name * 1.4} round={false} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Name {...props} color={k.ink} scale={0.9} />
        <JobTitle {...props} color={k.accent} />
        <ContactRow {...props} color={k.muted} />
      </div>
    </header>
  );
}

function DisplayHeader(props: HeaderProps) {
  const { k } = props;
  return (
    <header style={{ marginBottom: pt(k.sectionGap * 1.2) }}>
      <Name {...props} color={k.ink} />
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: pt(14),
          marginTop: pt(4),
          paddingTop: pt(4),
          borderTop: `0.75pt solid ${k.ink}`,
        }}
      >
        <JobTitle {...props} color={k.accent} />
        <div style={{ textAlign: "right" }}>
          <ContactRow {...props} color={k.muted} align="left" />
        </div>
      </div>
    </header>
  );
}

/** Compact name block used at the top of a sidebar rail. */
function RailHeader(props: HeaderProps) {
  const { k } = props;
  const solid = k.theme.sidebarStyle === "solid";
  const fg = solid ? k.onAccent : k.ink;
  return (
    <header style={{ marginBottom: pt(k.sectionGap) }}>
      {k.theme.showPhoto && (
        <div style={{ marginBottom: pt(8) }}>
          <Photo {...props} size={k.name * 1.9} />
        </div>
      )}
      <Name {...props} color={fg} scale={0.62} />
      <JobTitle {...props} color={solid ? rgba("#ffffff", 0.82) : k.accent} />
    </header>
  );
}
