import type { GenerateTextInput } from "../types";

export type SalaryContext = {
  role: string;
  location?: string;
  experienceYears?: number;
  currentOffer?: number;
  targetRange?: string;
};

/** Builds the request for a salary-negotiation talking-points script. */
export function buildSalaryScriptPrompt(ctx: SalaryContext): GenerateTextInput {
  const system =
    "You are a salary-negotiation coach. Give a short, confident script plus 3-5 concrete tips. " +
    "Encourage negotiating the whole package, anchoring with market data, and staying collaborative.";

  const parts = [
    `Help me negotiate a salary offer.`,
    `Role: ${ctx.role}`,
    ctx.location ? `Location: ${ctx.location}` : "",
    ctx.experienceYears != null ? `Experience: ${ctx.experienceYears} years` : "",
    ctx.currentOffer != null ? `Current offer: $${ctx.currentOffer}` : "",
    ctx.targetRange ? `My target: ${ctx.targetRange}` : "",
  ].filter(Boolean);

  return {
    system,
    messages: [{ role: "user", content: parts.join("\n") }],
    maxTokens: 600,
    mockHint: "salary_negotiation",
    mockContext: { role: ctx.role, target: ctx.targetRange },
  };
}
