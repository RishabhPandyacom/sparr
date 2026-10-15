/*
 * `Image` here is @react-pdf's PDF primitive, not an HTML <img> — it has no
 * `alt` prop and a PDF has no accessibility tree for one to land in.
 */
/* eslint-disable jsx-a11y/alt-text */
import { Document, Page, Text, View, Image } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import {
  BULLET_GLYPH,
  DENSITY_SCALE,
  MARGIN_PT,
  BASE_PT,
  pdfFontFamily,
  readableOn,
  rgba,
  tint,
  type ResumeTheme,
} from "@/lib/resume/design";
import {
  formatRange,
  visibleSections,
  type EntryItem,
  type ResumeContent,
  type Section,
} from "@/lib/resume/schema";

/**
 * PDF twin of `<ResumeDocument>`. It consumes the exact same theme tokens and
 * the same point-based type scale, so the export matches the editor preview
 * rather than approximating it.
 *
 * @react-pdf only bundles Helvetica / Times / Courier, so `pdfFontFamily` folds
 * the eight design fonts onto those three families. That keeps exports fully
 * offline and guarantees no missing-glyph boxes.
 */

type Tk = ReturnType<typeof pdfTokens>;

function pdfTokens(theme: ResumeTheme) {
  const d = DENSITY_SCALE[theme.density];
  const body = BASE_PT * theme.fontScale;
  const fonts = pdfFontFamily(theme.font);
  const headFonts = pdfFontFamily(theme.headingFont);
  return {
    theme,
    pad: MARGIN_PT[theme.margin],
    body,
    small: body * 0.9,
    tiny: body * 0.8,
    name: body * 2.1 * theme.nameScale,
    jobTitle: body * 1.1,
    heading: body * 1.05,
    sectionGap: 10 * d,
    entryGap: 6 * d,
    bulletGap: 1.5 * d,
    lineHeight: theme.lineHeight,
    font: fonts.regular,
    fontBold: fonts.bold,
    fontItalic: fonts.italic,
    headFont: headFonts.regular,
    headFontBold: headFonts.bold,
    accent: theme.accent,
    ink: theme.ink,
    muted: theme.muted,
    paper: theme.paper,
    accentSoft: tint(theme.accent, 0.86),
    hairline: rgba(theme.ink, 0.16),
    onAccent: readableOn(theme.accent),
  };
}

export function ResumePdfDocument({
  content,
  title,
}: {
  content: ResumeContent;
  title: string;
}) {
  const k = pdfTokens(content.theme);
  const layout = content.theme.layout;
  const size = content.theme.pageSize === "A4" ? "A4" : "LETTER";
  const sidebar = layout === "sidebar-left" || layout === "sidebar-right";
  const bleed = k.theme.headerStyle === "banner" || k.theme.headerStyle === "band";

  const pageStyle: Style = {
    backgroundColor: k.paper,
    color: k.ink,
    fontFamily: k.font,
    fontSize: k.body,
    lineHeight: k.lineHeight,
    flexDirection: sidebar ? "row" : "column",
    paddingTop: sidebar || bleed ? 0 : k.pad,
    paddingBottom: sidebar ? 0 : k.pad,
    paddingHorizontal: sidebar || bleed ? 0 : k.pad,
  };

  return (
    <Document title={title} author={content.basics.fullName || undefined}>
      <Page size={size} style={pageStyle} wrap>
        {sidebar ? (
          <SidebarBody content={content} k={k} side={layout === "sidebar-left" ? "left" : "right"} />
        ) : layout === "two-col-body" ? (
          <TwoColBody content={content} k={k} bleed={bleed} />
        ) : layout === "editorial" ? (
          <EditorialBody content={content} k={k} />
        ) : (
          <LinearBody content={content} k={k} bleed={bleed} timeline={layout === "timeline"} />
        )}
      </Page>
    </Document>
  );
}

// ── bodies ──────────────────────────────────────────────────────────────────

