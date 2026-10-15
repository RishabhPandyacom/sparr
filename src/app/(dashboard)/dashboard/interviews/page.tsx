import Link from "next/link";
import {
  MessageSquare,
  ListChecks,
  Code2,
  Plus,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const modeMeta = {
  chat: { icon: MessageSquare, label: "Chat" },
  mcq: { icon: ListChecks, label: "MCQ" },
  coding: { icon: Code2, label: "Coding" },
} as const;

export default async function InterviewsPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: sessions } = await supabase
    .from("interview_sessions")
    .select("id, mode, status, topic, total_score, max_score, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Mock Interviews"
        description="Practice chat, MCQ and live coding rounds with a scored rubric."
      >
        <Button asChild>
          <Link href="/dashboard/interviews/new">
            <Plus className="size-4" />
            Start new
          </Link>
        </Button>
      </PageHeader>

      {!sessions?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <MessageSquare className="size-6 text-muted-foreground" />
            </div>
            <p className="font-medium">No interviews yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Start your first mock interview and get instant feedback.
            </p>
            <Button asChild className="mt-2">
              <Link href="/dashboard/interviews/new">
                <Plus className="size-4" />
                Start new
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {sessions.map((s) => {
            const meta = modeMeta[s.mode as keyof typeof modeMeta] ?? modeMeta.chat;
            const done = s.status === "completed";
            const href = done
              ? `/dashboard/interviews/${s.id}/results`
              : `/dashboard/interviews/${s.id}/${s.mode}`;
            return (
              <Card key={s.id}>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <meta.icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {meta.label} interview
                        {s.topic ? ` · ${s.topic}` : ""}
                      </p>
                      {done ? (
                        <Badge variant="secondary" className="gap-1 text-[10px]">
                          <CheckCircle2 className="size-3" /> Completed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-[10px]">
                          <Clock className="size-3" /> In progress
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {done && s.max_score
                        ? `Score: ${s.total_score ?? 0} / ${s.max_score} · `
                        : ""}
                      {new Date(s.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={href}>{done ? "View results" : "Resume"}</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
