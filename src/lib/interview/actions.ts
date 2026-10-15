"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { getAiProvider } from "@/lib/ai";
import type { AiMessage } from "@/lib/ai/types";
import {
  buildNextQuestionPrompt,
  buildFeedbackPrompt,
  buildMcqPrompt,
  buildCodeReviewPrompt,
  type McqQuestion,
} from "@/lib/ai/prompts/interview";
import { pickCodingChallenge } from "./questionBank";
import { createNotification } from "@/lib/notifications/service";

const CHAT_TURNS = 5;
const MCQ_COUNT = 5;

/** Consumes one interview credit for the user's current period (best-effort). */
async function consumeCredit(userId: string) {
  const supabase = await createClient();
  const { data: usage } = await supabase
    .from("usage_credits")
    .select("id, interviews_used")
    .eq("user_id", userId)
    .order("period_start", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (usage) {
    await supabase
      .from("usage_credits")
      .update({ interviews_used: usage.interviews_used + 1 })
      .eq("id", usage.id);
  }
}

/** Creates an interview session, seeds its first question(s), and opens the room. */
export async function startInterview(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const mode = String(formData.get("mode") ?? "chat") as "chat" | "mcq" | "coding";
  const topic = String(formData.get("topic") ?? "").trim() || null;
  const difficulty = String(formData.get("difficulty") ?? "medium").trim();

  // Usage-credit gate: block when out of interview credits (unless unlimited).
  const { data: usage } = await supabase
    .from("usage_credits")
    .select("interviews_used, interviews_limit")
    .eq("user_id", user.id)
    .order("period_start", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (
    usage &&
    usage.interviews_limit !== -1 &&
    usage.interviews_used >= usage.interviews_limit
  ) {
    redirect("/dashboard/billing?upgrade=1");
  }

  const { data: session, error } = await supabase
    .from("interview_sessions")
    .insert({
      user_id: user.id,
      mode,
      status: "in_progress",
      topic,
      difficulty,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !session) throw new Error(error?.message ?? "Could not start interview");
  const sessionId = session.id;
  const ai = getAiProvider();

  if (mode === "mcq") {
    const { questions } = await ai.generateStructured<{ questions: McqQuestion[] }>(
      buildMcqPrompt({ topic: topic ?? undefined, difficulty }, MCQ_COUNT),
    );
    await supabase.from("interview_questions").insert(
      questions.map((q, i) => ({
        session_id: sessionId,
        sequence_number: i,
        question_type: "mcq",
        prompt: q.prompt,
        options: q.options,
        correct_option_key: q.correct_option_key,
        ai_generated: true,
      })),
    );
    await supabase
      .from("interview_sessions")
      .update({ max_score: questions.length })
      .eq("id", sessionId);
  } else if (mode === "coding") {
    const challenge = pickCodingChallenge();
    await supabase.from("interview_questions").insert({
      session_id: sessionId,
      sequence_number: 0,
      question_type: "coding",
      prompt: `${challenge.title}\n\n${challenge.prompt}`,
      starter_code: challenge.starter.javascript,
      language: "javascript",
      ai_generated: false,
    });
    await supabase
      .from("interview_sessions")
      .update({ max_score: 10 })
      .eq("id", sessionId);
  } else {
    // chat: generate the first question
    const first = await ai.generateText(
      buildNextQuestionPrompt({ topic: topic ?? undefined, difficulty }, []),
    );
    await supabase.from("interview_questions").insert({
      session_id: sessionId,
      sequence_number: 0,
      question_type: "chat",
      prompt: first.content,
      ai_generated: true,
    });
    await supabase
      .from("interview_sessions")
      .update({ max_score: CHAT_TURNS })
      .eq("id", sessionId);
  }

  await consumeCredit(user.id);
  revalidatePath("/dashboard/interviews");
  redirect(`/dashboard/interviews/${sessionId}/${mode}`);
}

/** Chat: records an answer, returns the next AI question (or signals the end). */
export async function answerChat(
  sessionId: string,
  questionId: string,
  answer: string,
): Promise<{
  done: boolean;
  nextPrompt?: string;
  nextQuestionId?: string;
  error?: string;
}> {
  const user = await requireUser();
  const supabase = await createClient();

  // Ownership check.
  const { data: session } = await supabase
    .from("interview_sessions")
    .select("id, topic, difficulty")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();
  if (!session) return { done: false, error: "Session not found" };

  await supabase.from("interview_answers").insert({
    question_id: questionId,
    session_id: sessionId,
    answer_text: answer,
  });

  const { data: questions } = await supabase
    .from("interview_questions")
    .select("id, sequence_number, prompt")
    .eq("session_id", sessionId)
    .order("sequence_number");
  const askedCount = questions?.length ?? 0;

  if (askedCount >= CHAT_TURNS) {
    return { done: true };
  }

  // Build transcript for the follow-up.
  const { data: answers } = await supabase
    .from("interview_answers")
    .select("question_id, answer_text")
    .eq("session_id", sessionId);
  const answerByQ = new Map((answers ?? []).map((a) => [a.question_id, a.answer_text]));
  const transcript: AiMessage[] = [];
  for (const q of questions ?? []) {
    transcript.push({ role: "assistant", content: q.prompt });
    const a = answerByQ.get(q.id);
    if (a) transcript.push({ role: "user", content: a });
  }

  const ai = getAiProvider();
  const next = await ai.generateText(
    buildNextQuestionPrompt(
      { topic: session.topic ?? undefined, difficulty: session.difficulty ?? undefined },
      transcript,
    ),
  );
  const { data: inserted } = await supabase
    .from("interview_questions")
    .insert({
      session_id: sessionId,
      sequence_number: askedCount,
      question_type: "chat",
      prompt: next.content,
      ai_generated: true,
    })
    .select("id")
    .single();

  return {
    done: false,
    nextPrompt: next.content,
    nextQuestionId: inserted?.id,
  };
}

/** Chat: generates end-of-session feedback and completes the session. */
export async function finishChat(sessionId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("interview_sessions")
    .select("id, topic")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();
  if (!session) throw new Error("Session not found");

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

  const transcript: AiMessage[] = [];
  let answered = 0;
  for (const q of questions ?? []) {
    transcript.push({ role: "assistant", content: q.prompt });
    const a = answerByQ.get(q.id);
    if (a) {
      transcript.push({ role: "user", content: a });
      if (a.trim().length > 10) answered += 1;
    }
  }

  const ai = getAiProvider();
  const feedback = await ai.generateText(
    buildFeedbackPrompt({ topic: session.topic ?? undefined }, transcript),
  );

  await supabase
    .from("interview_sessions")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      summary_feedback: feedback.content,
      total_score: answered,
    })
    .eq("id", sessionId);

  await createNotification(user.id, {
    type: "interview",
    title: "Interview feedback ready",
    body: "Your behavioral interview has been scored.",
    link: `/dashboard/interviews/${sessionId}/results`,
  });

  revalidatePath("/dashboard/interviews");
  redirect(`/dashboard/interviews/${sessionId}/results`);
}

/** MCQ: scores selected answers, saves them, completes the session. */
export async function submitMcq(
  sessionId: string,
  selections: Record<string, string>,
) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("interview_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();
  if (!session) throw new Error("Session not found");

  const { data: questions } = await supabase
    .from("interview_questions")
    .select("id, correct_option_key")
    .eq("session_id", sessionId);

  let correct = 0;
  const answerRows = (questions ?? []).map((q) => {
    const selected = selections[q.id] ?? null;
    const isCorrect = selected != null && selected === q.correct_option_key;
    if (isCorrect) correct += 1;
    return {
      question_id: q.id,
      session_id: sessionId,
      selected_option_key: selected,
      is_correct: isCorrect,
      score: isCorrect ? 1 : 0,
    };
  });
  if (answerRows.length) await supabase.from("interview_answers").insert(answerRows);

  await supabase
    .from("interview_sessions")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      total_score: correct,
      max_score: questions?.length ?? 0,
      summary_feedback: `You scored ${correct} out of ${questions?.length ?? 0}.`,
    })
    .eq("id", sessionId);

  await createNotification(user.id, {
    type: "interview",
    title: "MCQ round scored",
    body: `You scored ${correct} / ${questions?.length ?? 0}.`,
    link: `/dashboard/interviews/${sessionId}/results`,
  });

  revalidatePath("/dashboard/interviews");
  redirect(`/dashboard/interviews/${sessionId}/results`);
}