function LinearBody({
  content,
  k,
  bleed,
  timeline,
}: {
  content: ResumeContent;
  k: Tk;
  bleed: boolean;
  timeline?: boolean;
}) {
  const sections = visibleSections(content);
  return (
    <View>
      <PdfHeader content={content} k={k} />
      <View style={{ paddingHorizontal: bleed ? k.pad : 0, paddingBottom: bleed ? k.pad : 0 }}>
        {sections.map((s, i) => (
          <PdfSection key={s.id} section={s} index={i} k={k} timeline={timeline} />
        ))}
      </View>
    </View>
  );
}

function SidebarBody({
  content,
  k,
  side,
}: {
  content: ResumeContent;
  k: Tk;
  side: "left" | "right";
}) {
  const sections = visibleSections(content);
  const rail = sections.filter((s) => (s.column ?? "main") === "side");
  const main = sections.filter((s) => (s.column ?? "main") !== "side");
  const solid = k.theme.sidebarStyle === "solid";
  const railBg = solid ? k.accent : k.theme.sidebarStyle === "tint" ? tint(k.accent, 0.94) : undefined;
  const railFg = solid ? k.onAccent : k.ink;

  const railNode = (
    <View
      key="rail"
      style={{
        width: `${Math.round(k.theme.sidebarWidth * 100)}%`,
        backgroundColor: railBg,
        color: railFg,
        paddingVertical: k.pad * 0.85,
        paddingHorizontal: k.pad * 0.6,
      }}
    >
      <Text
        style={{
          fontFamily: k.headFontBold,
          fontSize: k.name * 0.62,
          color: railFg,
          marginBottom: 2,
        }}
      >
        {content.basics.fullName}
      </Text>
      <Text style={{ fontSize: k.jobTitle, color: solid ? rgba("#ffffff", 0.85) : k.accent }}>
        {content.basics.title}
      </Text>

      <PdfHeading label="Contact" index={0} k={k} onSide={solid} />
      {contactLines(content).map((line, i) => (
        <Text key={i} style={{ fontSize: k.small, color: solid ? rgba("#ffffff", 0.9) : k.muted, marginBottom: 1.5 }}>
          {line}
        </Text>
      ))}

      {rail.map((s, i) => (
        <PdfSection key={s.id} section={s} index={i} k={k} onSide={solid} />
      ))}
    </View>
  );

  const mainNode = (
    <View
      key="main"
      style={{ flexGrow: 1, flexBasis: 0, paddingVertical: k.pad * 0.85, paddingHorizontal: k.pad * 0.75 }}
    >
      {main.map((s, i) => (
        <PdfSection key={s.id} section={s} index={i} k={k} />
      ))}
    </View>
  );

  return <>{side === "left" ? [railNode, mainNode] : [mainNode, railNode]}</>;
}

function TwoColBody({ content, k, bleed }: { content: ResumeContent; k: Tk; bleed: boolean }) {
  const sections = visibleSections(content);
  const right = sections.filter((s) => (s.column ?? "main") === "side");
  const left = sections.filter((s) => (s.column ?? "main") !== "side");
  return (
    <View>
      <PdfHeader content={content} k={k} />
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: bleed ? k.pad : 0,
          paddingBottom: bleed ? k.pad : 0,
        }}
      >
        <View style={{ width: "62%", paddingRight: k.pad * 0.35 }}>
          {left.map((s, i) => (
            <PdfSection key={s.id} section={s} index={i} k={k} />
          ))}
        </View>
        <View
          style={{
            width: "38%",
            paddingLeft: k.pad * 0.35,
            borderLeftWidth: 0.5,
            borderLeftColor: k.hairline,
          }}
        >
          {right.map((s, i) => (
            <PdfSection key={s.id} section={s} index={i} k={k} />
          ))}
        </View>
      </View>
    </View>
  );
}

