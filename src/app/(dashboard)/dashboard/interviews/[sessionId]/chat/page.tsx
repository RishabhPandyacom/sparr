import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { AntiCheatBoundary } from "@/components/interview/anti-cheat-boundary";
import { ChatRoom } from "@/components/interview/chat-room";

type Turn = { role: "ai" | "user"; content: string };

export default async function ChatInterviewPage({
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
    .select("id, prompt, sequence_number")
    .eq("session_id", sessionId)
    .order("sequence_number");
  const { data: answers } = await supabase
    .from("interview_answers")
    .select("question_id, answer_text")
    .eq("session_id", sessionId);
  const answerByQ = new Map((answers ?? []).map((a) => [a.question_id, a.answer_text]));

  const turns: Turn[] = [];
  let currentQuestionId: string | null = null;
  for (const q of questions ?? []) {
    turns.push({ role: "ai", content: q.prompt });
    const a = answerByQ.get(q.id);
    if (a) {
      turns.push({ role: "user", content: a });
    } else {
      currentQuestionId = q.id; // latest unanswered question
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">
        Behavioral Interview{session.topic ? ` · ${session.topic}` : ""}
      </h1>
      <p className="mb-5 text-muted-foreground">
        Answer naturally — the interviewer adapts to your responses.
      </p>
      <AntiCheatBoundary>
        <ChatRoom
          sessionId={sessionId}
          initialTurns={turns}
          initialQuestionId={currentQuestionId}
        />
      </AntiCheatBoundary>
    </div>
  );
}
