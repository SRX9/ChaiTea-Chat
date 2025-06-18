import { EInferenceProviders } from "@/config/models";
import Link from "next/link";
import { ReactNode } from "react";

export type ProviderConfig = {
  id: ProviderId;
  label: string;
  placeholder: string;
  description: ReactNode;
  hasBaseUrl?: boolean;
};

export type ProviderId =
  | EInferenceProviders.OPENROUTER
  | EInferenceProviders.OPENAI
  | EInferenceProviders.ANTHROPIC
  | EInferenceProviders.GOOGLE
  | EInferenceProviders.FALAI;

export type StoredProvider = {
  apiKey?: string;
  baseURL?: string;
};

export type StoredObject = Partial<Record<ProviderId, StoredProvider>>;

export const providers: ProviderConfig[] = [
  {
    id: EInferenceProviders.OPENROUTER,
    label: "OpenRouter API Key",
    placeholder: "Enter your OpenRouter API key",
    description: (
      <>
        You can put in your OpenRouter key to use any OpenRouter-supported
        models at cost.{" "}
        <Link
          href="https://openrouter.ai/docs/quickstart"
          target="_blank"
          rel="noreferrer"
          className="text-blue-400"
        >
          Get a key
        </Link>
        .
      </>
    ),
  },
  {
    id: EInferenceProviders.OPENAI,
    label: "OpenAI API Key",
    placeholder: "Enter your OpenAI API key",
    description: (
      <>
        You can put in your OpenAI key to use ChaiTea Chat at your own OpenAI
        API costs. When enabled, this key will be used for all models provided
        by OpenAI.{" "}
        <Link
          href="https://platform.openai.com/account/api-keys"
          target="_blank"
          rel="noreferrer"
          className="text-blue-400"
        >
          Get a key
        </Link>
        .
      </>
    ),
    hasBaseUrl: true,
  },
  {
    id: EInferenceProviders.ANTHROPIC,
    label: "Anthropic API Key",
    placeholder: "Enter your Anthropic API key",
    description: (
      <>
        You can put in your Anthropic key to use Claude at cost. When enabled,
        this key will be used for all models provided by Anthropic.{" "}
        <Link
          href="https://console.anthropic.com/settings/keys"
          target="_blank"
          rel="noreferrer"
          className="text-blue-400"
        >
          Get a key
        </Link>
        .
      </>
    ),
  },
  {
    id: EInferenceProviders.GOOGLE,
    label: "Google API Key",
    placeholder: "Enter your Google API key",
    description: (
      <>
        You can put in your Google AI Studio key to use Google models at cost.{" "}
        <Link
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noreferrer"
          className="text-blue-400"
        >
          Get a key
        </Link>
        .
      </>
    ),
  },
  {
    id: EInferenceProviders.FALAI,
    label: "FAL API Key",
    placeholder: "Enter your FAL API key",
    description: (
      <>
        You can put in your FAL (Fal.ai) key to use FAL models at cost.{" "}
        <Link
          href="https://app.fal.ai/settings/keys"
          target="_blank"
          rel="noreferrer"
          className="text-blue-400"
        >
          Get a key
        </Link>
        .
      </>
    ),
  },
];