function EditorialBody({ content, k }: { content: ResumeContent; k: Tk }) {
  const sections = visibleSections(content);
  return (
    <View>
      <PdfHeader content={content} k={k} />
      {sections.map((s, i) => (
        <View
          key={s.id}
          style={{
            flexDirection: "row",
            marginBottom: k.sectionGap * 1.15,
            paddingTop: k.sectionGap * 0.5,
            borderTopWidth: i === 0 ? 0 : 0.4,
            borderTopColor: k.hairline,
          }}
        >
          <View style={{ width: "22%", paddingRight: 8 }}>
            <PdfHeading label={s.label} index={i} k={k} flush />
          </View>
          <View style={{ flexGrow: 1, flexBasis: 0 }}>
            <PdfSectionBody section={s} k={k} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ── header ──────────────────────────────────────────────────────────────────

function contactLines(content: ResumeContent): string[] {
  const b = content.basics;
  return [b.email, b.phone, b.location, b.website, ...b.links.map((l) => l.url)].filter(Boolean);
}

function NameText({
  k,
  text,
  color,
  scale = 1,
  align,
}: {
  k: Tk;
  text: string;
  color: string;
  scale?: number;
  align?: Style["textAlign"];
}) {
  return (
    <Text style={{ fontFamily: k.headFontBold, fontSize: k.name * scale, color, textAlign: align }}>
      {text}
    </Text>
  );
}

function TitleText({
  k,
  text,
  color,
  align,
}: {
  k: Tk;
  text: string;
  color: string;
  align?: Style["textAlign"];
}) {
  return (
    <Text style={{ fontSize: k.jobTitle, color, marginTop: 2, textAlign: align }}>{text}</Text>
  );
}

function ContactText({
  k,
  text,
  color,
  align,
}: {
  k: Tk;
  text: string;
  color: string;
  align?: Style["textAlign"];
}) {
  return <Text style={{ fontSize: k.small, color, marginTop: 3, textAlign: align }}>{text}</Text>;
}

function PdfHeader({ content, k }: { content: ResumeContent; k: Tk }) {
  const b = content.basics;
  const style = k.theme.headerStyle;
  const contact = contactLines(content).join("   ·   ");
  const photo = k.theme.showPhoto && b.photoUrl ? b.photoUrl : null;

  if (style === "banner") {
    return (
      <View
        style={{
          backgroundColor: k.accent,
          color: k.onAccent,
          paddingVertical: k.pad * 0.7,
          paddingHorizontal: k.pad,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        {photo && (
          <Image src={photo} style={{ width: k.name * 1.7, height: k.name * 1.7, borderRadius: k.name, marginRight: 14 }} />
        )}
        <View style={{ flexGrow: 1, flexBasis: 0 }}>
          <NameText k={k} text={b.fullName} color={k.onAccent} />
          <TitleText k={k} text={b.title} color={rgba("#ffffff", 0.85)} />
          <ContactText k={k} text={contact} color={rgba("#ffffff", 0.85)} />
        </View>
      </View>
    );
  }

  if (style === "band") {
    return (
      <View style={{ marginBottom: k.sectionGap }}>
        <View
          style={{
            backgroundColor: k.accent,
            paddingVertical: k.pad * 0.45,
            paddingHorizontal: k.pad,
          }}
        >
          <NameText k={k} text={b.fullName} color={k.onAccent} />
          <TitleText k={k} text={b.title} color={rgba("#ffffff", 0.85)} />
        </View>
        <View style={{ paddingHorizontal: k.pad, paddingTop: 6 }}>
          <ContactText k={k} text={contact} color={k.muted} />
        </View>
      </View>
    );
  }

  if (style === "split") {
    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: k.sectionGap,
          paddingBottom: k.sectionGap * 0.6,
          borderBottomWidth: 2,
          borderBottomColor: k.accent,
        }}
      >
        <View style={{ flexGrow: 1, flexBasis: 0, paddingRight: 12 }}>
          <NameText k={k} text={b.fullName} color={k.ink} />
          <TitleText k={k} text={b.title} color={k.accent} />
        </View>
        <View style={{ width: "40%" }}>
          {contactLines(content).map((line, i) => (
            <Text key={i} style={{ fontSize: k.small, color: k.muted, textAlign: "right" }}>
              {line}
            </Text>
          ))}
        </View>
      </View>
    );
  }

  if (style === "monogram") {
    const initials = (b.fullName.trim().split(/\s+/).filter(Boolean) ?? [])
      .map((p, i, arr) => (i === 0 || i === arr.length - 1 ? p[0] : ""))
      .join("")
      .toUpperCase() || "—";
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: k.sectionGap,
          paddingBottom: k.sectionGap * 0.6,
          borderBottomWidth: 0.6,
          borderBottomColor: k.hairline,
        }}
      >
        <View
          style={{
            width: k.name * 1.5,
            height: k.name * 1.5,
            backgroundColor: k.accent,
            borderRadius: 3,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 14,
          }}
        >
          <Text style={{ fontFamily: k.headFontBold, fontSize: k.name * 0.62, color: k.onAccent }}>
            {initials}
          </Text>
        </View>
        <View style={{ flexGrow: 1, flexBasis: 0 }}>
          <NameText k={k} text={b.fullName} color={k.ink} scale={0.85} />
          <TitleText k={k} text={b.title} color={k.accent} />
          <ContactText k={k} text={contact} color={k.muted} />
        </View>
      </View>
    );
  }

  if (style === "boxed") {
    return (
      <View
        style={{
          borderWidth: 1,
          borderColor: k.accent,
          padding: 10,
          marginBottom: k.sectionGap,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        {photo && (
          <Image src={photo} style={{ width: k.name * 1.4, height: k.name * 1.4, borderRadius: 4, marginRight: 12 }} />
        )}
        <View style={{ flexGrow: 1, flexBasis: 0 }}>
          <NameText k={k} text={b.fullName} color={k.ink} scale={0.9} />
          <TitleText k={k} text={b.title} color={k.accent} />
          <ContactText k={k} text={contact} color={k.muted} />
        </View>
      </View>
    );
  }

  if (style === "display") {
    return (
      <View style={{ marginBottom: k.sectionGap * 1.2 }}>
        <NameText k={k} text={b.fullName} color={k.ink} />
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 4,
            paddingTop: 4,
            borderTopWidth: 0.75,
            borderTopColor: k.ink,
          }}
        >
          <Text style={{ fontSize: k.jobTitle, color: k.accent }}>{b.title}</Text>
          <Text style={{ fontSize: k.small, color: k.muted }}>{contact}</Text>
        </View>
      </View>
    );
  }

  // stack + centered
  const align = style === "centered" ? "center" : "left";
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: align === "center" ? "center" : "flex-start",
        marginBottom: k.sectionGap,
        paddingBottom: k.sectionGap * 0.5,
        borderBottomWidth: k.theme.headingStyle === "rule" ? 1.4 : 0.6,
        borderBottomColor: k.theme.headingStyle === "rule" ? k.accent : k.hairline,
      }}
    >
      {photo && (
        <Image src={photo} style={{ width: k.name * 1.5, height: k.name * 1.5, borderRadius: k.name, marginRight: 12 }} />
      )}
      <View style={{ flexGrow: 1, flexBasis: 0 }}>
        <NameText k={k} text={b.fullName} color={k.ink} align={align} />
        <TitleText k={k} text={b.title} color={k.accent} align={align} />
        <ContactText k={k} text={contact} color={k.muted} align={align} />
      </View>
    </View>
  );
}

