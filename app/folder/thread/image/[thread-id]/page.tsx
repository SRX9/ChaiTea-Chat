"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { nanoid } from "nanoid";

import { getMessages, addMessage, addThread, getThread } from "@/lib/db";
import { useUser } from "@/lib/auth-client";
import { ChatInput } from "@/components/chat/ChatInput";
import { ImageMessageList } from "@/components/chat/ImageMessageList";
import { Model, supportedModels, EModelModes } from "@/config/models";
import { getByokStorageKey, getProviderFromModelId } from "@/lib/byok";
import type { Message } from "@ai-sdk/react";

export default function ImageThreadPage() {
  const params = useParams();
  const threadId = useMemo(() => params["thread-id"] as string, [params]);

  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoaded, setMessagesLoaded] = useState(true);
  const [input, setInput] = useState("");
  const handleInputChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setInput(e.target.value);
  };
  // Local error tracking
  const [error, setError] = useState<Error | null>(null);

  const searchParams = useSearchParams();
  const isNewThread = searchParams.has("new");

  // Only image-related modes are allowed here
  const ALLOWED_MODES = [
    EModelModes.IMAGE_GENERATION,
    EModelModes.IMAGE_EDITING,
  ];

  // Start with Image Generation to avoid SSR/CSR mismatch.
  const [selectedMode, setSelectedMode] = useState<EModelModes>(
    EModelModes.IMAGE_GENERATION
  );

  // On first mount attempt to restore any mode that was persisted when the
  // user began the conversation from the homepage (e.g. Image Editing).
  useEffect(() => {
    const storedMode = localStorage.getItem(
      "chaitea-initial-mode"
    ) as EModelModes | null;

    if (storedMode && ALLOWED_MODES.includes(storedMode as EModelModes)) {
      setSelectedMode(storedMode as EModelModes);
    }
  }, []);

  const handleSelectMode = (mode: EModelModes) => {
    setSelectedMode(mode);
    if (!modelRef.current.supportedModes.includes(mode)) {
      const fallback =
        supportedModels.find((m) => m.supportedModes.includes(mode)) ||
        supportedModels[0];
      setSelectedModel(fallback);
    }
  };

  const [selectedModel, setSelectedModel] = useState<Model>(() => {
    // Attempt to hydrate from localStorage (works only on the client).
    if (typeof window !== "undefined") {
      const storedId =
        localStorage.getItem("chaitea-initial-model") ||
        localStorage.getItem("chaitea-selected-model-image");

      if (storedId) {
        const persisted = supportedModels.find((m) => m.id === storedId);
        if (persisted) {
          return persisted;
        }
      }
    }

    // Fallback: pick the first model that supports image generation.
    const first = supportedModels.find((m) =>
      m.supportedModes.includes(EModelModes.IMAGE_GENERATION)
    );
    return first || supportedModels[0];
  });

  // Restore the model that was chosen on the homepage (if any) when landing
  // on a brand-new thread. We defer this to an effect so that it runs only on
  // the client.
  useEffect(() => {
    const initialModelId = localStorage.getItem("chaitea-initial-model");
    if (!initialModelId) return;

    const maybe = supportedModels.find(
      (m) => m.id === initialModelId && m.supportedModes.includes(selectedMode)
    );
    if (maybe) {
      setSelectedModel(maybe);
    }
  }, [selectedMode]);

  useEffect(() => {
    const storedId = localStorage.getItem("chaitea-selected-model-image");
    if (!storedId) return;

    const persisted = supportedModels.find((m) => m.id === storedId);
    if (persisted && persisted.supportedModes.includes(selectedMode)) {
      setSelectedModel(persisted);
    } else {
      const fallback = supportedModels.find((m) =>
        m.supportedModes.includes(selectedMode)
      );
      if (fallback) setSelectedModel(fallback);
    }
  }, [selectedMode]);

  const handleSelectModel = (model: Model) => {
    setSelectedModel(model);
    if (typeof window !== "undefined") {
      localStorage.setItem("chaitea-selected-model-image", model.id);
    }
  };

  const modelRef = useRef(selectedModel);
  const modeRef = useRef(selectedMode);

  useEffect(() => {
    modelRef.current = selectedModel;
  }, [selectedModel]);

  useEffect(() => {
    modeRef.current = selectedMode;
  }, [selectedMode]);

  useEffect(() => {
    if (isNewThread) {
      return;
    }
    if (!threadId) return;

    setMessagesLoaded(false);

    const loadMessages = async () => {
      try {
        const storedMessages = await getMessages(threadId);
        setMessages(storedMessages);
      } catch {
      } finally {
        setMessagesLoaded(true);
      }
    };

    loadMessages();
  }, [threadId, isNewThread]);

  const [isImageGenLoading, setIsImageGenLoading] = useState(false);

  const initialPromptSent = useRef(false);

  useEffect(() => {
    const prompt = localStorage.getItem("chaitea-initial-prompt");
    const attachmentsRaw = localStorage.getItem("chaitea-initial-attachments");

    if (prompt && !initialPromptSent.current && messages.length === 0) {
      // Pre-fill input so the submission handler can pick it up
      setInput(prompt);

      let attachments: any[] | undefined = undefined;
      if (attachmentsRaw) {
        try {
          attachments = JSON.parse(attachmentsRaw);
        } catch {
          // ignore parse error and treat as no attachments
        }
      }

      submitPrompt(
        prompt,
        attachments ? { experimental_attachments: attachments } : undefined
      );
      setInput("");
      initialPromptSent.current = true;
      localStorage.removeItem("chaitea-initial-prompt");
      localStorage.removeItem("chaitea-initial-model");
      localStorage.removeItem("chaitea-initial-attachments");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  /**
   * Core submit implementation shared by form submits and auto-prompt bootstrap.
   */
  const submitPrompt = async (
    promptText: string,
    attachments?: { experimental_attachments?: any }
  ) => {
    const id = nanoid();
    const userMessage: Message = {
      id,
      role: "user",
      content: promptText,
      createdAt: new Date(),
    };

    if (attachments?.experimental_attachments) {
      (userMessage as any).experimental_attachments =
        attachments.experimental_attachments;
    }

    // Add user message locally and persist
    setMessages((prev) => [...prev, userMessage]);
    await addMessage({ ...userMessage, threadId: threadId });

    setIsImageGenLoading(true);

    // Determine provider & model id for selected image model
    let providerName: string | undefined = undefined;
    let providerModelId: string = selectedModel.id;

    if (selectedModel.inferenceProviders?.length) {
      const firstProv = selectedModel.inferenceProviders[0] as any;
      if (typeof firstProv === "string") {
        providerName = firstProv;
      } else {
        providerName = firstProv.provider;
        providerModelId = firstProv.model_id || selectedModel.id;
      }
    }

    try {
      // Prepare request payload. For image-generation we only send the prompt.
      // For image-editing we additionally forward the image that the user
      // provided as an attachment (exactly one is allowed by the ChatInput
      // component).

      const payload: Record<string, any> = {
        prompt: promptText,
        modelId: providerModelId,
        provider: providerName || getProviderFromModelId(selectedModel.id),
      };

      // -------------------- BYOK injection ------------------------------
      if (typeof window !== "undefined" && user?.id) {
        // Prefer explicit providerName if available; otherwise infer.
        const provId =
          (providerName as string) || getProviderFromModelId(selectedModel.id);

        if (provId) {
          try {
            const storageKey = getByokStorageKey(user.id);
            const raw = localStorage.getItem(storageKey);
            if (raw) {
              const stored = JSON.parse(raw);
              const sp = stored[provId];
              if (sp?.apiKey) {
                payload.provider = provId;
                payload.api_key = sp.apiKey; // still encrypted
                if (provId === "openai" && sp.baseURL) {
                  payload.baseURL = sp.baseURL;
                }
              }
            }
          } catch {
            // swallow silently – if anything fails we skip BYOK
          }
        }
      }
      // ------------------------------------------------------------------

      if (modeRef.current === EModelModes.IMAGE_EDITING) {
        // Prefer the user-provided attachment (if any); otherwise fall back to
        // the most recent assistant image in the conversation.

        let sourceUrl: string | undefined =
          attachments?.experimental_attachments?.[0]?.url;

        if (!sourceUrl) {
          // Helper to parse an image URL from a message's content (mirrors
          // ImageMessage.tsx logic).
          const parseImageUrl = (content: unknown): string | null => {
            if (!content) return null;
            if (typeof content === "string") {
              try {
                const obj = JSON.parse(content);
                if (typeof obj?.imageUrl === "string") return obj.imageUrl;
              } catch {
                if (content.startsWith("http")) return content;
              }
            } else if (
              typeof content === "object" &&
              content !== null &&
              (content as any).imageUrl
            ) {
              return (content as any).imageUrl as string;
            }
            return null;
          };

          for (let i = messages.length - 1; i >= 0; i--) {
            const m = messages[i];
            if (m.role === "assistant") {
              const img = parseImageUrl(m.content);
              if (img) {
                sourceUrl = img;
                break;
              }
            }
          }
        }

        if (!sourceUrl) {
          throw new Error(
            "Image editing requires an image – please attach one or generate an image first."
          );
        }

        payload.imageUrl = sourceUrl;
      }

      const res = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data: any = {};
      const text = await res.text();
      try {
        data = JSON.parse(text || "{}");
      } catch {
        // Non-JSON response (e.g. plain-text error)
        data = { error: text };
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate image");
      }

      const assistantMessage: Message = {
        id: nanoid(),
        role: "assistant",
        content: JSON.stringify({ imageUrl: data.imageUrl }),
        createdAt: new Date(),
      } as any;

      (assistantMessage as any).modelId = selectedModel.id;
      (assistantMessage as any).mode = modeRef.current;

      setMessages((prev) => [...prev, assistantMessage]);
      await addMessage({ ...assistantMessage, threadId: threadId } as any);

      // Ensure thread record exists
      const threadExists = await getThread(threadId);
      if (!threadExists) {
        await addThread({
          id: threadId,
          title: promptText.substring(0, 30) || "New Image Chat",
          createdAt: new Date(),
          userId: user?.id ?? "",
          mode: modeRef.current,
        });
      }
    } catch (err: any) {
      console.error("Image generation failed", err);
      setError(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${nanoid()}`,
          role: "assistant",
          content:
            err?.message ||
            "Oops! Something went wrong while generating the image.",
          isError: true,
          createdAt: new Date(),
        } as any,
      ]);
    } finally {
      setIsImageGenLoading(false);
      setInput("");
    }
  };

  // Wrapper used by the <ChatInput> component
  const newHandleSubmit = (
    e: React.FormEvent<HTMLFormElement>,
    options?: { experimental_attachments?: any }
  ) => {
    e.preventDefault();
    if (!input.trim()) return;
    submitPrompt(input, options);
  };

  /* ---------------------------------------------------------------------- */
  /* Retry logic (mirrors text-chat behaviour)                              */
  /* ---------------------------------------------------------------------- */

  const handleGenericRetry = async (
    questionMessage: Message,
    newModel?: Model
  ) => {
    // If a different model was chosen from the retry dropdown, persist it.
    if (newModel) {
      setSelectedModel(newModel);
    }

    // Forward any attachments if they were present in the original message
    const attachments = (questionMessage as any).experimental_attachments;

    // Issue a brand-new prompt with the same content. This leaves the original
    // messages intact so users can see the full history.
    await submitPrompt(
      questionMessage.content as string,
      attachments ? { experimental_attachments: attachments } : undefined
    );
  };

  const handleQuestionRetry = async (message: Message, model: Model) => {
    await handleGenericRetry(message, model);
  };

  const handleRetry = async (answerMessage: Message, model: Model) => {
    const answerIndex = messages.findIndex((m) => m.id === answerMessage.id);

    if (answerIndex > 0) {
      let questionMessage: Message | null = null;
      for (let i = answerIndex - 1; i >= 0; i--) {
        if (messages[i].role === "user") {
          questionMessage = messages[i];
          break;
        }
      }

      if (questionMessage) {
        await handleGenericRetry(questionMessage, model);
      } else {
        console.error("Could not find a question for the answer to retry.");
      }
    }
  };

  const busy = isImageGenLoading;

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <ImageMessageList
        messages={messages}
        isLoading={busy}
        error={error || undefined}
        onRetry={handleRetry}
        onQuestionRetry={handleQuestionRetry}
        messagesLoaded={messagesLoaded}
      />

      <ChatInput
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={newHandleSubmit}
        isLoading={busy}
        selectedModel={selectedModel}
        selectedMode={selectedMode}
        onSelectModel={handleSelectModel}
        onSelectMode={handleSelectMode}
        allowedModes={ALLOWED_MODES}
      />
    </div>
  );
}
