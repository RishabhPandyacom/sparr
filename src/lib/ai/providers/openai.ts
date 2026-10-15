import type {
  AiProvider,
  GenerateStructuredInput,
  GenerateTextInput,
  GenerateTextResult,
} from "../types";
import { AiProviderNotConfiguredError } from "../types";

/**
 * OpenAI provider — STUB.
 *
 * Not implemented yet. To activate later:
 *   1. `npm install openai`
 *   2. Set OPENAI_API_KEY in .env.local and AI_PROVIDER=openai
 *   3. Replace the throws below with real SDK calls (chat.completions or
 *      responses API). Map GenerateTextInput.{system,messages} accordingly and
 *      use JSON mode / response_format for generateStructured.
 */
export class OpenAiProvider implements AiProvider {
  readonly name = "openai";

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new AiProviderNotConfiguredError("openai", "OPENAI_API_KEY");
    }
  }

  async generateText(_input: GenerateTextInput): Promise<GenerateTextResult> {
    throw new Error(
      "OpenAiProvider.generateText is not implemented yet. See src/lib/ai/providers/openai.ts.",
    );
  }

  async generateStructured<T>(_input: GenerateStructuredInput): Promise<T> {
    throw new Error(
      "OpenAiProvider.generateStructured is not implemented yet. See src/lib/ai/providers/openai.ts.",
    );
  }
}
