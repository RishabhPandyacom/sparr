"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Layers,
  LayoutTemplate,
  Loader2,
  Minus,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Redo2,
  Ruler,
  Undo2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ResumeDocument } from "@/components/resume/doc/document";
import { TemplateGallery } from "@/components/resume/template-gallery";
import { analyzeResume } from "@/lib/resume/analysis";
import { getTemplateDef, type TemplateDef } from "@/lib/resume/design";
import * as m from "@/lib/resume/mutations";
import { saveResume, setTemplate } from "@/lib/resume/actions";
import type { ResumeContent } from "@/lib/resume/schema";
import { SectionsPanel } from "./sections-panel";
import { DesignPanel } from "./design-panel";
import { ScorePanel } from "./score-panel";
import { TailorPanel } from "./tailor-panel";
import { AssistPanel } from "./assist-panel";
import { HistoryPanel } from "./history-panel";
import { ExportMenu } from "./export-menu";
import { ShareButton } from "./share-button";

type SaveState = "idle" | "saving" | "saved" | "error";
type LeftTab = "sections" | "design";
type RightTab = "score" | "tailor" | "assist" | "history";

const MAX_HISTORY = 80;
/** Edits closer together than this collapse into one undo step. */
const COALESCE_MS = 700;

export function ResumeStudio({
  resumeId,
  initialContent,
  initialTitle,
  templateSlug,
  shareSlug,
  isPublic,
}: {
  resumeId: string;
  initialContent: ResumeContent;
  initialTitle: string;
  templateSlug: string;
  shareSlug: string | null;
  isPublic: boolean;
}) {
  const [content, setContent] = useState(initialContent);
  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(templateSlug);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [jobDescription, setJobDescription] = useState("");
  const [leftTab, setLeftTab] = useState<LeftTab>("sections");
  const [rightTab, setRightTab] = useState<RightTab>("score");
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [guides, setGuides] = useState(true);
  const [browsing, setBrowsing] = useState(false);
  const [, startTransition] = useTransition();

  // Undo/redo over whole-document snapshots. Simple, exact, and cheap for a
  // document this size — far more reliable than diffing. Held in state rather
  // than refs so the toolbar buttons disable themselves correctly.
  const [past, setPast] = useState<ResumeContent[]>([]);
  const [future, setFuture] = useState<ResumeContent[]>([]);
  const lastPush = useRef(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const analysis = useMemo(
    () => analyzeResume(content, jobDescription || undefined),
    [content, jobDescription],
  );

  const persist = useCallback(
    (next: ResumeContent, nextTitle: string) => {
      setSaveState("saving");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        const res = await saveResume(resumeId, next, nextTitle);
        if (res.error) {
          setSaveState("error");
          toast.error("Couldn't save", { description: res.error });
        } else {
          setSaveState("saved");
          setTimeout(() => setSaveState((s) => (s === "saved" ? "idle" : s)), 1600);
        }
      }, 900);
    },
    [resumeId],
  );

  const apply = useCallback(
    (next: ResumeContent) => {
      const now = Date.now();
      // Keystrokes inside one burst collapse into a single undo step, so ⌘Z
      // rewinds a thought rather than a character.
      const startsNewStep = now - lastPush.current >= COALESCE_MS;
      if (startsNewStep) {
        lastPush.current = now;
        setPast((p) => [...p, content].slice(-MAX_HISTORY));
      }
      setFuture([]);
      setContent(next);
      persist(next, title);
    },
    [content, persist, title],
  );

  const undo = useCallback(() => {
    setPast((p) => {
      const prev = p[p.length - 1];
      if (!prev) return p;
      setFuture((f) => [content, ...f].slice(0, MAX_HISTORY));
      setContent(prev);
      persist(prev, title);
      lastPush.current = 0;
      return p.slice(0, -1);
    });
  }, [content, persist, title]);

  const redo = useCallback(() => {
    setFuture((f) => {
      const [next, ...rest] = f;
      if (!next) return f;
      setPast((p) => [...p, content].slice(-MAX_HISTORY));
      setContent(next);
      persist(next, title);
      lastPush.current = 0;
      return rest;
    });
  }, [content, persist, title]);

  function handleTitle(next: string) {
    setTitle(next);
    persist(content, next);
  }

  function switchTemplate(def: TemplateDef) {
    const next = m.applyTemplateTheme(content, def.theme, true);
    setPast((p) => [...p, content].slice(-MAX_HISTORY));
    setContent(next);
    setSlug(def.slug);
    setBrowsing(false);
    setSaveState("saving");
    startTransition(async () => {
      const res = await setTemplate(resumeId, def.slug, next);
      setSaveState(res.error ? "error" : "saved");
      if (res.error) toast.error("Couldn't switch template", { description: res.error });
      else
        toast.success(`Switched to ${def.name}`, {
          description: "Your content is untouched — only the design changed.",
        });
    });
  }

  function jumpToSection(sectionId: string) {
    const el = canvasRef.current?.querySelector(`[data-section-id="${sectionId}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    (el as HTMLElement | null)?.animate?.(
      [{ outline: "2px solid rgba(56,189,248,0.9)" }, { outline: "2px solid transparent" }],
      { duration: 1400 },
    );
  }

  // Keyboard shortcuts.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (key === "s") {
        e.preventDefault();
        persist(content, title);
        toast.success("Saved");
      } else if (key === "\\") {
        e.preventDefault();
        setLeftOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, persist, content, title]);

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    [],
  );

  const def = getTemplateDef(slug);

  return (
    <div className="flex h-full flex-col bg-muted/40">
      <style>{printStyles}</style>

      {/* Toolbar */}
      <header className="z-20 flex shrink-0 flex-wrap items-center gap-2 border-b bg-background px-3 py-2 print:hidden">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/resumes">
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Documents</span>
          </Link>
        </Button>

        <Input
          value={title}
          onChange={(e) => handleTitle(e.target.value)}
          className="h-8 w-40 sm:w-56"
          aria-label="Document title"
        />

        <span className="flex w-20 items-center gap-1 text-xs text-muted-foreground">
          {saveState === "saving" && (
            <>
              <Loader2 className="size-3.5 animate-spin" /> Saving
            </>
          )}
          {saveState === "saved" && (
            <>
              <Check className="size-3.5 text-emerald-500" /> Saved
            </>
          )}
          {saveState === "error" && <span className="text-destructive">Not saved</span>}
        </span>

        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Undo"
            title="Undo (⌘Z)"
            onClick={undo}
            disabled={!past.length}
          >
            <Undo2 className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Redo"
            title="Redo (⇧⌘Z)"
            onClick={redo}
            disabled={!future.length}
          >
            <Redo2 className="size-4" />
          </Button>
        </div>

        <Button
          variant={browsing ? "secondary" : "outline"}
          size="sm"
          onClick={() => setBrowsing((v) => !v)}
        >
          <LayoutTemplate className="size-4" />
          <span className="hidden md:inline">{def.name}</span>
        </Button>

        <div className="ml-auto flex items-center gap-1.5">
          <div className="hidden items-center gap-0.5 rounded-lg border px-1 lg:flex">
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Zoom out"
              onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))}
            >
              <Minus className="size-3" />
            </Button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              className="w-11 text-center text-xs tabular-nums text-muted-foreground hover:text-foreground"
              title="Reset zoom"
            >
              {Math.round(zoom * 100)}%
            </button>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Zoom in"
              onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.1).toFixed(2)))}
            >
              <Plus className="size-3" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Toggle page break guides"
            title="Page break guides"
            onClick={() => setGuides((v) => !v)}
            className={cn(guides && "text-primary")}
          >
            <Ruler className="size-4" />
          </Button>

          <ShareButton resumeId={resumeId} initialSlug={shareSlug} initialPublic={isPublic} />
          <ExportMenu content={content} title={title} />
        </div>
      </header>

      {/* Template browser */}
      {browsing && (
        <div className="z-10 max-h-[60vh] shrink-0 overflow-y-auto border-b bg-background p-4 print:hidden">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Templates</h2>
              <p className="text-sm text-muted-foreground">
                Switching keeps every word — only the design changes.
              </p>
            </div>
            <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={() => setBrowsing(false)}>
              <X className="size-4" />
            </Button>
          </div>
          <TemplateGallery
            compact
            activeSlug={slug}
            onPick={switchTemplate}
            initialFamily={content.docType}
          />
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* Left rail */}
        <aside
          className={cn(
            "flex shrink-0 flex-col border-r bg-background transition-[width] print:hidden",
            leftOpen ? "w-[19rem]" : "w-11",
          )}
        >
          <div className="flex items-center gap-1 border-b p-1.5">
            {leftOpen && (
              <div className="flex flex-1 gap-0.5">
                <RailTab active={leftTab === "sections"} onClick={() => setLeftTab("sections")}>
                  Sections
                </RailTab>
                <RailTab active={leftTab === "design"} onClick={() => setLeftTab("design")}>
                  Design
                </RailTab>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={leftOpen ? "Collapse panel" : "Expand panel"}
              title="Toggle panel (⌘\\)"
              onClick={() => setLeftOpen((v) => !v)}
            >
              {leftOpen ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
            </Button>
          </div>

          {leftOpen && (
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {leftTab === "sections" ? (
                <SectionsPanel content={content} onChange={apply} onFocusSection={jumpToSection} />
              ) : (
                <DesignPanel content={content} onChange={apply} />
              )}
            </div>
          )}
        </aside>

        {/* Canvas */}
        <main
          ref={canvasRef}
          className="min-w-0 flex-1 overflow-auto p-4 sm:p-8 print:overflow-visible print:p-0"
        >
          <div
            className="mx-auto w-fit rounded-lg shadow-xl ring-1 ring-black/10 print:rounded-none print:shadow-none print:ring-0"
            style={{ zoom }}
            data-resume-canvas
          >
            <ResumeDocument
              content={content}
              editable
              onChange={apply}
              showPageGuides={guides}
              onFocusSection={() => {}}
            />
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground print:hidden">
            Click any text to edit it. Enter adds a bullet, Backspace on an empty one removes it.
          </p>
        </main>

        {/* Right rail */}
        <aside
          className={cn(
            "flex shrink-0 flex-col border-l bg-background transition-[width] print:hidden",
            rightOpen ? "w-[22rem]" : "w-11",
          )}
        >
          <div className="flex items-center gap-1 border-b p-1.5">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={rightOpen ? "Collapse panel" : "Expand panel"}
              onClick={() => setRightOpen((v) => !v)}
            >
              {rightOpen ? (
                <PanelRightClose className="size-4" />
              ) : (
                <PanelRightOpen className="size-4" />
              )}
            </Button>
            {rightOpen && (
              <div className="flex flex-1 gap-0.5">
                <RailTab active={rightTab === "score"} onClick={() => setRightTab("score")}>
                  Score
                  <span
                    className={cn(
                      "ml-1 rounded px-1 text-[10px] tabular-nums",
                      analysis.score >= 72
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : analysis.score >= 55
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : "bg-rose-500/15 text-rose-600 dark:text-rose-400",
                    )}
                  >
                    {analysis.score}
                  </span>
                </RailTab>
                <RailTab active={rightTab === "tailor"} onClick={() => setRightTab("tailor")}>
                  Tailor
                </RailTab>
                <RailTab active={rightTab === "assist"} onClick={() => setRightTab("assist")}>
                  Write
                </RailTab>
                <RailTab active={rightTab === "history"} onClick={() => setRightTab("history")}>
                  <Layers className="size-3.5" />
                </RailTab>
              </div>
            )}
          </div>

          {rightOpen && (
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {rightTab === "score" && <ScorePanel analysis={analysis} onJump={jumpToSection} />}
              {rightTab === "tailor" && (
                <TailorPanel
                  content={content}
                  onChange={apply}
                  jobDescription={jobDescription}
                  onJobDescriptionChange={setJobDescription}
                />
              )}
              {rightTab === "assist" && (
                <AssistPanel content={content} onChange={apply} jobDescription={jobDescription} />
              )}
              {rightTab === "history" && (
                <HistoryPanel
                  resumeId={resumeId}
                  content={content}
                  title={title}
                  onRestore={(c, t) => {
                    setPast((p) => [...p, content].slice(-MAX_HISTORY));
                    setContent(c);
                    setTitle(t);
                  }}
                />
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function RailTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
        active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/**
 * Printing hides every piece of app chrome and drops the page to natural size,
 * so ⌘P produces the document rather than a screenshot of the editor.
 */
const printStyles = `
@media print {
  html, body { background: #fff !important; }
  [data-resume-canvas] { zoom: 1 !important; margin: 0 !important; width: auto !important; }
  [data-resume-page] { box-shadow: none !important; }
  @page { margin: 0; }
}
`;