// ── sections ────────────────────────────────────────────────────────────────

function PdfHeading({
  label,
  index,
  k,
  onSide = false,
  flush = false,
}: {
  label: string;
  index: number;
  k: Tk;
  onSide?: boolean;
  flush?: boolean;
}) {
  const t = k.theme;
  const text = t.uppercaseHeadings ? label.toUpperCase() : label;
  const color = onSide ? k.onAccent : k.accent;
  const base: Style = {
    fontFamily: k.headFontBold,
    fontSize: k.heading,
    color,
    letterSpacing: t.tracking * k.heading,
    marginTop: flush ? 0 : k.sectionGap,
    marginBottom: k.sectionGap * 0.35,
  };

  switch (t.headingStyle) {
    case "block":
      return (
        <View
          style={{
            backgroundColor: onSide ? rgba("#ffffff", 0.22) : k.accent,
            alignSelf: "flex-start",
            paddingVertical: 1.5,
            paddingHorizontal: 5,
            borderRadius: 2,
            marginTop: base.marginTop,
            marginBottom: base.marginBottom,
          }}
        >
          <Text style={{ ...base, marginTop: 0, marginBottom: 0, color: k.onAccent, fontSize: k.heading * 0.92 }}>
            {text}
          </Text>
        </View>
      );
    case "rule":
      return (
        <Text style={{ ...base, borderBottomWidth: 1.4, borderBottomColor: color, paddingBottom: 1.5 }}>
          {text}
        </Text>
      );
    case "underline":
      return (
        <Text
          style={{
            ...base,
            borderBottomWidth: 0.6,
            borderBottomColor: onSide ? rgba("#ffffff", 0.35) : k.hairline,
            paddingBottom: 2,
          }}
        >
          {text}
        </Text>
      );
    case "sideRule":
      return (
        <Text style={{ ...base, borderLeftWidth: 2.5, borderLeftColor: color, paddingLeft: 5 }}>
          {text}
        </Text>
      );
    case "bracket":
      return <Text style={base}>{`[ ${text} ]`}</Text>;
    case "hash":
      return <Text style={base}>{`# ${text}`}</Text>;
    case "dot":
      return <Text style={base}>{`•  ${text}`}</Text>;
    case "numbered":
      return (
        <Text style={{ ...base, borderBottomWidth: 0.6, borderBottomColor: k.hairline, paddingBottom: 2 }}>
          {`${String(index + 1).padStart(2, "0")}   ${text}`}
        </Text>
      );
    case "smallcaps":
      return (
        <Text style={{ ...base, fontSize: k.heading * 0.88, letterSpacing: Math.max(t.tracking, 0.18) * k.heading }}>
          {text}
        </Text>
      );
    case "plain":
    default:
      return <Text style={base}>{text}</Text>;
  }
}

