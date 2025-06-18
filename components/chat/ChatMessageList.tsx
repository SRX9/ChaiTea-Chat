"use client";
import React, { useEffect } from "react";
import { Message } from "@ai-sdk/react";
import { ChatMessage } from "./ChatMessage";
import { Model, supportedModels } from "@/config/models";
import { ChevronDown } from "lucide-react";
import { useScroll } from "@/lib/ScrollContext";
import { TypingIndicator } from "./TypingIndicator";
import { MessageSkeletonLoader } from "./MessageSkeletonLoader";
import { nanoid } from "nanoid";

interface ChatMessageListProps {
  messages: Message[];
  isLoading: boolean;
  error?: Error;
  onRetry: (message: Message, model: Model) => void;
  onQuestionRetry: (message: Message, model: Model) => void;
  messagesLoaded: boolean;
}

const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isLoading,
  error,
  onRetry,
  onQuestionRetry,
  messagesLoaded,
}) => {
  const { showScrollToBottom, scrollToBottom, isAtBottom } = useScroll();

  // Create a derived list that appends an error message when present
  const derivedMessages = React.useMemo(() => {
    if (!error) return messages;

    // If messages already include an assistant error message, avoid adding another.
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

  // Auto-scroll behaviour:
  // 1. If the user was already at the bottom, keep them pinned there when
  //    new content arrives (former logic).
  // 2. Additionally, whenever the latest message is from the *user* (i.e. a
  //    brand-new prompt just got sent), force-scroll to the bottom so the user
  //    immediately sees the assistant's streaming response.
  useEffect(() => {
    const lastMessage = derivedMessages[derivedMessages.length - 1];

    const userJustSentMessage = lastMessage?.role === "user";

    if (isAtBottom || userJustSentMessage) {
      scrollToBottom("auto");
    }
  }, [derivedMessages, isAtBottom, scrollToBottom]);

  // Show the skeleton loader **only** during the very first page load – i.e.
  // while the async messages are still being fetched *and* we have nothing to
  // render yet. If the user has already typed a message (messages.length > 0),
  // we skip the skeleton to avoid flashing it again.
  if (!messagesLoaded) {
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
          const isLatest = idx === derivedMessages.length - 1;

          const showRetry = m.role === "assistant";
          const showQuestionRetry = m.role === "user" && !isLoading;

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
            <ChatMessage
              key={m.id || idx}
              message={m}
              isStreaming={isLoading}
              isMostRecent={isLatest}
              showRetry={showRetry}
              model={model}
              onRetry={onRetry}
              onQuestionRetry={onQuestionRetry}
              showQuestionRetry={showQuestionRetry}
            />
          );
        })}
        {isLoading &&
          derivedMessages[derivedMessages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="max-w-xl p-4 rounded-t-xl pt-5 rounded-br-xl bg-secondary text-secondary-foreground">
                <TypingIndicator />
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

export { ChatMessageList };
