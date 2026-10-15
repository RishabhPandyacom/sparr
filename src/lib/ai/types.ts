/**
 * Provider-agnostic AI interface. Every AI feature (cover letters, interview
 * questions/feedback, code review, salary talking points) talks to this
 * interface via `getAiProvider()` — never to a vendor SDK directly. That keeps
 * the whole app demoable against the mock provider today, and lets a real
 * Anthropic/OpenAI backend be dropped in later behind the same contract.
 */

export type AiMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type GenerateTextInput = {
  /** System prompt / persona. */
  system?: string;
  /** Conversation turns. */
  messages: AiMessage[];
  maxTokens?: number;
  temperature?: number;
  /**
   * Optional routing hint used ONLY by the mock provider to pick a realistic
   * canned response (e.g. "cover_letter", "interview_feedback"). Real providers
   * ignore it.
   */
  mockHint?: string;
  /** Free-form structured context the mock provider can template into output. */
  mockContext?: Record<string, string | undefined>;
};

export type GenerateTextResult = {
  content: string;
  /** Which provider/model actually produced this (for auditing). */
  provider: string;
  model: string;
};

export type GenerateStructuredInput = GenerateTextInput & {
  /**
   * JSON schema (as a plain object) describing the desired output shape. The
   * mock provider ignores this and returns a caller-supplied fallback; real
   * providers use it to constrain output.
   */
  schema: Record<string, unknown>;
};

export interface AiProvider {
  readonly name: string;
  generateText(input: GenerateTextInput): Promise<GenerateTextResult>;
  /**
   * Returns parsed JSON matching the requested schema. Implementations should
   * throw if the model output can't be parsed.
   */
  generateStructured<T>(input: GenerateStructuredInput): Promise<T>;
}

/** Thrown when a provider is selected but not configured (e.g. missing key). */
export class AiProviderNotConfiguredError extends Error {
  constructor(provider: string, missing: string) {
    super(
      `AI provider "${provider}" is selected but ${missing} is not set. ` +
        `Set it in .env.local, or use AI_PROVIDER=mock to run without a key.`,
    );
    this.name = "AiProviderNotConfiguredError";
  }
}
