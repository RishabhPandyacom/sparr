"use client";

import { Plus, X, ChevronUp, ChevronDown, Copy } from "lucide-react";
import { EditableArea, EditableText } from "@/components/resume/editable";
import {
  SECTION_PRESETS,
  formatRange,
  type EntryItem,
  type ResumeContent,
  type Section,
} from "@/lib/resume/schema";
import { BULLET_GLYPH, rgba } from "@/lib/resume/design";
import * as m from "@/lib/resume/mutations";
import { pt, type DocTokens } from "./tokens";

/**
 * The render primitives every layout is assembled from. Each one is fully
 * theme-driven (no hard-coded colour or type) and doubles as its own editor —
 * the same markup renders the read-only share page and the live editor,
 * so what you edit is exactly what other people see.
 */

export type PartProps = {
  content: ResumeContent;
  k: DocTokens;
  editable: boolean;
  onChange: (c: ResumeContent) => void;
  /** Notifies the studio which section the caret is in (drives the AI panel). */
  onFocusSection?: (sectionId: string) => void;
};

// ── inline controls ─────────────────────────────────────────────────────────

const ctlBase =
  "inline-flex items-center justify-center rounded transition-opacity print:hidden";

export function GhostButton({
  onClick,
  label,
  children,
  className = "",
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`${ctlBase} size-[14px] shrink-0 text-neutral-400 opacity-0 hover:bg-neutral-200 hover:text-neutral-800 focus-visible:opacity-100 group-hover:opacity-100 ${className}`}
    >
      {children}
    </button>
  );
}

