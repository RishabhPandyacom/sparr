import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Trophy,
  RotateCcw,
} from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function InterviewResultsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("interview_sessions")
    .select("id, mode, topic, total_score, max_score, summary_feedback, status")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();
  if (!session) notFound();

  const { data: submission } =
    session.mode === "coding"
      ? await supabase
          .from("coding_submissions")
          .select("code, language, ai_strengths, ai_issues")
          .eq("session_id", sessionId)
          .limit(1)
          .maybeSingle()
      : { data: null };

  const total = session.total_score ?? 0;
  const max = session.max_score ?? 0;
  const pct = max > 0 ? Math.round((Number(total) / Number(max)) * 100) : 0;
  const strengths = (submission?.ai_strengths as string[] | null) ?? [];
  const issues = (submission?.ai_issues as string[] | null) ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/dashboard/interviews"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All interviews
      </Link>

      {/* Score header */}
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-8 text-center sm:flex-row sm:text-left">
          <div className="relative flex size-24 shrink-0 items-center justify-center">
            <svg className="size-24 -rotate-90">
              <circle cx="48" cy="48" r="40" className="fill-none stroke-muted" strokeWidth="8" />
              <circle
                cx="48"
                cy="48"
                r="40"
                className="fill-none stroke-primary"
                strokeWidth="8"
                strokeDasharray={`${(pct / 100) * 251} 251`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-xl font-bold">{pct}%</span>
          </div>
          <div className="flex-1">
            <div className="mb-1 inline-flex items-center gap-2">
              <Trophy className="size-5 text-amber-500" />
              <h1 className="text-xl font-semibold">Interview complete</h1>
            </div>
            <p className="text-muted-foreground">
              {session.mode.toUpperCase()} round
              {session.topic ? ` · ${session.topic}` : ""} — scored{" "}
              <span className="font-medium text-foreground">
                {String(total)} / {String(max)}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Feedback */}
      {session.summary_feedback && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {session.summary_feedback}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Coding strengths / issues */}
      {session.mode === "coding" && (strengths.length > 0 || issues.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="size-4 text-emerald-500" /> Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {strengths.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="size-4 text-amber-500" /> To improve
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {issues.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Submitted code */}
      {submission?.code && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your submission</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-lg bg-neutral-900 p-4 text-xs text-neutral-100">
              <code>{submission.code}</code>
            </pre>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center">
        <Button asChild>
          <Link href="/dashboard/interviews/new">
            <RotateCcw className="size-4" />
            Practice again
          </Link>
        </Button>
      </div>
    </div>
  );
}
