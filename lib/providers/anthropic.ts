import { createAnthropic } from "@ai-sdk/anthropic";

// Returns an Anthropic provider instance configured with the supplied key.
export function anthropicProvider(apiKey: string) {
  console.log("anthropicProvider", apiKey);
  return createAnthropic({ apiKey });
}
