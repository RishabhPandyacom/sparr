import "server-only";
import type { AiProvider } from "./types";
import { MockAiProvider } from "./providers/mock";
import { AnthropicProvider } from "./providers/anthropic";
import { OpenAiProvider } from "./providers/openai";

let cached: AiProvider | null = null;

/**
 * Returns the configured AI provider. Reads AI_PROVIDER (mock | anthropic |
 * openai); defaults to `mock` so the app works with no API key. Server-only —
 * never import this into client components (keeps keys off the client).
 */
export function getAiProvider(): AiProvider {
  if (cached) return cached;

  const which = (process.env.AI_PROVIDER ?? "mock").toLowerCase();
  switch (which) {
    case "anthropic":
      cached = new AnthropicProvider();
      break;
    case "openai":
      cached = new OpenAiProvider();
      break;
    case "mock":
    default:
      cached = new MockAiProvider();
      break;
  }
  return cached;
}

export type { AiProvider } from "./types";
