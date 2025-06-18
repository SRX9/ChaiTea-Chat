"use client";

import { FormEvent, useState } from "react";
import { nanoid } from "nanoid";
import { ChatInput } from "@/components/chat/ChatInput";
import { useUser } from "@/lib/auth-client";
import { Model, supportedModels, EModelModes } from "@/config/models";
import { useRouter } from "nextjs-toploader/app";
import { siteConfig } from "@/config/site";
import { MessageCircle, Globe, Image as ImageIcon, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { steelCSS } from "@/config/ts-style";
import Image from "next/image";

export default function Page() {
  const router = useRouter();
  const user = useUser();
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState<Model>(supportedModels[0]);
  const [selectedMode, setSelectedMode] = useState<EModelModes>(
    EModelModes.NORMAL_CHAT
  );

  // New feature cards describing each mode
  const modeFeatures = [
    {
      mode: EModelModes.NORMAL_CHAT,
      title: "Chat",
      description:
        "Fast, friendly AI conversations for brainstorming, Q&A, and general assistance.",
      icon: MessageCircle,
    },
    {
      mode: EModelModes.WEB_SEARCH,
      title: "Live Web Search",
      description:
        "Up-to-date answers enriched with real-time web information.",
      icon: Globe,
    },
    {
      mode: EModelModes.IMAGE_GENERATION,
      title: "Image Generation",
      description: "Transform your ideas into breathtaking visuals in seconds.",
      icon: ImageIcon,
    },
    {
      mode: EModelModes.IMAGE_EDITING,
      title: "Image Editing",
      description:
        "Enhance, expand, and remix your images with a dash of AI magic.",
      icon: Wand2,
    },
  ] as const;

  const handleSubmit = (
    e: FormEvent<HTMLFormElement>,
    options?: { experimental_attachments?: any }
  ) => {
    e.preventDefault();
    if (!user?.isLoggedIn) {
      router.push(`/login`);
      return;
    }

    if (input.trim()) {
      // For Image Editing mode, an attachment is mandatory.
      if (
        selectedMode === EModelModes.IMAGE_EDITING &&
        !(
          options?.experimental_attachments &&
          options.experimental_attachments.length === 1
        )
      ) {
        alert("Please attach exactly one image to edit.");
        return;
      }

      const id = nanoid();

      // Persist initial data so the thread page can send it as the first message
      localStorage.setItem("chaitea-initial-prompt", input.trim());
      localStorage.setItem("chaitea-initial-model", selectedModel.id);
      localStorage.setItem("chaitea-initial-mode", selectedMode);
      localStorage.setItem("chaitea-selected-model-image", selectedModel.id);

      if (options?.experimental_attachments) {
        try {
          localStorage.setItem(
            "chaitea-initial-attachments",
            JSON.stringify(options.experimental_attachments)
          );
        } catch {
          // Fallback: ignore if saving fails (e.g. quota exceeded)
        }
      }

      // Decide which thread route to use based on the chosen mode
      const basePath =
        selectedMode === EModelModes.IMAGE_GENERATION ||
        selectedMode === EModelModes.IMAGE_EDITING
          ? "/folder/thread/image"
          : "/folder/thread";

      router.push(`${basePath}/${id}?new=1`);
    }
  };

  const handleInputChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setInput(e.target.value);
  };

  return (
    <div className="flex flex-col min-h-screen justify-center items-center py-12">
      {/* Hero Section */}
      <section className="flex flex-col max-w-[350px] w-full gap-4 pb-40 justify-center items-center  ">
        <Image
          src={siteConfig.logo}
          alt="Logo"
          className="w-24 h-24 rounded-md"
          width={96}
          height={96}
        />
        <div className="flex flex-col justify-center items-center">
          <h1 className={cn("text-5xl font-bold ", steelCSS)}>
            {siteConfig.name}
          </h1>
          <p className="text-base text-zinc-400 mt-1">
            Fast, Minimalist & One For All - All For One AI Chat App
          </p>
        </div>
      </section>

      {/* Chat Input */}
      <section className="mt-16 w-full max-w-3xl mx-auto px-4">
        <ChatInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={false}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          selectedMode={selectedMode}
          onSelectMode={setSelectedMode}
        />
      </section>
    </div>
  );
}
