import Link from "next/link";
import {
  Copy,
  FileText,
  FileUp,
  GraduationCap,
  Globe,
  Plus,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { deleteResume, duplicateResume, setPrimaryResume } from "@/lib/resume/actions";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getTemplateDef, TEMPLATES } from "@/lib/resume/design";
import { cn } from "@/lib/utils";

export default async function ResumesPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: resumes } = await supabase
    .from("resumes")
    .select("id, title, is_primary, is_public, doc_type, template_slug, target_role, last_score, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const resumeCount = TEMPLATES.filter((t) => t.family === "resume").length;
  const cvCount = TEMPLATES.length - resumeCount;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Résumés & CVs"
        description={`${resumeCount} résumé styles, ${cvCount} academic CV styles. Generate one from a role, import what you already have, or start from a template.`}
      >
        <Button asChild>
          <Link href="/dashboard/resumes/generate">
            <Sparkles className="size-4" />
            Generate
          </Link>
        </Button>
      </PageHeader>

      {!resumes?.length ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <StartCard
            href="/dashboard/resumes/generate"
            icon={<Sparkles className="size-5" />}
            title="Generate from a role"
            body="Type a job title and get a complete first draft — sections, dated roles, the right skills."
            primary
          />
          <StartCard
            href="/dashboard/resumes/import"
            icon={<FileUp className="size-5" />}
            title="Import what you have"
            body="Paste your current résumé. We rebuild it as a structured document you can restyle instantly."
          />
          <StartCard
            href="/dashboard/resumes/new"
            icon={<FileText className="size-5" />}
            title="Start from a template"
            body={`Browse all ${TEMPLATES.length} styles and build from scratch.`}
          />
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/resumes/new">
                <Plus className="size-4" />
                New from template
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/resumes/import">
                <FileUp className="size-4" />
                Import
              </Link>
            </Button>
          </div>

          <div className="grid gap-3">
            {resumes.map((r) => {
              const def = getTemplateDef(r.template_slug);
              const isCv = r.doc_type === "cv";
              return (
                <Card key={r.id}>
                  <CardContent className="flex flex-wrap items-center gap-4 py-4">
                    <div
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-lg",
                        isCv ? "bg-violet-500/10 text-violet-600" : "bg-primary/10 text-primary",
                      )}
                    >
                      {isCv ? <GraduationCap className="size-5" /> : <FileText className="size-5" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">{r.title}</p>
                        {r.is_primary && (
                          <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        )}
                        {r.is_public && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400"
                            title="Publicly shareable link is live"
                          >
                            <Globe className="size-2.5" />
                            Shared
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {def.name} · {isCv ? "CV" : "Résumé"}
                        {r.target_role ? ` · ${r.target_role}` : ""} · updated{" "}
                        {new Date(r.updated_at).toLocaleDateString()}
                      </p>
                    </div>

                    {r.last_score != null && (
                      <div
                        className="text-right"
                        title="Résumé score from the last save — open the document for the full breakdown."
                      >
                        <p
                          className={cn(
                            "text-lg font-semibold leading-none tabular-nums",
                            r.last_score >= 72
                              ? "text-emerald-600 dark:text-emerald-400"
                              : r.last_score >= 55
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-rose-600 dark:text-rose-400",
                          )}
                        >
                          {r.last_score}
                        </p>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          score
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/resumes/${r.id}/edit`}>Open</Link>
                      </Button>
                      <form action={duplicateResume}>
                        <input type="hidden" name="resumeId" value={r.id} />
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          type="submit"
                          aria-label="Duplicate — tailor a copy for a specific job"
                          title="Duplicate for a specific application"
                        >
                          <Copy className="size-4 text-muted-foreground" />
                        </Button>
                      </form>
                      {!r.is_primary && (
                        <form action={setPrimaryResume}>
                          <input type="hidden" name="resumeId" value={r.id} />
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            type="submit"
                            aria-label="Make primary"
                            title="Make this your primary document"
                          >
                            <Star className="size-4 text-muted-foreground" />
                          </Button>
                        </form>
                      )}
                      <form action={deleteResume}>
                        <input type="hidden" name="resumeId" value={r.id} />
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          type="submit"
                          aria-label="Delete document"
                        >
                          <Trash2 className="size-4 text-muted-foreground" />
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function StartCard({
  href,
  icon,
  title,
  body,
  primary = false,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col gap-2 rounded-xl border p-5 transition-colors",
        primary ? "border-primary bg-primary/5 hover:bg-primary/10" : "hover:border-foreground/25",
      )}
    >
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-lg",
          primary ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        {icon}
      </span>
      <span className="font-medium">{title}</span>
      <span className="text-sm text-muted-foreground">{body}</span>
    </Link>
  );
}
