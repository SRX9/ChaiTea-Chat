import { createGoogleGenerativeAI } from "@ai-sdk/google";

// Returns a Google Generative AI provider instance configured with the given API key.
export function googleProvider(apiKey: string) {
  console.log("googleProvider", apiKey);
  return createGoogleGenerativeAI({ apiKey });
}
