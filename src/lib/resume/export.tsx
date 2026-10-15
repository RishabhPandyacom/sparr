/**
 * Export pipeline. Every format is generated in the browser from the same
 * `ResumeContent`, so there is no server round-trip and no format drift.
 *
 *   PDF   → @react-pdf, pixel-matched to the editor preview
 *   DOCX  → Word-compatible HTML (.doc) — opens natively in Word/Pages/Docs
 *   TXT   → the plain-text shape ATS parsers actually prefer
 *   MD    → for GitHub profiles / Notion
 *   HTML  → a self-contained page you can host anywhere
 *   JSON  → the raw document, for backup and re-import
 */

import {
  formatRange,
  resumePlainText,
  visibleSections,
  type ResumeContent,
} from "./schema";
import { FONT_STACKS, PAGE_DIMENSIONS } from "./design";

export type ExportFormat = "pdf" | "docx" | "txt" | "md" | "html" | "json";

export const EXPORT_LABELS: Record<ExportFormat, { label: string; hint: string }> = {
  pdf: { label: "PDF", hint: "Pixel-perfect. What you send to employers." },
  docx: { label: "Word (.doc)", hint: "Editable in Word, Pages and Google Docs." },
  txt: { label: "Plain text", hint: "The safest possible ATS submission." },
  md: { label: "Markdown", hint: "For GitHub profiles and personal sites." },
  html: { label: "HTML page", hint: "Self-contained — host it anywhere." },
  json: { label: "JSON", hint: "Full backup. Re-importable." },
};

// ── entry point ─────────────────────────────────────────────────────────────

