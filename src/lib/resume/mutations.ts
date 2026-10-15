/**
 * Immutable update helpers for `ResumeContent`.
 *
 * Every editor interaction — typing in the document, dragging a section,
 * accepting an AI rewrite — funnels through these, which means undo/redo is
 * just an array of snapshots and autosave never has to diff anything.
 */

import {
  makeEntry,
  makeSection,
  newId,
  SECTION_PRESETS,
  type EntriesSection,
  type EntryItem,
  type ResumeBasics,
  type ResumeContent,
  type Section,
  type SectionKey,
  type SocialLink,
  type TagGroup,
} from "./schema";
import type { ResumeTheme } from "./design";

// ── basics ──────────────────────────────────────────────────────────────────

export function setBasics(
  c: ResumeContent,
  field: keyof ResumeBasics,
  value: string,
): ResumeContent {
  return { ...c, basics: { ...c.basics, [field]: value } };
}

export function addLink(c: ResumeContent, link?: Partial<SocialLink>): ResumeContent {
  const item: SocialLink = {
    id: newId("l"),
    label: link?.label ?? "Link",
    url: link?.url ?? "",
  };
  return { ...c, basics: { ...c.basics, links: [...c.basics.links, item] } };
}

export function setLink(
  c: ResumeContent,
  id: string,
  field: "label" | "url",
  value: string,
): ResumeContent {
  return {
    ...c,
    basics: {
      ...c.basics,
      links: c.basics.links.map((l) => (l.id === id ? { ...l, [field]: value } : l)),
    },
  };
}

export function removeLink(c: ResumeContent, id: string): ResumeContent {
  return { ...c, basics: { ...c.basics, links: c.basics.links.filter((l) => l.id !== id) } };
}

// ── theme ───────────────────────────────────────────────────────────────────

export function setTheme(c: ResumeContent, patch: Partial<ResumeTheme>): ResumeContent {
  return { ...c, theme: { ...c.theme, ...patch } };
}

export function replaceTheme(c: ResumeContent, theme: ResumeTheme): ResumeContent {
  return { ...c, theme };
}

// ── sections ────────────────────────────────────────────────────────────────

function mapSection(
  c: ResumeContent,
  id: string,
  fn: (s: Section) => Section,
): ResumeContent {
  return { ...c, sections: c.sections.map((s) => (s.id === id ? fn(s) : s)) };
}

export function setSectionLabel(c: ResumeContent, id: string, label: string): ResumeContent {
  return mapSection(c, id, (s) => ({ ...s, label }));
}

export function toggleSection(c: ResumeContent, id: string): ResumeContent {
  return mapSection(c, id, (s) => ({ ...s, visible: !s.visible }));
}

export function setSectionColumn(
  c: ResumeContent,
  id: string,
  column: "main" | "side",
): ResumeContent {
  return mapSection(c, id, (s) => ({ ...s, column }));
}

export function moveSection(c: ResumeContent, id: string, delta: number): ResumeContent {
  const i = c.sections.findIndex((s) => s.id === id);
  if (i < 0) return c;
  const j = Math.max(0, Math.min(c.sections.length - 1, i + delta));
  if (i === j) return c;
  const next = [...c.sections];
  const [item] = next.splice(i, 1);
  next.splice(j, 0, item);
  return { ...c, sections: next };
}

/** Drag-and-drop reorder: place `id` at absolute index `to`. */
export function reorderSection(c: ResumeContent, id: string, to: number): ResumeContent {
  const i = c.sections.findIndex((s) => s.id === id);
  if (i < 0) return c;
  const next = [...c.sections];
  const [item] = next.splice(i, 1);
  next.splice(Math.max(0, Math.min(next.length, to)), 0, item);
  return { ...c, sections: next };
}

export function addSection(
  c: ResumeContent,
  key: SectionKey,
  label?: string,
): ResumeContent {
  const section = makeSection(key, label ? ({ label } as Partial<Section>) : {});
  // New entry sections start with one blank item so there's something to type into.
  const seeded =
    section.kind === "entries" && section.entries.length === 0
      ? ({ ...section, entries: [makeEntry({ title: "" })] } as EntriesSection)
      : section;
  return { ...c, sections: [...c.sections, seeded] };
}

export function removeSection(c: ResumeContent, id: string): ResumeContent {
  return { ...c, sections: c.sections.filter((s) => s.id !== id) };
}