/** Coding: stores the submission, gets an AI review, completes the session. */
export async function submitCode(
  sessionId: string,
  questionId: string,
  code: string,
  language: string,
) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: question } = await supabase
    .from("interview_questions")
    .select("id, prompt, session_id, interview_sessions!inner(user_id)")
    .eq("id", questionId)
    .single();
  const owner = (question?.interview_sessions as { user_id?: string } | null)?.user_id;
  if (!question || owner !== user.id) throw new Error("Question not found");

  const ai = getAiProvider();
  const review = await ai.generateStructured<{
    ai_review: string;
    ai_score: number;
    ai_strengths: string[];
    ai_issues: string[];
  }>(
    buildCodeReviewPrompt({
      language,
      problem: question.prompt,
      code,
    }),
  );

  await supabase.from("coding_submissions").insert({
    question_id: questionId,
    session_id: sessionId,
    code,
    language,
    ai_review: review.ai_review,
    ai_score: review.ai_score,
    ai_strengths: review.ai_strengths,
    ai_issues: review.ai_issues,
  });

  await supabase
    .from("interview_sessions")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      total_score: review.ai_score,
      max_score: 10,
      summary_feedback: review.ai_review,
    })
    .eq("id", sessionId);

  await createNotification(user.id, {
    type: "interview",
    title: "Code review ready",
    body: `Your solution scored ${review.ai_score} / 10.`,
    link: `/dashboard/interviews/${sessionId}/results`,
  });

  revalidatePath("/dashboard/interviews");
  redirect(`/dashboard/interviews/${sessionId}/results`);
}
