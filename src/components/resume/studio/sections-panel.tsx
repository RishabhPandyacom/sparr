"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  Trash2,
  PanelLeft,
  PanelRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as m from "@/lib/resume/mutations";
import {
  SECTION_PRESETS,
  SECTION_KEYS,
  type ResumeContent,
  type SectionKey,
} from "@/lib/resume/schema";

/**
 * Section manager. Order, rename, hide, move between columns, duplicate, and
 * delete — plus a catalogue of section types keyed to whether you're building a
 * résumé or a CV. This is the part most builders don't let you touch.
 */
export function SectionsPanel({
  content,
  onChange,
  onFocusSection,
}: {
  content: ResumeContent;
  onChange: (c: ResumeContent) => void;
  onFocusSection?: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const twoColumn =
    content.theme.layout === "sidebar-left" ||
    content.theme.layout === "sidebar-right" ||
    content.theme.layout === "two-col-body";

  const present = new Set(content.sections.map((s) => s.key));
  const available = SECTION_KEYS.filter(
    (k) =>
      k !== "custom" &&
      (!present.has(k) || k === "projects") &&
      SECTION_PRESETS[k].families.includes(content.docType),
  );

  return (
    <div className="space-y-3">
      <ul className="space-y-1.5">
        {content.sections.map((s, i) => (
          <li
            key={s.id}
            draggable
            onDragStart={() => setDragId(s.id)}
            onDragEnd={() => setDragId(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragId && dragId !== s.id) onChange(m.reorderSection(content, dragId, i));
              setDragId(null);
            }}
            className={cn(
              "group rounded-lg border bg-background p-2 transition-opacity",
              dragId === s.id && "opacity-40",
              !s.visible && "border-dashed",
            )}
          >
            <div className="flex items-center gap-1.5">
              <GripVertical className="size-3.5 shrink-0 cursor-grab text-muted-foreground/50" />
              <input
                value={s.label}
                onChange={(e) => onChange(m.setSectionLabel(content, s.id, e.target.value))}
                onFocus={() => onFocusSection?.(s.id)}
                aria-label="Section name"
                className={cn(
                  "min-w-0 flex-1 rounded bg-transparent px-1 py-0.5 text-sm font-medium outline-none hover:bg-muted focus:bg-muted",
                  !s.visible && "text-muted-foreground line-through",
                )}
              />
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={s.visible ? "Hide section" : "Show section"}
                title={s.visible ? "Hide from the document" : "Show in the document"}
                onClick={() => onChange(m.toggleSection(content, s.id))}
              >
                {s.visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
              </Button>
            </div>

            <div className="mt-1 flex items-center gap-0.5 pl-5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Move up"
                disabled={i === 0}
                onClick={() => onChange(m.moveSection(content, s.id, -1))}
              >
                <ChevronUp className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Move down"
                disabled={i === content.sections.length - 1}
                onClick={() => onChange(m.moveSection(content, s.id, 1))}
              >
                <ChevronDown className="size-3.5" />
              </Button>
              {twoColumn && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Move to the other column"
                  title={
                    (s.column ?? "main") === "side"
                      ? "Move to the main column"
                      : "Move to the sidebar"
                  }
                  onClick={() =>
                    onChange(
                      m.setSectionColumn(
                        content,
                        s.id,
                        (s.column ?? "main") === "side" ? "main" : "side",
                      ),
                    )
                  }
                >
                  {(s.column ?? "main") === "side" ? (
                    <PanelRight className="size-3.5" />
                  ) : (
                    <PanelLeft className="size-3.5" />
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Duplicate section"
                onClick={() => onChange(m.duplicateSection(content, s.id))}
              >
                <Copy className="size-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Delete section"
                onClick={() => onChange(m.removeSection(content, s.id))}
              >
                <Trash2 className="size-3.5 text-muted-foreground" />
              </Button>
              <span className="ml-auto pr-1 text-[10px] uppercase tracking-wide text-muted-foreground/70">
                {s.kind}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <Button variant="outline" size="sm" className="w-full" onClick={() => setAdding((v) => !v)}>
        <Plus className="size-4" />
        Add a section
      </Button>

      {adding && (
        <div className="space-y-1 rounded-lg border bg-muted/30 p-2">
          {available.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                onChange(m.addSection(content, key));
                setAdding(false);
              }}
              className="w-full rounded-md px-2 py-1.5 text-left transition-colors hover:bg-background"
            >
              <span className="block text-sm font-medium">{SECTION_PRESETS[key].label}</span>
              <span className="block text-xs text-muted-foreground">
                {SECTION_PRESETS[key].hint}
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              onChange(m.addSection(content, "custom", "New Section"));
              setAdding(false);
            }}
            className="w-full rounded-md px-2 py-1.5 text-left transition-colors hover:bg-background"
          >
            <span className="block text-sm font-medium">Custom section…</span>
            <span className="block text-xs text-muted-foreground">
              Name it whatever your field calls it.
            </span>
          </button>
        </div>
      )}

      <p className="px-1 text-xs text-muted-foreground">
        Drag to reorder, or use the arrows. Hidden sections keep their content — they just
        don&apos;t print.
      </p>
    </div>
  );
}

export function docTypeLabel(key: SectionKey) {
  return SECTION_PRESETS[key].label;
}