export function duplicateSection(c: ResumeContent, id: string): ResumeContent {
  const i = c.sections.findIndex((s) => s.id === id);
  if (i < 0) return c;
  const src = c.sections[i];
  const copy: Section = JSON.parse(JSON.stringify(src));
  copy.id = newId("s");
  copy.label = `${src.label} (copy)`;
  if (copy.kind === "entries") copy.entries = copy.entries.map((e) => ({ ...e, id: newId("e") }));
  if (copy.kind === "groups") copy.groups = copy.groups.map((g) => ({ ...g, id: newId("g") }));
  const next = [...c.sections];
  next.splice(i + 1, 0, copy);
  return { ...c, sections: next };
}

// ── text sections ───────────────────────────────────────────────────────────

export function setSectionText(c: ResumeContent, id: string, text: string): ResumeContent {
  return mapSection(c, id, (s) => (s.kind === "text" ? { ...s, text } : s));
}

/** Summary lives in two places (basics + its section) — keep them in lockstep. */
export function setSummary(c: ResumeContent, text: string): ResumeContent {
  const withBasics = { ...c, basics: { ...c.basics, summary: text } };
  return {
    ...withBasics,
    sections: withBasics.sections.map((s) =>
      s.key === "summary" && s.kind === "text" ? { ...s, text } : s,
    ),
  };
}

// ── tag sections ────────────────────────────────────────────────────────────

export function setTags(c: ResumeContent, id: string, tags: string[]): ResumeContent {
  return mapSection(c, id, (s) => (s.kind === "tags" ? { ...s, tags } : s));
}

export function addTag(c: ResumeContent, id: string, tag = "New skill"): ResumeContent {
  return mapSection(c, id, (s) => (s.kind === "tags" ? { ...s, tags: [...s.tags, tag] } : s));
}

export function setTagAt(
  c: ResumeContent,
  id: string,
  index: number,
  value: string,
): ResumeContent {
  return mapSection(c, id, (s) =>
    s.kind === "tags" ? { ...s, tags: s.tags.map((t, i) => (i === index ? value : t)) } : s,
  );
}

export function removeTagAt(c: ResumeContent, id: string, index: number): ResumeContent {
  return mapSection(c, id, (s) =>
    s.kind === "tags" ? { ...s, tags: s.tags.filter((_, i) => i !== index) } : s,
  );
}

/** Appends tags to the first `skills` section, skipping ones already present. */
export function appendSkills(c: ResumeContent, incoming: string[]): ResumeContent {
  const target = c.sections.find((s) => s.key === "skills" && s.kind === "tags");
  if (!target) {
    const withSection = addSection(c, "skills");
    const created = withSection.sections[withSection.sections.length - 1];
    return setTags(withSection, created.id, dedupe(incoming));
  }
  const existing = target.kind === "tags" ? target.tags : [];
  return setTags(c, target.id, dedupe([...existing, ...incoming]));
}

