export enum EModelIntelligence {
  QUICK = "quick",
  SMART = "smart",
  GENIUS = "genius",
}

export enum EModelOwner {
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
  GOOGLE = "google",
  DEEPSEEK = "deepseek",
  XAI = "xai",
  FLUX = "flux",
  BYTEDANCE = "bytedance",
  FALAI = "falai",
  QWEN = "qwen",
  AZURE = "azure",
  GROQ = "groq",
  AMAZON_BEDROCK = "amazon-bedrock",
  VERCEL = "vercel",
  IDEOGRAM = "ideogram",
  OTHER = "other",
}

export enum EModelModes {
  WEB_SEARCH = "Live Search",
  IMAGE_EDITING = "Image Editing",
  IMAGE_GENERATION = "Image Generation",
  NORMAL_CHAT = "Chat",
}

export const SupportedModes: EModelModes[] = [
  EModelModes.NORMAL_CHAT,
  EModelModes.WEB_SEARCH,
  EModelModes.IMAGE_EDITING,
  EModelModes.IMAGE_GENERATION,
];

export enum EInferenceProviders {
  OPENROUTER = "openrouter",
  ANTHROPIC = "anthropic",
  GOOGLE = "google",
  OPENAI = "openai",
  FALAI = "falai",
}

export interface IInferenceProviderObject {
  provider: EInferenceProviders;
  model_id?: string;
}

export interface IModelCost {
  /** Cost per 1K or 1M input tokens depending on provider; values are in USD. */
  input?: number;
  /** Cost per 1K or 1M output tokens depending on provider; values are in USD. */
  output?: number;
  /** Discounted cost when the prompt is cached, if available. */
  inputCached?: number;
  /** Discounted cost when the completion is cached, if available. */
  outputCached?: number;

  cost_per_image_operation?: number;
}

export interface IModelLimit {
  /** Maximum context length (prompt + completion) in tokens. */
  context: number;
  /** Maximum completion length in tokens. */
  output: number;
}

export interface Model {
  id: string;
  name: string;
  owner: EModelOwner;
  intelligence: EModelIntelligence;
  /** Whether the model can accept/return image attachments. */
  imageSupport: boolean;
  /** Whether the model itself is an image generation/editing model. */
  isImageModel: boolean;
  /** Whether the model can only be used for max-quality scenarios. */
  maxOnly?: boolean;
  supportedModes: EModelModes[];
  /** Flag indicating the model specialises in reasoning-heavy tasks. */
  isReasoning?: boolean;
  /** Fine-grained pricing information if available. */
  cost?: IModelCost;
  /** Token limits for the model. */
  limit?: IModelLimit;
  /** Legacy pricing shape kept for backwards compatibility. */
  description?: string;
  /** Inference providers that can serve this model. Either plain enum or detailed object. */
  inferenceProviders?: (EInferenceProviders | IInferenceProviderObject)[];
}

export const autoModel: Model = {
  id: "openrouter/auto",
  name: "Auto",
  owner: EModelOwner.OTHER,
  intelligence: EModelIntelligence.SMART,
  imageSupport: true,
  isImageModel: false,
  supportedModes: [EModelModes.NORMAL_CHAT, EModelModes.WEB_SEARCH],
  isReasoning: false,
  description: "Auto is will automatically select the best model for the task.",
};

