import type {
  AiProvider,
  GenerateStructuredInput,
  GenerateTextInput,
  GenerateTextResult,
} from "../types";
import { AiProviderNotConfiguredError } from "../types";

/**
 * Anthropic (Claude) provider — STUB.
 *
 * Intentionally not implemented yet: this project runs on the mock provider
 * until a real key is supplied. To activate later:
 *   1. `npm install @anthropic-ai/sdk`
 *   2. Set ANTHROPIC_API_KEY in .env.local and AI_PROVIDER=anthropic
 *   3. Replace the throws below with real SDK calls (client.messages.create).
 *      Map GenerateTextInput.{system,messages} to the Messages API, and use
 *      structured outputs / tool use for generateStructured.
 *
 * Everything downstream already talks to the AiProvider interface, so no other
 * file needs to change when this is filled in.
 */
export class AnthropicProvider implements AiProvider {
  readonly name = "anthropic";

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new AiProviderNotConfiguredError("anthropic", "ANTHROPIC_API_KEY");
    }
  }

  async generateText(_input: GenerateTextInput): Promise<GenerateTextResult> {
    throw new Error(
      "AnthropicProvider.generateText is not implemented yet. See src/lib/ai/providers/anthropic.ts.",
    );
  }

  async generateStructured<T>(_input: GenerateStructuredInput): Promise<T> {
    throw new Error(
      "AnthropicProvider.generateStructured is not implemented yet. See src/lib/ai/providers/anthropic.ts.",
    );
  }
}