function PdfSection({
  section,
  index,
  k,
  onSide = false,
  timeline = false,
}: {
  section: Section;
  index: number;
  k: Tk;
  onSide?: boolean;
  timeline?: boolean;
}) {
  return (
    <View>
      <PdfHeading label={section.label} index={index} k={k} onSide={onSide} />
      <PdfSectionBody section={section} k={k} onSide={onSide} timeline={timeline} />
    </View>
  );
}

function PdfSectionBody({
  section,
  k,
  onSide = false,
  timeline = false,
}: {
  section: Section;
  k: Tk;
  onSide?: boolean;
  timeline?: boolean;
}) {
  const fg = onSide ? k.onAccent : k.ink;

  if (section.kind === "text") {
    return <Text style={{ color: fg }}>{section.text}</Text>;
  }

  if (section.kind === "tags") {
    if (k.theme.chipSkills || onSide) {
      return (
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {section.tags.map((tag, i) => (
            <Text
              key={i}
              style={{
                fontSize: k.tiny,
                color: onSide ? k.onAccent : k.accent,
                backgroundColor: onSide ? rgba("#ffffff", 0.18) : k.accentSoft,
                paddingVertical: 1.5,
                paddingHorizontal: 5,
                borderRadius: 6,
                marginRight: 3,
                marginBottom: 3,
              }}
            >
              {tag}
            </Text>
          ))}
        </View>
      );
    }
    return <Text style={{ color: fg }}>{section.tags.join(", ")}</Text>;
  }

  if (section.kind === "groups") {
    return (
      <View>
        {section.groups.map((g) => (
          <View key={g.id} style={{ flexDirection: "row", marginBottom: k.bulletGap + 1 }}>
            <Text style={{ width: "26%", fontFamily: k.fontBold, fontSize: k.small, color: k.accent }}>
              {g.label}
            </Text>
            <Text style={{ flexGrow: 1, flexBasis: 0, color: fg }}>{g.tags.join(", ")}</Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View>
      {section.entries.map((e, i) => (
        <PdfEntry
          key={e.id}
          entry={e}
          k={k}
          fg={fg}
          onSide={onSide}
          timeline={timeline}
          last={i === section.entries.length - 1}
        />
      ))}
    </View>
  );
}

function PdfEntry({
  entry,
  k,
  fg,
  onSide,
  timeline,
  last,
}: {
  entry: EntryItem;
  k: Tk;
  fg: string;
  onSide: boolean;
  timeline: boolean;
  last: boolean;
}) {
  const range = formatRange(entry);
  const rule = k.theme.entryRule && !last;
  const glyph = BULLET_GLYPH[k.theme.bulletStyle];

  const inner = (
    <View
      wrap={false}
      style={{
        marginBottom: k.entryGap,
        paddingBottom: rule ? k.entryGap * 0.8 : 0,
        borderBottomWidth: rule ? 0.5 : 0,
        borderBottomColor: k.hairline,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ fontFamily: k.fontBold, color: fg, flexGrow: 1, flexBasis: 0, paddingRight: 6 }}>
          {entry.title}
        </Text>
        {!!range && (
          <Text style={{ fontSize: k.small, color: onSide ? rgba("#ffffff", 0.8) : k.muted }}>
            {range}
          </Text>
        )}
      </View>

      {(entry.subtitle || entry.meta || entry.link) && (
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text
            style={{
              fontSize: k.small,
              color: onSide ? rgba("#ffffff", 0.85) : k.accent,
              fontFamily: k.fontBold,
              flexGrow: 1,
              flexBasis: 0,
              paddingRight: 6,
            }}
          >
            {entry.subtitle}
          </Text>
          <Text style={{ fontSize: k.small, color: onSide ? rgba("#ffffff", 0.75) : k.muted }}>
            {entry.meta || entry.link}
          </Text>
        </View>
      )}

      {!!entry.description && (
        <Text style={{ fontSize: k.small, color: fg, marginTop: 1 }}>{entry.description}</Text>
      )}

      {entry.bullets.filter(Boolean).map((b, i) => (
        <View key={i} style={{ flexDirection: "row", marginTop: k.bulletGap }}>
          {glyph ? <Text style={{ width: k.body * 0.85, color: k.accent }}>{glyph}</Text> : null}
          <Text style={{ flexGrow: 1, flexBasis: 0, color: fg }}>{b}</Text>
        </View>
      ))}

      {!!entry.tags?.length && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 2.5 }}>
          {entry.tags.map((tag, i) => (
            <Text
              key={i}
              style={{
                fontSize: k.tiny,
                color: k.accent,
                backgroundColor: k.accentSoft,
                paddingVertical: 1,
                paddingHorizontal: 4,
                borderRadius: 6,
                marginRight: 3,
                marginBottom: 2,
              }}
            >
              {tag}
            </Text>
          ))}
        </View>
      )}
    </View>
  );

  if (!timeline) return inner;

  return (
    <View style={{ flexDirection: "row" }}>
      <View style={{ width: 10, alignItems: "center", paddingTop: 3 }}>
        <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: k.accent }} />
        {!last && <View style={{ flexGrow: 1, width: 1, backgroundColor: k.hairline, marginTop: 2 }} />}
      </View>
      <View style={{ flexGrow: 1, flexBasis: 0, paddingLeft: 4 }}>{inner}</View>
    </View>
  );
}