export const supportedModels: Model[] = [
  {
    id: "anthropic/claude-sonnet-4",
    name: "Claude 4 sonnet",
    owner: EModelOwner.ANTHROPIC,
    intelligence: EModelIntelligence.GENIUS,
    imageSupport: true,
    isImageModel: false,
    supportedModes: [EModelModes.NORMAL_CHAT, EModelModes.WEB_SEARCH],
    description:
      "Claude 4 Sonnet excels at fast, accurate coding assistance and general reasoning across most common AI tasks.",
    inferenceProviders: [
      {
        provider: EInferenceProviders.ANTHROPIC,
        model_id: "claude-sonnet-4-20250514",
      },
      { provider: EInferenceProviders.OPENROUTER },
    ],
    cost: { input: 3, output: 15, inputCached: 3.75, outputCached: 0.3 },
    limit: { context: 200000, output: 50000 },
  },
  {
    id: "anthropic/claude-opus-4",
    name: "Claude 4 Opus",
    owner: EModelOwner.ANTHROPIC,
    intelligence: EModelIntelligence.GENIUS,
    imageSupport: true,
    isImageModel: false,
    isReasoning: false,
    supportedModes: [EModelModes.NORMAL_CHAT, EModelModes.WEB_SEARCH],
    description:
      "Claude 4 Opus is optimized for deep, sustained reasoning and long-running agentic coding workflows.",
    inferenceProviders: [
      {
        provider: EInferenceProviders.ANTHROPIC,
        model_id: "claude-opus-4-2025051",
      },
      { provider: EInferenceProviders.OPENROUTER },
    ],
    cost: { input: 15, output: 75, inputCached: 1.5, outputCached: 1.5 },
    limit: { context: 200000, output: 32000 },
  },
  {
    id: "anthropic/claude-3.7-sonnet",
    name: "Claude 3.7 Sonnet",
    owner: EModelOwner.ANTHROPIC,
    intelligence: EModelIntelligence.GENIUS,
    imageSupport: true,
    isImageModel: false,
    isReasoning: false,
    supportedModes: [EModelModes.NORMAL_CHAT, EModelModes.WEB_SEARCH],
    description:
      "Claude 3.7 Sonnet is ideal for agentic coding and customer-facing agents that demand precise instruction following and advanced reasoning.",
    inferenceProviders: [
      {
        provider: EInferenceProviders.ANTHROPIC,
        model_id: "claude-3-7-sonnet-20250219",
      },
      { provider: EInferenceProviders.OPENROUTER },
    ],
    cost: { input: 3, output: 15, inputCached: 0.3, outputCached: 0.3 },
    limit: { context: 200000, output: 64000 },
  },
  {
    id: "openai/gpt-4.1",
    name: "GPT 4.1",
    owner: EModelOwner.OPENAI,
    intelligence: EModelIntelligence.SMART,
    imageSupport: true,
    isImageModel: false,
    supportedModes: [EModelModes.NORMAL_CHAT, EModelModes.WEB_SEARCH],
    description:
      "GPT-4.1 targets developer productivity with enhanced coding performance, a 1 million-token context window, and lower cost.",
    inferenceProviders: [
      { provider: EInferenceProviders.OPENAI, model_id: "gpt-4.1" },
      { provider: EInferenceProviders.OPENROUTER, model_id: "openai/gpt-4.1" },
    ],
    cost: { input: 2, output: 8, inputCached: 0.5, outputCached: 0 },
    limit: { context: 1047576, output: 32768 },
  },
  {
    id: "openai/chatgpt-4o-latest",
    name: "GPT 4o",
    owner: EModelOwner.OPENAI,
    intelligence: EModelIntelligence.SMART,
    imageSupport: true,
    isImageModel: false,
    supportedModes: [EModelModes.NORMAL_CHAT, EModelModes.WEB_SEARCH],
    description:
      "GPT-4o shines in low-latency multimodal tasks like real-time translation, vision analysis, and voice interactions.",
    inferenceProviders: [
      { provider: EInferenceProviders.OPENAI, model_id: "chatgpt-4o-latest" },
      {
        provider: EInferenceProviders.OPENROUTER,
        model_id: "openai/chatgpt-4o-latest",
      },
    ],
    cost: { input: 2.5, output: 10, inputCached: 1.25, outputCached: 0 },
    limit: { context: 128000, output: 16384 },
  },
  {
    id: "google/gemini-2.5-pro-preview",
    name: "Gemini 2.5 Pro",
    owner: EModelOwner.GOOGLE,
    intelligence: EModelIntelligence.GENIUS,
    imageSupport: true,
    isImageModel: false,
    isReasoning: false,
    supportedModes: [EModelModes.NORMAL_CHAT, EModelModes.WEB_SEARCH],
    description:
      "Gemini 2.5 Pro is the powerhouse model for advanced coding, complex reasoning, and analyzing large datasets or codebases.",
    inferenceProviders: [
      {
        provider: EInferenceProviders.GOOGLE,
        model_id: "gemini-2.5-pro-preview-06-05",
      },
      {
        provider: EInferenceProviders.OPENROUTER,
        model_id: "google/gemini-2.5-pro-preview",
      },
    ],
    cost: { input: 1.25, output: 10, inputCached: 0.31, outputCached: 0 },
    limit: { context: 1048576, output: 65536 },
  },
  {
    id: "google/gemini-2.5-flash-preview-05-20",
    name: "Gemini 2.5 Flash",
    owner: EModelOwner.GOOGLE,
    intelligence: EModelIntelligence.SMART,
    imageSupport: true,
    isImageModel: false,
    supportedModes: [EModelModes.NORMAL_CHAT, EModelModes.WEB_SEARCH],
    description:
      "Gemini 2.5 Flash delivers ultra-fast, cost-efficient responses for real-time summarization and high-throughput chatbots.",
    inferenceProviders: [
      {
        provider: EInferenceProviders.GOOGLE,
        model_id: "gemini-2.5-flash-preview-05-20",
      },
      {
        provider: EInferenceProviders.OPENROUTER,
        model_id: "google/gemini-2.5-flash-preview-05-20",
      },
    ],
    cost: { input: 0.15, output: 0.6, inputCached: 0.0375, outputCached: 0 },
    limit: { context: 1048576, output: 65536 },
  },
  {
    id: "google/gemini-2.5-flash-preview-05-20:thinking",
    name: "Gemini 2.5 Flash",
    owner: EModelOwner.GOOGLE,
    intelligence: EModelIntelligence.GENIUS,
    imageSupport: true,
    isImageModel: false,
    isReasoning: true,
    supportedModes: [EModelModes.NORMAL_CHAT, EModelModes.WEB_SEARCH],
    description:
      "Gemini 2.5 Flash (thinking) balances Flash-level speed with smarter reasoning for quick yet more accurate answers.",
    inferenceProviders: [
      {
        provider: EInferenceProviders.GOOGLE,
        model_id: "gemini-2.5-flash-preview-05-20:thinking",
      },
      {
        provider: EInferenceProviders.OPENROUTER,
        model_id: "google/gemini-2.5-flash-preview-05-20:thinking",
      },
    ],
    cost: { input: 0.15, output: 0.6, inputCached: 0.0375, outputCached: 0 },
    limit: { context: 1048576, output: 65536 },
  },
  {
    id: "x-ai/grok-3-beta",
    name: "Grok 3",
    owner: EModelOwner.XAI,
    intelligence: EModelIntelligence.GENIUS,
    imageSupport: true,
    isImageModel: false,
    supportedModes: [EModelModes.NORMAL_CHAT, EModelModes.WEB_SEARCH],
    description:
      "Grok 3 is a multimodal assistant providing real-time data, humorous replies, and Tesla-integrated navigation and diagnostics.",
    inferenceProviders: [
      {
        provider: EInferenceProviders.OPENROUTER,
        model_id: "x-ai/grok-3-beta",
      },
      { provider: EInferenceProviders.OPENROUTER, model_id: "grok-3-beta" },
    ],
    cost: { input: 3, output: 15, inputCached: 0.75, outputCached: 15 },
    limit: { context: 131072, output: 8192 },
  },
  {
    id: "deepseek/deepseek-r1-0528",
    name: "DeepSeek R1",
    owner: EModelOwner.DEEPSEEK,
    intelligence: EModelIntelligence.GENIUS,
    imageSupport: false,
    isImageModel: false,
    isReasoning: true,
    supportedModes: [EModelModes.NORMAL_CHAT, EModelModes.WEB_SEARCH],
    description:
      "DeepSeek R1 is an open-source reasoning model focused on logical inference, math, and cost-efficient automated coding.",
    inferenceProviders: [
      {
        provider: EInferenceProviders.OPENROUTER,
        model_id: "deepseek/deepseek-r1-0528",
      },
    ],
    cost: { input: 0.55, output: 2.19, inputCached: 0.14, outputCached: 0 },
    limit: { context: 65536, output: 8192 },
  },
  {
    id: "qwen/qwen3-30b-a3b",
    name: "Qwen 3.30B",
    owner: EModelOwner.QWEN,
    intelligence: EModelIntelligence.SMART,
    imageSupport: false,
    isImageModel: false,
    isReasoning: false,
    supportedModes: [EModelModes.NORMAL_CHAT, EModelModes.WEB_SEARCH],
    description:
      "Qwen 3-30B-A3B is an efficient MoE model that switches between casual dialogue and deep reasoning with strong multilingual and agent capabilities.",
    inferenceProviders: [
      {
        provider: EInferenceProviders.OPENROUTER,
        model_id: "qwen/qwen3-30b-a3b",
      },
    ],
    cost: { input: 0.29, output: 0.59, inputCached: 0, outputCached: 0 },
    limit: { context: 131072, output: 16384 },
  },
  {
    id: "fal-ai/imagen4/preview",
    name: "Imagen 4",
    owner: EModelOwner.FLUX,
    intelligence: EModelIntelligence.GENIUS,
    imageSupport: false,
    isImageModel: true,
    supportedModes: [EModelModes.IMAGE_GENERATION],
    description:
      "Imagen 4 is a Google's state-of-the-art image generation model that can create realistic and detailed images.",
    inferenceProviders: [
      {
        provider: EInferenceProviders.FALAI,
        model_id: "fal-ai/imagen4/preview",
      },
    ],
    cost: { cost_per_image_operation: 0.04 },
  },
  {
    id: "fal-ai/flux-pro/new",
    name: "Flux Pro",
    owner: EModelOwner.FLUX,
    intelligence: EModelIntelligence.GENIUS,
    imageSupport: false,
    isImageModel: true,
    supportedModes: [EModelModes.IMAGE_GENERATION],
    description:
      "Flux Pro is a Flux's state-of-the-art image generation model that can create realistic and detailed images.",
    inferenceProviders: [
      {
        provider: EInferenceProviders.FALAI,
        model_id: "fal-ai/flux-pro/new",
      },
    ],
    cost: { cost_per_image_operation: 0.05 },
  },
  {
    id: "fal-ai/bytedance/seedream/v3/text-to-image",
    name: "Seedream",
    owner: EModelOwner.BYTEDANCE,
    intelligence: EModelIntelligence.GENIUS,
    imageSupport: false,
    isImageModel: true,
    supportedModes: [EModelModes.IMAGE_GENERATION],
    description:
      "Seedream is a Bytedance's state-of-the-art image generation model that can create realistic and detailed images.",
    inferenceProviders: [
      {
        provider: EInferenceProviders.FALAI,
        model_id: "fal-ai/bytedance/seedream/v3/text-to-image",
      },
    ],
    cost: { cost_per_image_operation: 0.03 },
  },
  {
    id: "fal-ai/ideogram/v3",
    name: "Ideogram V3",
    owner: EModelOwner.IDEOGRAM,
    intelligence: EModelIntelligence.GENIUS,
    imageSupport: false,
    isImageModel: true,
    supportedModes: [EModelModes.IMAGE_GENERATION],
    description:
      "Ideogram V3 is a Ideogram's state-of-the-art image generation model that can create realistic and detailed images.",
    inferenceProviders: [
      {
        provider: EInferenceProviders.FALAI,
        model_id: "fal-ai/ideogram/v3",
      },
    ],
    cost: { cost_per_image_operation: 0.03 },
  },
  {
    id: "fal-ai/flux-pro/kontext",
    name: "Flux Pro Kontext",
    owner: EModelOwner.FLUX,
    intelligence: EModelIntelligence.GENIUS,
    imageSupport: true,
    isImageModel: true,
    supportedModes: [EModelModes.IMAGE_EDITING],
    description:
      "Flux Pro Kontext is a Flux's state-of-the-art image editing model that can manipulate any elements of images.",
    inferenceProviders: [
      {
        provider: EInferenceProviders.FALAI,
        model_id: "fal-ai/flux-pro/kontext",
      },
    ],
    cost: { cost_per_image_operation: 0.04 },
  },
];
