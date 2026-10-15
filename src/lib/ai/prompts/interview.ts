import type { AiMessage, GenerateStructuredInput, GenerateTextInput } from "../types";

export type InterviewContext = {
  topic?: string;
  difficulty?: string;
  role?: string;
};

/** Next conversational interview question, given the transcript so far. */
export function buildNextQuestionPrompt(
  ctx: InterviewContext,
  transcript: AiMessage[],
): GenerateTextInput {
  const system =
    `You are a warm but rigorous interviewer conducting a ${ctx.difficulty ?? "mid-level"} ` +
    `mock interview${ctx.topic ? ` on ${ctx.topic}` : ""}. Ask ONE focused question at a time. ` +
    "React briefly to the candidate's previous answer, then ask a natural follow-up. " +
    "Do not give feedback yet — save that for the end.";

  return {
    system,
    messages: transcript.length
      ? transcript
      : [{ role: "user", content: "Let's begin the interview." }],
    maxTokens: 300,
    mockHint: "interview_question",
    mockContext: { topic: ctx.topic },
  };
}

/** End-of-session feedback and scoring over the full transcript. */
export function buildFeedbackPrompt(
  ctx: InterviewContext,
  transcript: AiMessage[],
): GenerateTextInput {
  const system =
    "You are an expert interview coach. Review the transcript and give honest, actionable feedback: " +
    "strengths, areas to improve, and an overall assessment. Be specific and kind.";

  const convo = transcript
    .map((m) => `${m.role === "assistant" ? "Interviewer" : "Candidate"}: ${m.content}`)
    .join("\n");

  return {
    system,
    messages: [
      { role: "user", content: `Transcript:\n${convo}\n\nGive final feedback.` },
    ],
    maxTokens: 700,
    mockHint: "interview_feedback",
    mockContext: { topic: ctx.topic },
  };
}

export type McqQuestion = {
  prompt: string;
  options: { key: string; text: string }[];
  correct_option_key: string;
};

/** Generates a set of MCQ questions. Returns { questions: McqQuestion[] }. */
export function buildMcqPrompt(
  ctx: InterviewContext,
  count = 5,
): GenerateStructuredInput {
  const system =
    "You write high-quality multiple-choice interview questions with exactly one correct answer each.";

  return {
    system,
    messages: [
      {
        role: "user",
        content: `Generate ${count} ${ctx.difficulty ?? "medium"} multiple-choice questions${
          ctx.topic ? ` about ${ctx.topic}` : ""
        }. Each has 4 options (keys a-d) and one correct key.`,
      },
    ],
    schema: {
      type: "object",
      properties: {
        questions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              prompt: { type: "string" },
              options: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    key: { type: "string" },
                    text: { type: "string" },
                  },
                },
              },
              correct_option_key: { type: "string" },
            },
          },
        },
      },
    },
    mockHint: "mcq_questions",
    mockContext: { topic: ctx.topic },
  };
}

export type CodeReview = {
  ai_review: string;
  ai_score: number;
  ai_strengths: string[];
  ai_issues: string[];
};

/** Reviews a code submission (AI-review-only; no execution). */
export function buildCodeReviewPrompt(args: {
  language: string;
  problem: string;
  code: string;
}): GenerateStructuredInput {
  const system =
    "You are a senior engineer reviewing an interview coding submission. Judge correctness, " +
    "clarity, and edge-case handling. Do not run the code — reason about it.";

  return {
    system,
    messages: [
      {
        role: "user",
        content: `Problem:\n${args.problem}\n\nLanguage: ${args.language}\n\nSubmission:\n${args.code}`,
      },
    ],
    schema: {
      type: "object",
      properties: {
        ai_review: { type: "string" },
        ai_score: { type: "number" },
        ai_strengths: { type: "array", items: { type: "string" } },
        ai_issues: { type: "array", items: { type: "string" } },
      },
    },
    mockHint: "code_review",
  };
}