export function AddLine({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${ctlBase} mt-1 gap-1 px-1 py-0.5 text-[8pt] text-neutral-400 opacity-0 hover:bg-neutral-100 hover:text-neutral-700 focus-visible:opacity-100 group-hover:opacity-100`}
    >
      <Plus className="size-2.5" /> {label}
    </button>
  );
}

// ── section heading ─────────────────────────────────────────────────────────

export function SectionHeading({
  label,
  index,
  k,
  onSide = false,
}: {
  label: string;
  index: number;
  k: DocTokens;
  onSide?: boolean;
}) {
  const t = k.theme;
  const text = t.uppercaseHeadings ? label.toUpperCase() : label;
  const color = onSide && t.sidebarStyle === "solid" ? k.onAccent : k.accent;

  const base: React.CSSProperties = {
    fontFamily: k.fontHeading,
    fontSize: pt(k.heading),
    fontWeight: 700,
    letterSpacing: `${t.tracking}em`,
    color,
    marginBottom: pt(k.sectionGap * 0.35),
    lineHeight: 1.25,
  };

  switch (t.headingStyle) {
    case "block":
      return (
        <div
          style={{
            ...base,
            display: "inline-block",
            background: onSide && t.sidebarStyle === "solid" ? rgba("#ffffff", 0.2) : k.accent,
            color: onSide && t.sidebarStyle === "solid" ? k.onAccent : k.onAccent,
            padding: `${pt(1.5)} ${pt(5)}`,
            borderRadius: pt(2),
            fontSize: pt(k.heading * 0.92),
          }}
        >
          {text}
        </div>
      );
    case "rule":
      return (
        <div
          style={{
            ...base,
            borderBottom: `1.4pt solid ${color}`,
            paddingBottom: pt(1.5),
          }}
        >
          {text}
        </div>
      );
    case "underline":
      return (
        <div
          style={{
            ...base,
            borderBottom: `0.6pt solid ${onSide ? rgba("#ffffff", 0.35) : k.hairline}`,
            paddingBottom: pt(2),
          }}
        >
          {text}
        </div>
      );
    case "sideRule":
      return (
        <div
          style={{
            ...base,
            borderLeft: `2.5pt solid ${color}`,
            paddingLeft: pt(5),
          }}
        >
          {text}
        </div>
      );
    case "bracket":
      return <div style={base}>{`[ ${text} ]`}</div>;
    case "hash":
      return (
        <div style={base}>
          <span style={{ opacity: 0.55 }}># </span>
          {text}
        </div>
      );
    case "dot":
      return (
        <div style={{ ...base, display: "flex", alignItems: "center", gap: pt(4) }}>
          <span
            style={{
              width: pt(4),
              height: pt(4),
              borderRadius: "50%",
              background: color,
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          {text}
        </div>
      );
    case "numbered":
      return (
        <div style={{ ...base, display: "flex", alignItems: "baseline", gap: pt(5) }}>
          <span style={{ opacity: 0.45, fontVariantNumeric: "tabular-nums" }}>
            {String(index + 1).padStart(2, "0")}
          </span>
          <span style={{ flex: 1, borderBottom: `0.6pt solid ${k.hairline}`, paddingBottom: pt(2) }}>
            {text}
          </span>
        </div>
      );
    case "smallcaps":
      return (
        <div
          style={{
            ...base,
            fontSize: pt(k.heading * 0.88),
            letterSpacing: `${Math.max(t.tracking, 0.18)}em`,
            fontWeight: 600,
          }}
        >
          {text}
        </div>
      );
    case "plain":
    default:
      return <div style={base}>{text}</div>;
  }
}

// ── entries ─────────────────────────────────────────────────────────────────

export function EntryView({
  section,
  entry,
  k,
  editable,
  content,
  onChange,
  onFocusSection,
  timeline = false,
  last = false,
}: PartProps & {
  section: Section;
  entry: EntryItem;
  timeline?: boolean;
  last?: boolean;
}) {
  const preset = SECTION_PRESETS[section.key];
  const labels = preset.fields ?? { title: "Title", subtitle: "Subtitle", meta: "Detail" };
  const range = formatRange(entry);
  const focus = () => onFocusSection?.(section.id);

  const metaStyle: React.CSSProperties = {
    fontSize: pt(k.small),
    color: k.muted,
  };

  const body = (
    <div
      className="group"
      style={{
        marginBottom: pt(k.entryGap),
        paddingBottom: k.theme.entryRule && !last ? pt(k.entryGap * 0.8) : undefined,
        borderBottom: k.theme.entryRule && !last ? `0.5pt solid ${k.hairline}` : undefined,
        breakInside: "avoid",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: pt(6) }}>
        <EditableText
          editable={editable}
          value={entry.title}
          onFocus={focus}
          onChange={(v) => onChange(m.setEntry(content, section.id, entry.id, "title", v))}
          placeholder={labels.title}
          ariaLabel={labels.title}
          style={{
            fontWeight: 700,
            fontSize: pt(k.entryTitle),
            color: k.ink,
            flex: 1,
          }}
        />
        <div
          style={{ ...metaStyle, display: "flex", alignItems: "center", gap: pt(3), flexShrink: 0 }}
        >
          {editable ? (
            <>
              <EditableText
                editable
                inline
                value={entry.startDate ?? ""}
                onFocus={focus}
                onChange={(v) => onChange(m.setEntry(content, section.id, entry.id, "startDate", v))}
                placeholder="Start"
                ariaLabel="Start date"
                style={{ textAlign: "right" }}
              />
              <span style={{ opacity: 0.6 }}>–</span>
              <EditableText
                editable
                inline
                value={entry.current ? "Present" : (entry.endDate ?? "")}
                onFocus={focus}
                onChange={(v) =>
                  onChange(
                    m.replaceEntry(content, section.id, entry.id, {
                      endDate: v,
                      current: v.trim().toLowerCase() === "present",
                    }),
                  )
                }
                placeholder="End"
                ariaLabel="End date"
              />
            </>
          ) : (
            <span>{range}</span>
          )}
          {editable && (
            <span className="flex items-center gap-px">
              <GhostButton
                label="Move entry up"
                onClick={() => onChange(m.moveEntry(content, section.id, entry.id, -1))}
              >
                <ChevronUp className="size-3" />
              </GhostButton>
              <GhostButton
                label="Move entry down"
                onClick={() => onChange(m.moveEntry(content, section.id, entry.id, 1))}
              >
                <ChevronDown className="size-3" />
              </GhostButton>
              <GhostButton
                label="Duplicate entry"
                onClick={() => onChange(m.duplicateEntry(content, section.id, entry.id))}
              >
                <Copy className="size-2.5" />
              </GhostButton>
              <GhostButton
                label="Remove entry"
                onClick={() => onChange(m.removeEntry(content, section.id, entry.id))}
              >
                <X className="size-3" />
              </GhostButton>
            </span>
          )}
        </div>
      </div>

      {(editable || entry.subtitle || entry.meta || entry.link) && (
        <div style={{ display: "flex", alignItems: "baseline", gap: pt(6), ...metaStyle }}>
          <EditableText
            editable={editable}
            value={entry.subtitle ?? ""}
            onFocus={focus}
            onChange={(v) => onChange(m.setEntry(content, section.id, entry.id, "subtitle", v))}
            placeholder={labels.subtitle}
            ariaLabel={labels.subtitle}
            style={{ color: k.accent, fontWeight: 600, flex: 1 }}
          />
          <EditableText
            editable={editable}
            inline
            value={entry.meta || entry.link || ""}
            onFocus={focus}
            onChange={(v) =>
              onChange(
                m.setEntry(content, section.id, entry.id, entry.link && !entry.meta ? "link" : "meta", v),
              )
            }
            placeholder={labels.meta}
            ariaLabel={labels.meta}
            style={{ textAlign: "right" }}
          />
        </div>
      )}

      {(editable || entry.description) && (
        <EditableArea
          editable={editable}
          value={entry.description ?? ""}
          onFocus={focus}
          onChange={(v) => onChange(m.setEntry(content, section.id, entry.id, "description", v))}
          placeholder="Optional one-line description"
          ariaLabel="Description"
          style={{ fontSize: pt(k.small), color: k.ink, marginTop: pt(1) }}
        />
      )}

      {entry.bullets.length > 0 && (
        <ul style={{ marginTop: pt(k.bulletGap + 1), listStyle: "none" }}>
          {entry.bullets.map((b, i) => (
            <li
              key={i}
              className="group/b"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: pt(4),
                marginTop: pt(k.bulletGap),
              }}
            >
              {k.theme.bulletStyle !== "none" && (
                <span
                  aria-hidden
                  style={{
                    color: k.accent,
                    lineHeight: k.lineHeight,
                    fontSize: pt(k.body),
                    width: pt(k.body * 0.7),
                    flexShrink: 0,
                  }}
                >
                  {BULLET_GLYPH[k.theme.bulletStyle]}
                </span>
              )}
              <EditableArea
                editable={editable}
                value={b}
                onFocus={focus}
                onChange={(v) => onChange(m.setBullet(content, section.id, entry.id, i, v))}
                onEnter={() => onChange(m.addBullet(content, section.id, entry.id))}
                onEmptyBackspace={() =>
                  onChange(m.removeBullet(content, section.id, entry.id, i))
                }
                placeholder="Accomplishment with a number in it"
                ariaLabel="Bullet"
                style={{ flex: 1 }}
              />
              {editable && (
                <GhostButton
                  label="Remove bullet"
                  className="opacity-0 group-hover/b:opacity-100"
                  onClick={() => onChange(m.removeBullet(content, section.id, entry.id, i))}
                >
                  <X className="size-3" />
                </GhostButton>
              )}
            </li>
          ))}
        </ul>
      )}

      {!!entry.tags?.length && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: pt(3), marginTop: pt(2.5) }}>
          {entry.tags.map((tag, i) => (
            <span
              key={i}
              style={{
                fontSize: pt(k.tiny),
                color: k.accent,
                background: k.accentSoft,
                padding: `${pt(1)} ${pt(4)}`,
                borderRadius: pt(6),
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {editable && (
        <AddLine
          label="Add bullet"
          onClick={() => onChange(m.addBullet(content, section.id, entry.id))}
        />
      )}
    </div>
  );

  if (!timeline) return body;

  return (
    <div style={{ display: "flex", gap: pt(8) }}>
      <div
        style={{
          width: pt(7),
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: pt(3),
        }}
        aria-hidden
      >
        <span
          style={{
            width: pt(5),
            height: pt(5),
            borderRadius: "50%",
            background: k.accent,
            flexShrink: 0,
          }}
        />
        {!last && <span style={{ flex: 1, width: "1pt", background: k.hairline, marginTop: pt(2) }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>{body}</div>
    </div>
  );
}

// ── tags / groups / text ────────────────────────────────────────────────────

export function TagsView({
  section,
  k,
  editable,
  content,
  onChange,
  onFocusSection,
  onSide = false,
}: PartProps & { section: Section; onSide?: boolean }) {
  if (section.kind !== "tags") return null;
  const chip = k.theme.chipSkills || onSide;
  const color = onSide && k.theme.sidebarStyle === "solid" ? k.onAccent : k.ink;

  if (!chip) {
    // Comma line — the most ATS-legible way to present keywords.
    return (
      <EditableArea
        editable={editable}
        value={section.tags.join(", ")}
        onFocus={() => onFocusSection?.(section.id)}
        onChange={(v) =>
          onChange(
            m.setTags(
              content,
              section.id,
              v.split(",").map((s) => s.trim()).filter(Boolean),
            ),
          )
        }
        placeholder="Comma-separated list"
        ariaLabel={section.label}
        style={{ fontSize: pt(k.body), color }}
      />
    );
  }

  return (
    <div className="group" style={{ display: "flex", flexWrap: "wrap", gap: pt(3) }}>
      {section.tags.map((tag, i) => (
        <span
          key={i}
          className="group/t"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: pt(2),
            fontSize: pt(k.tiny),
            color: onSide && k.theme.sidebarStyle === "solid" ? k.onAccent : k.accent,
            background:
              onSide && k.theme.sidebarStyle === "solid" ? rgba("#ffffff", 0.18) : k.accentSoft,
            padding: `${pt(1.5)} ${pt(5)}`,
            borderRadius: pt(8),
          }}
        >
          <EditableText
            editable={editable}
            inline
            value={tag}
            onFocus={() => onFocusSection?.(section.id)}
            onChange={(v) => onChange(m.setTagAt(content, section.id, i, v))}
            onEmptyBackspace={() => onChange(m.removeTagAt(content, section.id, i))}
            ariaLabel="Tag"
          />
          {editable && (
            <GhostButton
              label="Remove"
              className="opacity-0 group-hover/t:opacity-100"
              onClick={() => onChange(m.removeTagAt(content, section.id, i))}
            >
              <X className="size-2.5" />
            </GhostButton>
          )}
        </span>
      ))}
      {editable && <AddLine label="Add" onClick={() => onChange(m.addTag(content, section.id))} />}
    </div>
  );
}

export function GroupsView({
  section,
  k,
  editable,
  content,
  onChange,
  onFocusSection,
}: PartProps & { section: Section }) {
  if (section.kind !== "groups") return null;
  return (
    <div className="group">
      {section.groups.map((g) => (
        <div
          key={g.id}
          className="group/g"
          style={{ display: "flex", gap: pt(6), marginBottom: pt(k.bulletGap + 1) }}
        >
          <EditableText
            editable={editable}
            value={g.label}
            onFocus={() => onFocusSection?.(section.id)}
            onChange={(v) => onChange(m.setGroup(content, section.id, g.id, { label: v }))}
            placeholder="Category"
            ariaLabel="Category"
            style={{
              width: "26%",
              flexShrink: 0,
              fontWeight: 700,
              fontSize: pt(k.small),
              color: k.accent,
            }}
          />
          <EditableArea
            editable={editable}
            value={g.tags.join(", ")}
            onFocus={() => onFocusSection?.(section.id)}
            onChange={(v) =>
              onChange(
                m.setGroup(content, section.id, g.id, {
                  tags: v.split(",").map((s) => s.trim()).filter(Boolean),
                }),
              )
            }
            placeholder="Comma-separated"
            ariaLabel="Group items"
            style={{ flex: 1, fontSize: pt(k.body) }}
          />
          {editable && (
            <GhostButton
              label="Remove category"
              className="opacity-0 group-hover/g:opacity-100"
              onClick={() => onChange(m.removeGroup(content, section.id, g.id))}
            >
              <X className="size-3" />
            </GhostButton>
          )}
        </div>
      ))}
      {editable && (
        <AddLine label="Add category" onClick={() => onChange(m.addGroup(content, section.id))} />
      )}
    </div>
  );
}

export function TextView({
  section,
  k,
  editable,
  content,
  onChange,
  onFocusSection,
  onSide = false,
}: PartProps & { section: Section; onSide?: boolean }) {
  if (section.kind !== "text") return null;
  const color = onSide && k.theme.sidebarStyle === "solid" ? k.onAccent : k.ink;
  return (
    <EditableArea
      editable={editable}
      value={section.text}
      onFocus={() => onFocusSection?.(section.id)}
      onChange={(v) =>
        onChange(
          section.key === "summary"
            ? m.setSummary(content, v)
            : m.setSectionText(content, section.id, v),
        )
      }
      placeholder="Two or three sentences on what you do and the evidence for it."
      ariaLabel={section.label}
      style={{ fontSize: pt(k.body), color }}
    />
  );
}

/** Renders whichever body a section needs, plus its "add" affordance. */
export function SectionBody(
  props: PartProps & { section: Section; onSide?: boolean; timeline?: boolean },
) {
  const { section, editable, content, onChange, onSide, timeline } = props;
  switch (section.kind) {
    case "text":
      return <TextView {...props} />;
    case "tags":
      return <TagsView {...props} onSide={onSide} />;
    case "groups":
      return <GroupsView {...props} />;
    case "entries":
      return (
        <div className="group">
          {section.entries.map((e, i) => (
            <EntryView
              {...props}
              key={e.id}
              entry={e}
              timeline={timeline}
              last={i === section.entries.length - 1}
            />
          ))}
          {editable && (
            <AddLine
              label={`Add ${section.label.toLowerCase().replace(/s$/, "")}`}
              onClick={() => onChange(m.addEntry(content, section.id))}
            />
          )}
        </div>
      );
    default:
      return null;
  }
}
