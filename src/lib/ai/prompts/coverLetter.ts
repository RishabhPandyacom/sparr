import type { GenerateTextInput } from "../types";

export type CoverLetterContext = {
  jobDescription: string;
  companyName?: string;
  role?: string;
  applicantName?: string;
  resumeSummary?: string;
};

/** Builds the request for generating a tailored cover letter. */
export function buildCoverLetterPrompt(
  ctx: CoverLetterContext,
): GenerateTextInput {
  const system =
    "You are an expert career coach who writes concise, specific, and genuine cover letters. " +
    "Avoid clichés and filler. Mirror the language of the job description. Keep it to ~4 short paragraphs.";

  const parts = [
    `Write a cover letter for this job.`,
    ctx.companyName ? `Company: ${ctx.companyName}` : "",
    ctx.role ? `Role: ${ctx.role}` : "",
    ctx.applicantName ? `Applicant name: ${ctx.applicantName}` : "",
    ctx.resumeSummary ? `Candidate background:\n${ctx.resumeSummary}` : "",
    `\nJob description:\n${ctx.jobDescription}`,
  ].filter(Boolean);

  return {
    system,
    messages: [{ role: "user", content: parts.join("\n") }],
    maxTokens: 900,
    mockHint: "cover_letter",
    mockContext: {
      company: ctx.companyName,
      role: ctx.role,
      name: ctx.applicantName,
    },
  };
}
