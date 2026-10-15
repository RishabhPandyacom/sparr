"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Borderless inline field that looks like plain document text until you touch
 * it. This is what makes "type directly on the page" work.
 *
 * It is deliberately NOT contentEditable — it's a real input/textarea bound to
 * structured state, so pasted rich text can't smuggle markup into the document
 * and the JSON stays clean enough to export to PDF, DOCX and plain text.
 */

type BaseProps = {
  value: string;
  onChange: (v: string) => void;
  editable?: boolean;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
  /** Shrink the input to the width of its content (dates, locations…). */
  inline?: boolean;
  onFocus?: () => void;
  onEnter?: () => void;
  /** Fired on Backspace in an already-empty field — used to delete bullets. */
  onEmptyBackspace?: () => void;
};

export function EditableText({
  value,
  onChange,
  editable = true,
  placeholder,
  className,
  style,
  ariaLabel,
  inline = false,
  onFocus,
  onEnter,
  onEmptyBackspace,
}: BaseProps & { multiline?: boolean }) {
  if (!editable) {
    return (
      <span className={className} style={style}>
        {value || placeholder}
      </span>
    );
  }
  return (
    <input
      aria-label={ariaLabel}
      value={value}
      placeholder={placeholder}
      onFocus={onFocus}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && onEnter) {
          e.preventDefault();
          onEnter();
        }
        if (e.key === "Backspace" && !value && onEmptyBackspace) {
          e.preventDefault();
          onEmptyBackspace();
        }
      }}
      size={inline ? Math.max(value.length || placeholder?.length || 4, 3) : undefined}
      className={cn(fieldClass, inline ? "w-auto min-w-0" : "w-full", className)}
      style={style}
    />
  );
}

export function EditableArea({
  value,
  onChange,
  editable = true,
  placeholder,
  className,
  style,
  ariaLabel,
  onFocus,
  onEnter,
  onEmptyBackspace,
}: BaseProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-grow so the document never shows a scrollbar mid-page.
  const grow = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };
  useLayoutEffect(grow, [value]);
  useEffect(() => {
    const onResize = () => grow();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!editable) {
    return (
      <span className={className} style={{ whiteSpace: "pre-wrap", ...style }}>
        {value || placeholder}
      </span>
    );
  }

  return (
    <textarea
      ref={ref}
      aria-label={ariaLabel}
      value={value}
      placeholder={placeholder}
      rows={1}
      onFocus={onFocus}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey && onEnter) {
          e.preventDefault();
          onEnter();
        }
        if (e.key === "Backspace" && !value && onEmptyBackspace) {
          e.preventDefault();
          onEmptyBackspace();
        }
      }}
      className={cn(fieldClass, "w-full resize-none overflow-hidden", className)}
      style={style}
    />
  );
}

const fieldClass = cn(
  "rounded-[2px] border-0 bg-transparent p-0 font-[inherit] text-[inherit] leading-[inherit]",
  "tracking-[inherit] text-current outline-none transition-colors",
  "hover:bg-sky-500/[0.07] focus:bg-sky-500/[0.12]",
  "placeholder:text-current/35 print:hover:bg-transparent print:focus:bg-transparent",
);
