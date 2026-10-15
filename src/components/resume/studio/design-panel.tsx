"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import * as m from "@/lib/resume/mutations";
import {
  ACCENT_SWATCHES,
  FONT_LABELS,
  type BulletStyle,
  type Density,
  type FontKey,
  type HeaderStyle,
  type HeadingStyle,
  type LayoutKind,
  type MarginSize,
  type PageSize,
  type ResumeTheme,
} from "@/lib/resume/design";
import type { ResumeContent } from "@/lib/resume/schema";

/**
 * Every design token, exposed. Templates are starting points — once you're in
 * the document you can change the layout, the type, the density and the colour
 * without losing a word of content.
 */
export function DesignPanel({
  content,
  onChange,
}: {
  content: ResumeContent;
  onChange: (c: ResumeContent) => void;
}) {
  const t = content.theme;
  const set = (patch: Partial<ResumeTheme>) => onChange(m.setTheme(content, patch));

  return (
    <div className="space-y-5">
      <Group label="Accent colour">
        <div className="flex flex-wrap gap-1.5">
          {ACCENT_SWATCHES.map((s) => (
            <button
              key={s.value}
              type="button"
              title={s.name}
              aria-label={s.name}
              onClick={() => set({ accent: s.value, accent2: s.value })}
              className={cn(
                "flex size-7 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition-transform hover:scale-110",
                t.accent.toLowerCase() === s.value.toLowerCase() && "ring-2 ring-foreground",
              )}
              style={{ background: s.value }}
            >
              {t.accent.toLowerCase() === s.value.toLowerCase() && (
                <Check className="size-3.5 text-white drop-shadow" />
              )}
            </button>
          ))}
          <label
            className="flex size-7 cursor-pointer items-center justify-center rounded-full border border-dashed text-[9px] text-muted-foreground hover:border-foreground/40"
            title="Custom colour"
          >
            <input
              type="color"
              value={t.accent}
              onChange={(e) => set({ accent: e.target.value, accent2: e.target.value })}
              className="sr-only"
              aria-label="Custom accent colour"
            />
            +
          </label>
        </div>
        <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={t.accent2.toLowerCase() !== t.accent.toLowerCase()}
            onChange={(e) =>
              set({ accent2: e.target.checked ? lighten(t.accent) : t.accent })
            }
            className="size-3.5 accent-current"
          />
          Gradient headers
        </label>
      </Group>

      <Group label="Layout">
        <Choice<LayoutKind>
          value={t.layout}
          onChange={(layout) => set({ layout })}
          options={[
            ["single", "Single column"],
            ["sidebar-left", "Sidebar left"],
            ["sidebar-right", "Sidebar right"],
            ["banner", "Banner header"],
            ["two-col-body", "Two-column body"],
            ["timeline", "Timeline"],
            ["editorial", "Editorial"],
            ["academic", "Academic"],
          ]}
        />
      </Group>

      <Group label="Header style">
        <Choice<HeaderStyle>
          value={t.headerStyle}
          onChange={(headerStyle) => set({ headerStyle })}
          options={[
            ["stack", "Stacked"],
            ["centered", "Centred"],
            ["split", "Split"],
            ["banner", "Full banner"],
            ["band", "Colour band"],
            ["monogram", "Monogram"],
            ["boxed", "Boxed"],
            ["display", "Display"],
          ]}
        />
      </Group>

      <Group label="Section headings">
        <Choice<HeadingStyle>
          value={t.headingStyle}
          onChange={(headingStyle) => set({ headingStyle })}
          options={[
            ["rule", "Accent rule"],
            ["underline", "Hairline"],
            ["plain", "Plain"],
            ["block", "Filled chip"],
            ["sideRule", "Side bar"],
            ["dot", "Leading dot"],
            ["numbered", "Numbered"],
            ["bracket", "[ Bracketed ]"],
            ["hash", "# Hash"],
            ["smallcaps", "Letterspaced"],
          ]}
        />
        <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={t.uppercaseHeadings}
            onChange={(e) => set({ uppercaseHeadings: e.target.checked })}
            className="size-3.5 accent-current"
          />
          Uppercase headings
        </label>
      </Group>

      <Group label="Typeface">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Body">
            <Native
              value={t.font}
              onChange={(v) => set({ font: v as FontKey })}
              options={Object.entries(FONT_LABELS)}
            />
          </Field>
          <Field label="Headings">
            <Native
              value={t.headingFont}
              onChange={(v) => set({ headingFont: v as FontKey })}
              options={Object.entries(FONT_LABELS)}
            />
          </Field>
        </div>
      </Group>

      <Group label="Type size & rhythm">
        <Slider
          label="Text size"
          value={t.fontScale}
          min={0.82}
          max={1.18}
          step={0.02}
          format={(v) => `${(v * 10).toFixed(1)}pt`}
          onChange={(fontScale) => set({ fontScale })}
        />
        <Slider
          label="Line height"
          value={t.lineHeight}
          min={1.2}
          max={1.75}
          step={0.05}
          format={(v) => v.toFixed(2)}
          onChange={(lineHeight) => set({ lineHeight })}
        />
        <Slider
          label="Name size"
          value={t.nameScale}
          min={0.7}
          max={1.9}
          step={0.05}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={(nameScale) => set({ nameScale })}
        />
        <Slider
          label="Heading tracking"
          value={t.tracking}
          min={0}
          max={0.32}
          step={0.02}
          format={(v) => `${v.toFixed(2)}em`}
          onChange={(tracking) => set({ tracking })}
        />
      </Group>

      <Group label="Spacing">
        <Field label="Density">
          <Choice<Density>
            value={t.density}
            onChange={(density) => set({ density })}
            options={[
              ["compact", "Compact"],
              ["cozy", "Cozy"],
              ["airy", "Airy"],
            ]}
          />
        </Field>
        <Field label="Margins">
          <Choice<MarginSize>
            value={t.margin}
            onChange={(margin) => set({ margin })}
            options={[
              ["narrow", "Narrow"],
              ["normal", "Normal"],
              ["wide", "Wide"],
            ]}
          />
        </Field>
      </Group>

      <Group label="Page">
        <Choice<PageSize>
          value={t.pageSize}
          onChange={(pageSize) => set({ pageSize })}
          options={[
            ["LETTER", "US Letter"],
            ["A4", "A4"],
          ]}
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          A4 outside the US and Canada. This changes the real page geometry, not just the
          preview.
        </p>
      </Group>

      <Group label="Bullets">
        <Choice<BulletStyle>
          value={t.bulletStyle}
          onChange={(bulletStyle) => set({ bulletStyle })}
          options={[
            ["disc", "•"],
            ["dash", "–"],
            ["square", "▪"],
            ["arrow", "→"],
            ["chevron", "›"],
            ["none", "None"],
          ]}
        />
      </Group>

      <Group label="Details">
        <Toggle
          checked={t.chipSkills}
          onChange={(chipSkills) => set({ chipSkills })}
          label="Skills as chips"
          hint="Off is more ATS-legible; on looks better."
        />
        <Toggle
          checked={t.entryRule}
          onChange={(entryRule) => set({ entryRule })}
          label="Hairline between entries"
        />
        <Toggle
          checked={t.showPhoto}
          onChange={(showPhoto) => set({ showPhoto })}
          label="Show a photo"
          hint="Standard in much of Europe, Latin America and Asia — routinely a disqualifier in the US, UK and Canada."
        />
        {(t.layout === "sidebar-left" || t.layout === "sidebar-right") && (
          <>
            <Slider
              label="Sidebar width"
              value={t.sidebarWidth}
              min={0.24}
              max={0.42}
              step={0.01}
              format={(v) => `${Math.round(v * 100)}%`}
              onChange={(sidebarWidth) => set({ sidebarWidth })}
            />
            <Field label="Sidebar fill">
              <Choice
                value={t.sidebarStyle}
                onChange={(sidebarStyle) => set({ sidebarStyle })}
                options={[
                  ["solid", "Solid"],
                  ["tint", "Tinted"],
                  ["outline", "Outlined"],
                  ["plain", "None"],
                ]}
              />
            </Field>
          </>
        )}
      </Group>
    </div>
  );
}

// ── controls ────────────────────────────────────────────────────────────────

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </h4>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Choice<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: [T, string][];
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            "rounded-md border px-2 py-1 text-xs transition-colors",
            value === v
              ? "border-primary bg-primary text-primary-foreground"
              : "text-muted-foreground hover:border-foreground/30 hover:text-foreground",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Native({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 w-full rounded-md border bg-background px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      {options.map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
        {label}
        <span className="tabular-nums text-foreground/70">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-3.5 shrink-0 accent-current"
      />
      <span>
        <span className="block text-sm">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );
}

/** Nudges a hex toward a lighter, hue-shifted partner for gradient headers. */
function lighten(hex: string): string {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, ((n >> 16) & 255) + 60);
  const g = Math.min(255, ((n >> 8) & 255) + 40);
  const b = Math.min(255, (n & 255) + 70);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
