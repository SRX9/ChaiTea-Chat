"use client";

import { useChat, Message } from "@ai-sdk/react";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { nanoid } from "nanoid";

import {
  getMessages,
  addMessage,
  addThread,
  getThread,
  deleteMessage,
} from "@/lib/db";
import { useUser } from "@/lib/auth-client";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessageList } from "@/components/chat/ChatMessageList";
import { Model, supportedModels, EModelModes } from "@/config/models";
import { getByokStorageKey, getProviderFromModelId } from "@/lib/byok";

export default function ChatPage() {
  const params = useParams();
  const threadId = useMemo(() => params["thread-id"] as string, [params]);

  const { user } = useUser();
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [messagesLoaded, setMessagesLoaded] = useState(true);

  // Detect if the URL contains ?new (e.g. /thread/abc?new=true). This signals
  // that the user is starting a fresh conversation and therefore no stored
  // messages should be fetched initially.
  const searchParams = useSearchParams();
  const isNewThread = searchParams.has("new");

  // Deterministic default to avoid SSR/CSR mismatch. We'll hydrate client-side.
  const [selectedMode, setSelectedMode] = useState<EModelModes>(
    EModelModes.NORMAL_CHAT
  );

  const handleSelectMode = (mode: EModelModes) => {
    setSelectedMode(mode);
    // Ensure the currently selected model supports the chosen mode.
    if (!modelRef.current.supportedModes.includes(mode)) {
      const fallback =
        supportedModels.find((m) => m.supportedModes.includes(mode)) ||
        supportedModels[0];
      setSelectedModel(fallback);
    }
  };

  const [selectedModel, setSelectedModel] = useState<Model>(() => {
    if (typeof window !== "undefined") {
      const stored =
        localStorage.getItem("chaitea-initial-model") ||
        localStorage.getItem("chaitea-selected-model");
      if (stored) {
        const found = supportedModels.find((m) => m.id === stored);
        if (found) return found;
      }
    }
    return supportedModels[0];
  });

  // Hydrate selectedModel from localStorage and ensure it supports the mode.
  useEffect(() => {
    const storedId = localStorage.getItem("chaitea-selected-model");
    if (!storedId) return;

    const persisted = supportedModels.find((m) => m.id === storedId);

    // Must support the current mode; otherwise choose first supporting model.
    if (persisted && persisted.supportedModes.includes(selectedMode)) {
      setSelectedModel(persisted);
    } else {
      const fallback = supportedModels.find((m) =>
        m.supportedModes.includes(selectedMode)
      );
      if (fallback) setSelectedModel(fallback);
    }
    // Re-run when mode changes to keep consistency.
  }, [selectedMode]);

  const handleSelectModel = (model: Model) => {
    setSelectedModel(model);
    if (typeof window !== "undefined") {
      localStorage.setItem("chaitea-selected-model", model.id);
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
    // If this is flagged as a brand-new thread, skip fetching any history.
    if (isNewThread) {
      return;
    }

    if (!threadId) return;

    setMessagesLoaded(false);

    const loadMessages = async () => {
      try {
        const storedMessages = await getMessages(threadId);
        setInitialMessages(storedMessages);
      } catch (error) {
        // swallow but still restore loading state
      } finally {
        setMessagesLoaded(true);
      }
    };

    loadMessages();
  }, [threadId, isNewThread]);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    append,
    isLoading,
    error,
    setMessages,
    reload,
    setInput,
  } = useChat({
    id: threadId,
    initialMessages: initialMessages,
    sendExtraMessageFields: true,
    experimental_prepareRequestBody: ({ requestBody }) => {
      // Always include the current selected model id so the API route can pick
      // the correct model.

      const body: any = {
        ...(requestBody as any),
        modelId: modelRef.current.id,
        mode: modeRef.current,
        provider:
          (requestBody as any)?.provider ||
          getProviderFromModelId(modelRef.current.id),
      };

      // Inject BYOK credentials (still encrypted) if the user has stored them
      // for the provider corresponding to the selected model.
      if (typeof window !== "undefined" && user?.id) {
        const providerId = getProviderFromModelId(modelRef.current.id);

        if (providerId) {
          try {
            const storageKey = getByokStorageKey(user.id);
            const raw = localStorage.getItem(storageKey);
            if (raw) {
              const stored = JSON.parse(raw);
              const sp = stored[providerId];
              if (sp?.apiKey) {
                body.provider = providerId;
                body.api_key = sp.apiKey; // still encrypted
              }
            }
          } catch {
            // noop – if anything fails we silently skip BYOK injection
          }
        }
      }

      return body;
    },
    onFinish: async (message, { usage }) => {
      // Attach the model id to the assistant message so that the UI can
      // immediately show which model produced the answer.
      (message as any).modelId = modelRef.current.id;

      if (usage) {
        (message as any).tokenUsage = usage;
      }

      // Force React state update so components re-render with the augmented
      // message object (some libraries may mutate the object without triggering
      // React change detection).
      setMessages((prev) => {
        // Replace the last assistant message with the updated one.
        const newArr = [...prev];
        for (let i = newArr.length - 1; i >= 0; i--) {
          if (newArr[i].role === "assistant") {
            newArr[i] = { ...(message as any) };
            break;
          }
        }
        return newArr;
      });

      const threadExists = await getThread(threadId);

      if (!threadExists && messages.length > 0) {
        const firstUserMessage = messages.find((m) => m.role === "user");
        const title = firstUserMessage
          ? firstUserMessage.content.substring(0, 30)
          : "New Chat";

        await addThread({
          id: threadId,
          title: title,
          createdAt: new Date(),
          userId: user?.id ?? "",
          mode: modeRef.current,
        });
      }

      await addMessage({
        ...(message as any),
        threadId: threadId,
        modelId: modelRef.current.id,
        mode: modeRef.current,
        tokenUsage: usage,
        provider: getProviderFromModelId(modelRef.current.id),
      } as any);
    },
  });

  const originalHandleSubmit = handleSubmit;

  const initialPromptSent = useRef(false);

  useEffect(() => {
    const prompt = localStorage.getItem("chaitea-initial-prompt");
    const attachmentsRaw = localStorage.getItem("chaitea-initial-attachments");

    if (prompt && !initialPromptSent.current && messages.length === 0) {
      const id = nanoid();
      const userMessage: Message = {
        id: id,
        role: "user",
        content: prompt,
        createdAt: new Date(),
      };

      if (attachmentsRaw) {
        try {
          (userMessage as any).experimental_attachments =
            JSON.parse(attachmentsRaw);
        } catch {
          // ignore parse error
        }
      }
      append(userMessage, {
        body: {
          messageId: id,
          modelId: selectedModel.id,
          mode: modeRef.current,
          provider: getProviderFromModelId(selectedModel.id),
          messages: [userMessage],
        },
      });
      initialPromptSent.current = true;
      localStorage.removeItem("chaitea-initial-prompt");
      localStorage.removeItem("chaitea-initial-model");
      localStorage.removeItem("chaitea-initial-attachments");
    }
  }, [append, messages.length, selectedModel.id, setMessages]);

  const prevMessagesLength = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      const lastMessage = messages[messages.length - 1];

      if (lastMessage.role === "user") {
        addMessage({ ...lastMessage, threadId: threadId });
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages, threadId]);

  // When an error occurs during generation, create a dummy assistant message so
  // that the UI reflects the failure. **Do not** persist this error message to
  // IndexedDB so we avoid polluting the stored chat history.
  useEffect(() => {
    if (!error) return;

    // Avoid duplicating if the last stored message is already the error.
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && (lastMsg as any).isError) return;

    const errorMessage: Message & {
      isError: true;
      modelId?: string;
      createdAt: Date;
      mode: EModelModes;
    } = {
      id: `error-${nanoid()}`,
      role: "assistant",
      content:
        error.message ||
        "Oops! Something went wrong while generating a response. Please try again.",
      isError: true,
      modelId: selectedModel.id,
      mode: modeRef.current,
      createdAt: new Date(),
    } as any;

    // Update local state so UI reflects immediately.
    setMessages([...messages, errorMessage]);
  }, [error, messages, selectedModel.id, setMessages, threadId]);

  const handleGenericRetry = async (
    questionMessage: Message,
    newModel?: Model
  ) => {
    if (newModel) {
      setSelectedModel(newModel);
    }

    const questionIndex = messages.findIndex(
      (m) => m.id === questionMessage.id
    );

    if (questionIndex === -1) {
      console.error("Could not find message to retry.");
      setInput(questionMessage.content as string); // Fallback
      return;
    }

    const messagesToDelete = messages.slice(questionIndex + 1);
    const updatedMessages = messages.slice(0, questionIndex + 1);

    setMessages(updatedMessages);

    for (const msg of messagesToDelete) {
      if (!(msg as any).isError && msg.id) {
        try {
          await deleteMessage(msg.id);
        } catch (e) {
          console.error(`Failed to delete message ${msg.id} from storage`, e);
        }
      }
    }

    try {
      await reload({
        body: {
          messages: updatedMessages,
          modelId: (newModel || modelRef.current).id,
          mode: modeRef.current,
          provider: getProviderFromModelId((newModel || modelRef.current).id),
        },
      });
    } catch (e) {
      console.error("Retry failed", e);
    }
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

  const busy = isLoading;

  // Wrapper to inject metadata and support attachments – image generation path removed
  const newHandleSubmit = (
    e: React.FormEvent<HTMLFormElement>,
    options?: { experimental_attachments?: any }
  ) => {
    e.preventDefault();

    const id = nanoid();
    const userMessage: Message = {
      id,
      role: "user",
      content: input,
      createdAt: new Date(),
    };

    if (options?.experimental_attachments) {
      (userMessage as any).experimental_attachments =
        options.experimental_attachments;
    }

    originalHandleSubmit(e, {
      body: {
        messageId: id,
        messages: [...messages, userMessage],
        modelId: selectedModel.id,
        mode: modeRef.current,
        provider: getProviderFromModelId(selectedModel.id),
      },
      ...options,
    });
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <ChatMessageList
        messages={messages}
        isLoading={isLoading}
        error={error}
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
        allowedModes={[EModelModes.NORMAL_CHAT, EModelModes.WEB_SEARCH]}
      />
    </div>
  );
}