function dedupe(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    const t = item.trim();
    const k = t.toLowerCase();
    if (!t || seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

// ── group sections ──────────────────────────────────────────────────────────

export function addGroup(c: ResumeContent, id: string, label = "Category"): ResumeContent {
  return mapSection(c, id, (s) =>
    s.kind === "groups"
      ? { ...s, groups: [...s.groups, { id: newId("g"), label, tags: [] }] }
      : s,
  );
}

export function setGroup(
  c: ResumeContent,
  id: string,
  groupId: string,
  patch: Partial<TagGroup>,
): ResumeContent {
  return mapSection(c, id, (s) =>
    s.kind === "groups"
      ? { ...s, groups: s.groups.map((g) => (g.id === groupId ? { ...g, ...patch } : g)) }
      : s,
  );
}

export function removeGroup(c: ResumeContent, id: string, groupId: string): ResumeContent {
  return mapSection(c, id, (s) =>
    s.kind === "groups" ? { ...s, groups: s.groups.filter((g) => g.id !== groupId) } : s,
  );
}

// ── entry sections ──────────────────────────────────────────────────────────

export function addEntry(c: ResumeContent, id: string, at?: number): ResumeContent {
  return mapSection(c, id, (s) => {
    if (s.kind !== "entries") return s;
    const entries = [...s.entries];
    entries.splice(at ?? entries.length, 0, makeEntry({ bullets: [""] }));
    return { ...s, entries };
  });
}

export function setEntry(
  c: ResumeContent,
  id: string,
  entryId: string,
  field: keyof EntryItem,
  value: string | boolean,
): ResumeContent {
  return mapSection(c, id, (s) =>
    s.kind === "entries"
      ? {
          ...s,
          entries: s.entries.map((e) => (e.id === entryId ? { ...e, [field]: value } : e)),
        }
      : s,
  );
}

export function replaceEntry(
  c: ResumeContent,
  id: string,
  entryId: string,
  patch: Partial<EntryItem>,
): ResumeContent {
  return mapSection(c, id, (s) =>
    s.kind === "entries"
      ? { ...s, entries: s.entries.map((e) => (e.id === entryId ? { ...e, ...patch } : e)) }
      : s,
  );
}

export function removeEntry(c: ResumeContent, id: string, entryId: string): ResumeContent {
  return mapSection(c, id, (s) =>
    s.kind === "entries" ? { ...s, entries: s.entries.filter((e) => e.id !== entryId) } : s,
  );
}

export function duplicateEntry(c: ResumeContent, id: string, entryId: string): ResumeContent {
  return mapSection(c, id, (s) => {
    if (s.kind !== "entries") return s;
    const i = s.entries.findIndex((e) => e.id === entryId);
    if (i < 0) return s;
    const entries = [...s.entries];
    entries.splice(i + 1, 0, { ...s.entries[i], id: newId("e") });
    return { ...s, entries };
  });
}

export function moveEntry(
  c: ResumeContent,
  id: string,
  entryId: string,
  delta: number,
): ResumeContent {
  return mapSection(c, id, (s) => {
    if (s.kind !== "entries") return s;
    const i = s.entries.findIndex((e) => e.id === entryId);
    if (i < 0) return s;
    const j = Math.max(0, Math.min(s.entries.length - 1, i + delta));
    if (i === j) return s;
    const entries = [...s.entries];
    const [item] = entries.splice(i, 1);
    entries.splice(j, 0, item);
    return { ...s, entries };
  });
}

export function addBullet(
  c: ResumeContent,
  id: string,
  entryId: string,
  text = "",
): ResumeContent {
  return mapSection(c, id, (s) =>
    s.kind === "entries"
      ? {
          ...s,
          entries: s.entries.map((e) =>
            e.id === entryId ? { ...e, bullets: [...e.bullets, text] } : e,
          ),
        }
      : s,
  );
}

export function setBullet(
  c: ResumeContent,
  id: string,
  entryId: string,
  index: number,
  value: string,
): ResumeContent {
  return mapSection(c, id, (s) =>
    s.kind === "entries"
      ? {
          ...s,
          entries: s.entries.map((e) =>
            e.id === entryId
              ? { ...e, bullets: e.bullets.map((b, i) => (i === index ? value : b)) }
              : e,
          ),
        }
      : s,
  );
}

export function removeBullet(
  c: ResumeContent,
  id: string,
  entryId: string,
  index: number,
): ResumeContent {
  return mapSection(c, id, (s) =>
    s.kind === "entries"
      ? {
          ...s,
          entries: s.entries.map((e) =>
            e.id === entryId ? { ...e, bullets: e.bullets.filter((_, i) => i !== index) } : e,
          ),
        }
      : s,
  );
}

export function moveBullet(
  c: ResumeContent,
  id: string,
  entryId: string,
  index: number,
  delta: number,
): ResumeContent {
  return mapSection(c, id, (s) =>
    s.kind === "entries"
      ? {
          ...s,
          entries: s.entries.map((e) => {
            if (e.id !== entryId) return e;
            const j = Math.max(0, Math.min(e.bullets.length - 1, index + delta));
            if (j === index) return e;
            const bullets = [...e.bullets];
            const [b] = bullets.splice(index, 1);
            bullets.splice(j, 0, b);
            return { ...e, bullets };
          }),
        }
      : s,
  );
}

export function setEntryTags(
  c: ResumeContent,
  id: string,
  entryId: string,
  tags: string[],
): ResumeContent {
  return mapSection(c, id, (s) =>
    s.kind === "entries"
      ? { ...s, entries: s.entries.map((e) => (e.id === entryId ? { ...e, tags } : e)) }
      : s,
  );
}

// ── document-level ──────────────────────────────────────────────────────────

/** Applies a template's default theme while keeping the user's page size. */
export function applyTemplateTheme(
  c: ResumeContent,
  theme: ResumeTheme,
  keepPageSize = false,
): ResumeContent {
  return { ...c, theme: keepPageSize ? { ...theme, pageSize: c.theme.pageSize } : { ...theme } };
}

/** Switches resume ⇄ CV and folds in the sections that family expects. */
export function setDocType(c: ResumeContent, docType: "resume" | "cv"): ResumeContent {
  const have = new Set(c.sections.map((s) => s.key));
  const wanted: SectionKey[] =
    docType === "cv"
      ? ["education", "research", "publications", "teaching", "grants", "awards"]
      : ["summary", "experience", "projects", "skills"];
  let next: ResumeContent = { ...c, docType };
  for (const key of wanted) {
    if (!have.has(key)) next = addSection(next, key);
  }
  return next;
}

export const sectionPreset = (key: SectionKey) => SECTION_PRESETS[key];
