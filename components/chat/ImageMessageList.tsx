"use client";
import React, { useEffect } from "react";
import { Message } from "@ai-sdk/react";
import { ImageMessage } from "./ImageMessage";
import { ChevronDown } from "lucide-react";
import { useScroll } from "@/lib/ScrollContext";
import { Model, supportedModels } from "@/config/models";
import { nanoid } from "nanoid";
import { MessageSkeletonLoader } from "./MessageSkeletonLoader";
import { ContentGenLoader } from "../ui/ContentGenLoader";

interface ImageMessageListProps {
  messages: Message[];
  isLoading: boolean;
  error?: Error;
  onRetry: (message: Message, model: Model) => void;
  onQuestionRetry: (message: Message, model: Model) => void;
  messagesLoaded: boolean;
}

const ImageMessageList: React.FC<ImageMessageListProps> = ({
  messages,
  isLoading,
  error,
  onRetry,
  onQuestionRetry,
  messagesLoaded: _messagesLoaded,
}) => {
  // Always call hooks at the top level
  const { showScrollToBottom, scrollToBottom, isAtBottom } = useScroll();

  // Append error message if needed (similar to ChatMessageList)
  const derivedMessages = React.useMemo(() => {
    if (!error) return messages;

    const alreadyHasError = messages.some(
      (m) => m.role === "assistant" && (m as any).isError === true
    );

    if (alreadyHasError) return messages;

    const errorMessage: Message & { isError: true } = {
      id: `error-${nanoid()}`,
      role: "assistant",
      content:
        error.message ||
        "Oops! Something went wrong while generating a response. Please try again.",
      isError: true,
    } as any;

    return [...messages, errorMessage];
  }, [messages, error]);

  useEffect(() => {
    const lastMessage = derivedMessages[derivedMessages.length - 1];
    const userJustSentMessage = lastMessage?.role === "user";

    if (isAtBottom || userJustSentMessage) {
      scrollToBottom("auto");
    }
  }, [derivedMessages, isAtBottom, scrollToBottom]);

  // Show skeleton loader during the very first load when messages are being fetched.
  if (!_messagesLoaded) {
    return (
      <div className="relative flex-1 flex flex-col">
        <MessageSkeletonLoader />
      </div>
    );
  }

  return (
    <div className="relative flex-1 flex flex-col">
      <div className="flex-1 p-6 gap-10 flex flex-col pb-80 thin-scrollbar">
        {derivedMessages.map((m, idx) => {
          const showRetry = m.role === "assistant";

          const model = (() => {
            const msgAny = m as any;
            const id = msgAny.modelId as string | undefined;
            if (id) {
              const found = supportedModels.find((mod) => mod.id === id);
              return found || supportedModels[0];
            }
            return supportedModels[0];
          })();

          return (
            <ImageMessage
              key={m.id || idx}
              message={m}
              showRetry={showRetry}
              onRetry={onRetry}
              onQuestionRetry={onQuestionRetry}
            />
          );
        })}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-xl p-4 rounded-t-xl py-5 rounded-br-xl bg-secondary text-secondary-foreground animate-pulse">
              <ContentGenLoader text="Generating image..." />
            </div>
          </div>
        )}
      </div>
      {showScrollToBottom && (
        <button
          onClick={() => scrollToBottom("smooth")}
          className="fixed bottom-[16px] right-[16px] z-10 p-2 rounded-full bg-primary text-primary-foreground shadow-lg transition-opacity hover:bg-primary/90"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export { ImageMessageList };
