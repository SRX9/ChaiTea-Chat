import { createOpenAI } from "@ai-sdk/openai";

// Returns an OpenAI provider instance configured with the given API key.
export function openaiProvider(apiKey: string) {
  console.log("openaiProvider", apiKey);
  return createOpenAI({
    apiKey,
    compatibility: "strict",
  });
}
