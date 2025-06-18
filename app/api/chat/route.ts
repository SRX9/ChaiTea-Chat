import { smoothStream, streamText } from "ai";
import {
  EModelModes,
  supportedModels,
  EInferenceProviders,
} from "@/config/models";
import { decryptString } from "@/lib/crypto-utils";
import { openrouterProvider } from "@/lib/providers/openrouter";
import { openaiProvider } from "@/lib/providers/openai";
import { anthropicProvider } from "@/lib/providers/anthropic";
import { googleProvider } from "@/lib/providers/google";
import { isServerLoggedIn } from "@/lib/auth-server";
import { NextResponse } from "next/server";

export const maxDuration = 30;

// Mapping between inference provider enum values and factory helpers.
const providerFactories: Record<EInferenceProviders, (apiKey?: string) => any> =
  {
    [EInferenceProviders.OPENROUTER]: openrouterProvider,
    [EInferenceProviders.OPENAI]: (key?: string) => openaiProvider(key || ""),
    [EInferenceProviders.ANTHROPIC]: (key?: string) =>
      anthropicProvider(key || ""),
    [EInferenceProviders.GOOGLE]: (key?: string) => googleProvider(key || ""),
    [EInferenceProviders.FALAI]: openrouterProvider,
  };

function resolveModelIdForProvider(
  modelId: string,
  provider: EInferenceProviders
) {
  const model = supportedModels.find((m) => m.id === modelId);
  if (!model) return modelId;

  if (model.inferenceProviders) {
    for (const p of model.inferenceProviders) {
      if (typeof p === "string") continue;
      if (p.provider === provider && p.model_id) {
        return p.model_id;
      }
    }
  }
  return modelId;
}

export async function POST(req: Request) {
  const { isLoggedIn } = await isServerLoggedIn();
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { messages, modelId, mode, provider, api_key } = await req.json();

  // --- Attempt to decrypt user-supplied API key --------------------------------
  let decryptedKey = "";
  try {
    if (api_key && provider) {
      decryptedKey = await decryptString(
        api_key,
        process.env.NEXT_PUBLIC_CHAI_SHIELD || ""
      );
    }
  } catch (err) {
    // Decryption failures will just fall back to server-side keys.
    console.error("[BYOK] Failed to decrypt api key", err);
    decryptedKey = "";
  }

  // --- Determine which provider to use -----------------------------------------
  let selectedProvider: EInferenceProviders = EInferenceProviders.OPENROUTER;

  if (provider && provider !== EInferenceProviders.OPENROUTER && decryptedKey) {
    // Ensure the selected model supports this provider.
    const mdl = supportedModels.find((m) => m.id === modelId);
    const isSupported = mdl?.inferenceProviders?.some((p) => {
      const prov = typeof p === "string" ? p : p.provider;
      return prov === provider;
    });
    if (isSupported) {
      selectedProvider = provider as EInferenceProviders;
    }
  }

  const providerFactory =
    providerFactories[selectedProvider] || openrouterProvider;
  const providerInstance = providerFactory(decryptedKey || undefined);

  // Determine provider-specific model id
  let targetModelId = resolveModelIdForProvider(modelId, selectedProvider);
  if (
    selectedProvider === EInferenceProviders.OPENROUTER &&
    mode === EModelModes.WEB_SEARCH
  ) {
    targetModelId = `${targetModelId}:online`;
  }

  const model = providerInstance(targetModelId);
  // Helper to generate a stream (with given provider instance)
  const generateStream = () =>
    streamText({
      model,
      system: "You are a helpful assistant.",
      messages,
      experimental_transform: smoothStream({
        delayInMs: 10,
        chunking: "word",
      }),
    });

  try {
    const result = generateStream();
    return result.toDataStreamResponse();
  } catch (err) {
    console.error(
      "[BYOK] Primary provider failed, falling back to OpenRouter",
      err
    );
    const fallbackProvider = openrouterProvider();
    let fallbackModelId = resolveModelIdForProvider(
      modelId,
      EInferenceProviders.OPENROUTER
    );
    if (mode === EModelModes.WEB_SEARCH) {
      fallbackModelId += ":online";
    }
    const fallbackModel = fallbackProvider(fallbackModelId);
    const fallbackResult = streamText({
      model: fallbackModel,
      system: "You are a helpful assistant.",
      messages,
      experimental_transform: smoothStream({ delayInMs: 10, chunking: "word" }),
    });
    return fallbackResult.toDataStreamResponse();
  }
}
