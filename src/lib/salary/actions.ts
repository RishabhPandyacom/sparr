"use server";

import { requireUser } from "@/lib/auth/guards";
import { getAiProvider } from "@/lib/ai";
import { buildSalaryScriptPrompt } from "@/lib/ai/prompts/salaryNegotiation";

/** Generates an AI negotiation script/talking points for the given context. */
export async function generateSalaryScript(input: {
  role: string;
  location?: string;
  experienceYears?: number;
  currentOffer?: number;
  targetRange?: string;
}): Promise<{ script?: string; error?: string }> {
  await requireUser();
  try {
    const ai = getAiProvider();
    const result = await ai.generateText(buildSalaryScriptPrompt(input));
    return { script: result.content };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to generate script" };
  }
}
