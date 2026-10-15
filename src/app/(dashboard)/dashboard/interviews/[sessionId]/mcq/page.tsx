import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { AntiCheatBoundary } from "@/components/interview/anti-cheat-boundary";
import { McqRoom } from "@/components/interview/mcq-room";

export default async function McqInterviewPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("interview_sessions")
    .select("id, status, topic")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();
  if (!session) notFound();
  if (session.status === "completed") {
    redirect(`/dashboard/interviews/${sessionId}/results`);
  }

  const { data: questions } = await supabase
    .from("interview_questions")
    .select("id, prompt, options")
    .eq("session_id", sessionId)
    .order("sequence_number");

  const parsed = (questions ?? []).map((q) => ({
    id: q.id,
    prompt: q.prompt,
    options: (q.options as { key: string; text: string }[]) ?? [],
  }));

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">
        MCQ Round{session.topic ? ` · ${session.topic}` : ""}
      </h1>
      <p className="mb-5 text-muted-foreground">
        Choose the best answer for each question, then submit.
      </p>
      <AntiCheatBoundary>
        <McqRoom sessionId={sessionId} questions={parsed} />
      </AntiCheatBoundary>
    </div>
  );
}
