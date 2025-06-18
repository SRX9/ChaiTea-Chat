"use client";
import React from "react";
import { Message } from "@ai-sdk/react";
import { QuestionCard } from "./QuestionCard";
import { AnswerCard } from "./AnswerCard";
import { Model } from "@/config/models";

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  showRetry?: boolean;
  model?: Model;
  onRetry?: (message: Message, model: Model) => void;
  onQuestionRetry?: (message: Message, model: Model) => void;
  showQuestionRetry?: boolean;
  isMostRecent?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isStreaming,
  showRetry,
  model,
  onRetry,
  onQuestionRetry,
  showQuestionRetry,
  isMostRecent,
}) => {
  if (message.role === "user") {
    return (
      <QuestionCard
        content={String(message.content)}
        onRetry={(model) => onQuestionRetry?.(message, model)}
        attachments={message.experimental_attachments}
        showRetry={showQuestionRetry}
        model={model}
      />
    );
  }

  if (message.role === "assistant") {
    const isError = (message as any).isError === true;
    return (
      <AnswerCard
        content={String(message.content)}
        isStreaming={isStreaming}
        showRetry={showRetry}
        model={model}
        onRetry={(newModel) => onRetry?.(message, newModel)}
        isError={isError}
        isMostRecent={isMostRecent}
      />
    );
  }

  return null;
};

export { ChatMessage };
