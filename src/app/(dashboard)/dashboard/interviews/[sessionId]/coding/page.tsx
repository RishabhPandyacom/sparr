import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { AntiCheatBoundary } from "@/components/interview/anti-cheat-boundary";
import { CodingRoom } from "@/components/interview/coding-room";

export default async function CodingInterviewPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("interview_sessions")
    .select("id, status")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();
  if (!session) notFound();
  if (session.status === "completed") {
    redirect(`/dashboard/interviews/${sessionId}/results`);
  }

  const { data: question } = await supabase
    .from("interview_questions")
    .select("id, prompt, starter_code, language")
    .eq("session_id", sessionId)
    .order("sequence_number")
    .limit(1)
    .single();
  if (!question) notFound();

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Coding Challenge</h1>
      <p className="mb-5 text-muted-foreground">
        Write your solution in the editor, then submit for an AI review.
      </p>
      <AntiCheatBoundary>
        <CodingRoom
          sessionId={sessionId}
          questionId={question.id}
          prompt={question.prompt}
          starterCode={question.starter_code ?? ""}
          language={question.language ?? "javascript"}
        />
      </AntiCheatBoundary>
    </div>
  );
}