export async function exportResume(
  format: ExportFormat,
  content: ResumeContent,
  title: string,
): Promise<void> {
  const name = slugifyFilename(title);
  switch (format) {
    case "pdf": {
      const [{ pdf }, { ResumePdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/resume/pdf/document"),
      ]);
      const blob = await pdf(<ResumePdfDocument content={content} title={title} />).toBlob();
      download(blob, `${name}.pdf`);
      return;
    }
    case "docx":
      download(
        new Blob([wordHtml(content, title)], { type: "application/msword" }),
        `${name}.doc`,
      );
      return;
    case "txt":
      download(new Blob([atsPlainText(content)], { type: "text/plain;charset=utf-8" }), `${name}.txt`);
      return;
    case "md":
      download(new Blob([toMarkdown(content)], { type: "text/markdown;charset=utf-8" }), `${name}.md`);
      return;
    case "html":
      download(new Blob([standaloneHtml(content, title)], { type: "text/html;charset=utf-8" }), `${name}.html`);
      return;
    case "json":
      download(
        new Blob([JSON.stringify(content, null, 2)], { type: "application/json" }),
        `${name}.json`,
      );
      return;
  }
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give Safari a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function slugifyFilename(title: string): string {
  const base = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return base || "resume";
}

// ── plain text ──────────────────────────────────────────────────────────────

/**
 * ATS-optimised text: no columns, no glyph bullets, one fact per line, and
 * section headings on their own line in caps — exactly what naive parsers key
 * off. Deliberately plainer than `resumePlainText` (which is for AI context).
 */
export function atsPlainText(c: ResumeContent): string {
  const out: string[] = [];
  const b = c.basics;
  out.push(b.fullName);
  if (b.title) out.push(b.title);
  const contact = [b.email, b.phone, b.location, b.website, ...b.links.map((l) => l.url)].filter(Boolean);
  if (contact.length) out.push(contact.join(" | "));

  for (const s of visibleSections(c)) {
    out.push("", s.label.toUpperCase(), "");
    if (s.kind === "text" && s.text) out.push(wrapText(s.text, 96));
    if (s.kind === "tags") out.push(s.tags.join(", "));
    if (s.kind === "groups") s.groups.forEach((g) => out.push(`${g.label}: ${g.tags.join(", ")}`));
    if (s.kind === "entries") {
      for (const e of s.entries) {
        const head = [e.title, e.subtitle].filter(Boolean).join(", ");
        const range = formatRange(e);
        out.push([head, e.meta, range].filter(Boolean).join(" | "));
        if (e.link) out.push(e.link);
        if (e.description) out.push(wrapText(e.description, 96));
        e.bullets.filter(Boolean).forEach((x) => out.push(`- ${wrapText(x, 94, "  ")}`));
        if (e.tags?.length) out.push(`Tools: ${e.tags.join(", ")}`);
        out.push("");
      }
    }
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

function wrapText(text: string, width: number, indent = ""): string {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > width) {
      lines.push(line.trim());
      line = w;
    } else {
      line += ` ${w}`;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines.join(`\n${indent}`);
}

// ── markdown ────────────────────────────────────────────────────────────────

export function toMarkdown(c: ResumeContent): string {
  const b = c.basics;
  const out: string[] = [`# ${b.fullName}`];
  if (b.title) out.push(`**${b.title}**`);
  const contact = [b.email, b.phone, b.location, b.website, ...b.links.map((l) => `[${l.label}](${withProtocol(l.url)})`)]
    .filter(Boolean)
    .join(" · ");
  if (contact) out.push("", contact);

  for (const s of visibleSections(c)) {
    out.push("", `## ${s.label}`, "");
    if (s.kind === "text" && s.text) out.push(s.text);
    if (s.kind === "tags") out.push(s.tags.map((t) => `\`${t}\``).join(" "));
    if (s.kind === "groups") s.groups.forEach((g) => out.push(`**${g.label}** — ${g.tags.join(", ")}`));
    if (s.kind === "entries") {
      for (const e of s.entries) {
        const range = formatRange(e);
        out.push(`### ${e.title}${e.subtitle ? ` — ${e.subtitle}` : ""}`);
        const meta = [e.meta, range].filter(Boolean).join(" · ");
        if (meta) out.push(`*${meta}*`);
        if (e.link) out.push(`[${e.link}](${withProtocol(e.link)})`);
        if (e.description) out.push("", e.description);
        if (e.bullets.filter(Boolean).length) {
          out.push("");
          e.bullets.filter(Boolean).forEach((x) => out.push(`- ${x}`));
        }
        if (e.tags?.length) out.push("", `\`${e.tags.join("` `")}\``);
        out.push("");
      }
    }
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

const withProtocol = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);

// ── HTML / Word ─────────────────────────────────────────────────────────────

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Shared semantic body used by both the standalone page and the Word export. */
function documentBodyHtml(c: ResumeContent): string {
  const b = c.basics;
  const parts: string[] = [];
  parts.push(`<header class="hd">
    <h1>${esc(b.fullName)}</h1>
    ${b.title ? `<p class="role">${esc(b.title)}</p>` : ""}
    <p class="contact">${[b.email, b.phone, b.location, b.website, ...b.links.map((l) => l.url)]
      .filter(Boolean)
      .map(esc)
      .join(" &nbsp;·&nbsp; ")}</p>
  </header>`);

  for (const s of visibleSections(c)) {
    parts.push(`<section><h2>${esc(s.label)}</h2>`);
    if (s.kind === "text") parts.push(`<p>${esc(s.text).replace(/\n/g, "<br/>")}</p>`);
    if (s.kind === "tags") parts.push(`<p class="tags">${s.tags.map(esc).join(", ")}</p>`);
    if (s.kind === "groups")
      parts.push(
        `<table class="groups">${s.groups
          .map((g) => `<tr><td class="gl">${esc(g.label)}</td><td>${esc(g.tags.join(", "))}</td></tr>`)
          .join("")}</table>`,
      );
    if (s.kind === "entries") {
      for (const e of s.entries) {
        const range = formatRange(e);
        parts.push(`<div class="entry">
          <div class="row"><span class="t">${esc(e.title)}</span><span class="d">${esc(range)}</span></div>
          ${
            e.subtitle || e.meta || e.link
              ? `<div class="row sub"><span>${esc(e.subtitle ?? "")}</span><span class="d">${esc(
                  e.meta || e.link || "",
                )}</span></div>`
              : ""
          }
          ${e.description ? `<p class="desc">${esc(e.description)}</p>` : ""}
          ${
            e.bullets.filter(Boolean).length
              ? `<ul>${e.bullets.filter(Boolean).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`
              : ""
          }
          ${e.tags?.length ? `<p class="tags">${esc(e.tags.join(" · "))}</p>` : ""}
        </div>`);
      }
    }
    parts.push(`</section>`);
  }
  return parts.join("\n");
}

function documentCss(c: ResumeContent, forWord: boolean): string {
  const th = c.theme;
  const font = forWord ? "Calibri, Arial, sans-serif" : FONT_STACKS[th.font];
  const dim = PAGE_DIMENSIONS[th.pageSize] ?? PAGE_DIMENSIONS.LETTER;
  return `
    body { font-family: ${font}; font-size: ${10 * th.fontScale}pt; line-height: ${th.lineHeight};
           color: ${th.ink}; background: ${forWord ? "#ffffff" : "#f1f5f9"}; margin: 0; }
    .page { background: ${th.paper}; max-width: ${dim.wIn}in; margin: ${forWord ? "0" : "24px auto"};
            padding: 0.55in 0.6in; ${forWord ? "" : "box-shadow: 0 10px 40px rgba(2,6,23,.12); border-radius: 6px;"} }
    h1 { font-size: ${21 * th.fontScale * th.nameScale}pt; margin: 0; letter-spacing: -0.01em; }
    h2 { font-size: ${10.5 * th.fontScale}pt; text-transform: ${th.uppercaseHeadings ? "uppercase" : "none"};
         letter-spacing: ${th.tracking}em; color: ${th.accent}; margin: 16pt 0 5pt;
         border-bottom: ${th.headingStyle === "rule" ? `1.4pt solid ${th.accent}` : "0.6pt solid rgba(0,0,0,.14)"};
         padding-bottom: 2pt; }
    .role { color: ${th.accent}; margin: 2pt 0 0; font-size: ${11 * th.fontScale}pt; }
    .contact { color: ${th.muted}; margin: 4pt 0 0; font-size: ${9 * th.fontScale}pt; }
    .hd { border-bottom: 0.6pt solid rgba(0,0,0,.14); padding-bottom: 8pt; }
    .entry { margin-bottom: 8pt; }
    .row { display: flex; justify-content: space-between; gap: 12pt; }
    .row .t { font-weight: 700; }
    .row .d { color: ${th.muted}; font-size: ${9 * th.fontScale}pt; white-space: nowrap; }
    .sub span:first-child { color: ${th.accent}; font-weight: 600; font-size: ${9 * th.fontScale}pt; }
    .desc { margin: 2pt 0; font-size: ${9 * th.fontScale}pt; }
    ul { margin: 3pt 0 0; padding-left: 14pt; }
    li { margin-bottom: 1.5pt; }
    .tags { color: ${th.muted}; font-size: ${9 * th.fontScale}pt; margin: 3pt 0 0; }
    .groups td { vertical-align: top; padding: 0 8pt 2pt 0; font-size: ${9.5 * th.fontScale}pt; }
    .groups .gl { font-weight: 700; color: ${th.accent}; white-space: nowrap; }
    @media print { body { background: #fff; } .page { box-shadow: none; margin: 0; max-width: none; } }
  `;
}

export function standaloneHtml(c: ResumeContent, title: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(title)}</title>
<style>${documentCss(c, false)}</style>
</head><body><div class="page">${documentBodyHtml(c)}</div></body></html>`;
}

/**
 * Word reads HTML with an Office namespace as a native document. This produces
 * a genuinely editable .doc without pulling in a multi-megabyte docx builder.
 */
export function wordHtml(c: ResumeContent, title: string): string {
  return `<!doctype html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"/>
<title>${esc(title)}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
<style>@page { size: ${c.theme.pageSize === "A4" ? "A4" : "letter"}; margin: 0.6in; }
${documentCss(c, true)}</style>
</head><body><div class="page">${documentBodyHtml(c)}</div></body></html>`;
}

/** Convenience for the AI panel and the analyzer. */
export const plainTextForAnalysis = resumePlainText;
