"use client";
import React from "react";
import { Message } from "@ai-sdk/react";
import { QuestionCard } from "./QuestionCard";
import { ImageAnswerCard } from "./ImageAnswerCard";
import { AnswerCard } from "./AnswerCard";
import { Model, supportedModels, EModelModes } from "@/config/models";

interface ImageMessageProps {
  message: Message;
  showRetry?: boolean;
  onRetry?: (message: Message, model: Model) => void;
  onQuestionRetry?: (message: Message, model: Model) => void;
}

const parseImageUrl = (content: unknown): string | null => {
  if (!content) return null;
  if (typeof content === "string") {
    try {
      const obj = JSON.parse(content);
      if (typeof obj?.imageUrl === "string") return obj.imageUrl;
    } catch {
      // Not JSON
      if (content.startsWith("http")) return content;
    }
  } else if (typeof content === "object" && (content as any).imageUrl) {
    return (content as any).imageUrl as string;
  }
  return null;
};

const ImageMessage: React.FC<ImageMessageProps> = ({
  message,
  showRetry,
  onRetry,
  onQuestionRetry,
}) => {
  const model = (() => {
    const msgAny = message as any;
    const id = msgAny.modelId as string | undefined;
    if (id) {
      const found = supportedModels.find((mod) => mod.id === id);
      return found || supportedModels[0];
    }
    return supportedModels[0];
  })();

  if (message.role === "user") {
    const attachments = (message as any).experimental_attachments as
      | { url: string; name?: string; contentType?: string }[]
      | undefined;

    return (
      <QuestionCard
        content={String(message.content)}
        attachments={attachments}
        onRetry={(m) => onQuestionRetry?.(message, m)}
        showRetry={false}
        model={model}
      />
    );
  }

  if (message.role === "assistant") {
    const isError = (message as any).isError === true;

    if (isError) {
      // Render a regular text answer card that shows the error details.
      return (
        <AnswerCard
          content={String(message.content)}
          isError
          showRetry={showRetry}
          model={model}
          onRetry={(m) => onRetry?.(message, m)}
          selectedMode={EModelModes.IMAGE_GENERATION}
        />
      );
    }

    const imageUrl = parseImageUrl(message.content);
    if (!imageUrl) return null;
    return (
      <ImageAnswerCard
        imageUrl={imageUrl}
        showRetry={showRetry}
        model={model}
        onRetry={(m) => onRetry?.(message, m)}
      />
    );
  }

  return null;
};

export { ImageMessage };
