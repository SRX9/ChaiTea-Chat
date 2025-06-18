import {
  EInferenceProviders,
  supportedModels,
  EModelOwner,
} from "@/config/models";

/**
 * Returns the localStorage key used to persist BYOK credentials for a given user.
 * Keeping this logic in a single place avoids accidental drift across the code-base.
 */
export function getByokStorageKey(userId: string): string {
  return `${userId}_brok`;
}

/**
 * Attempt to derive the inference provider for a given model id.
 * The current convention is `<provider>/<model>` (e.g. `openai/gpt-4o`).
 * If the prefix does not match one of the supported BYOK providers the
 * function will return `null` so that callers can safely ignore it.
 */
export function getProviderFromModelId(
  modelId: string
): EInferenceProviders | null {
  // First attempt: lookup in our supportedModels catalog to keep a single
  // source-of-truth. This allows us to evolve naming conventions without
  // touching this util.
  const model = supportedModels.find((m) => m.id === modelId);
  if (model) {
    // Many owners map 1-to-1 to inference providers.
    switch (model.owner) {
      case EModelOwner.OPENAI:
        return EInferenceProviders.OPENAI;
      case EModelOwner.ANTHROPIC:
        return EInferenceProviders.ANTHROPIC;
      case EModelOwner.GOOGLE:
        return EInferenceProviders.GOOGLE;
      case EModelOwner.FALAI:
        return EInferenceProviders.FALAI;
      default:
        // fallthrough to prefix extraction below for other / mixed cases
        break;
    }
  }

  // Fallback: infer by prefix (e.g. "openrouter/…", custom etc.). This keeps
  // compatibility with models not explicitly listed in supportedModels.
  const prefix = modelId.split("/")[0] as EInferenceProviders | undefined;
  if (
    prefix === EInferenceProviders.OPENAI ||
    prefix === EInferenceProviders.OPENROUTER ||
    prefix === EInferenceProviders.ANTHROPIC ||
    prefix === EInferenceProviders.GOOGLE ||
    prefix === EInferenceProviders.FALAI
  ) {
    return prefix;
  }

  return null;
}
