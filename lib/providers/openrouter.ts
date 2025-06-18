import { createOpenAI } from "@ai-sdk/openai";

// Utility helper to obtain a pre-configured OpenRouter provider instance.
// If an explicit apiKey is not supplied, it falls back to the OPENROUTER_API_KEY
// environment variable so that the application keeps working with the
// server-side key.
export function openrouterProvider(apiKey?: string) {
  console.log("openrouterProvider", apiKey);
  return createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: apiKey ?? process.env.OPENROUTER_API_KEY,
    compatibility: "strict",
  });
}
