"use client";

import React, { useState, useEffect, useRef } from "react";
import { Model, EModelIntelligence, EModelModes } from "@/config/models";
import {
  BrainCircuit,
  Cpu,
  Check,
  LucideChevronsUpDown,
  LucidePlus,
} from "lucide-react";
import { useUser } from "@/lib/auth-client";
import { useRouter } from "nextjs-toploader/app";

interface ModelSelectorProps {
  models: Model[];
  selectedModel?: Model;
  onSelectModel?: (model: Model) => void;
  align?: "left" | "right";
  selectedMode: EModelModes;
}

const ToggleSwitch = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => {
  return (
    <button
      onClick={() => onChange(!checked)}
      type="button"
      role="switch"
      aria-checked={checked}
      className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer ${
        checked ? "bg-primary" : "bg-muted"
      }`}
    >
      <div
        className={`bg-foreground w-4 h-4 rounded-full shadow-md transform transition-transform ${
          checked ? "translate-x-4" : ""
        }`}
      ></div>
    </button>
  );
};

export function ModelSelector({
  models,
  selectedModel,
  onSelectModel,
  align = "right",
  selectedMode,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  // Deterministic initial value (false). We hydrate with the persisted value
  // only after the component mounts on the client to keep server and first
  // client render identical.
  const [thinkingMode, setThinkingMode] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [openBelow, setOpenBelow] = useState(false);
  const [computedAlign, setComputedAlign] = useState(align);
  const { user } = useUser();
  // IDs of models the user has explicitly disabled. When null, treat as none disabled.
  const [disabledModelIds, setDisabledModelIds] = useState<string[] | null>(
    null
  );
  const router = useRouter();
  const fallbackModel = models[0];

  useEffect(() => {
    if (onSelectModel) {
      const savedModelId =
        selectedMode === EModelModes.NORMAL_CHAT
          ? localStorage.getItem("chaitea-selected-model-id")
          : null;
      const model = models.find((m) => m.id === savedModelId);
      if (model) {
        onSelectModel(model);
      } else if (!selectedModel) {
        onSelectModel(fallbackModel);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) {
      const lsKey = `${user.id}_models_selections`;
      const storedSelection = localStorage.getItem(lsKey);
      if (storedSelection) {
        try {
          setDisabledModelIds(JSON.parse(storedSelection));
        } catch {
          // If parsing fails, assume nothing is disabled
          setDisabledModelIds(null);
        }
      } else {
        setDisabledModelIds(null); // No disabled models stored
      }
    }
  }, [user]);

  useEffect(() => {
    const stored = localStorage.getItem("chaitea-thinking-mode");
    if (stored !== null) {
      setThinkingMode(stored === "true");
    }
  }, []);

  const currentModel = selectedModel ?? fallbackModel;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        selectorRef.current &&
        !selectorRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectorRef]);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportMidpointY = window.innerHeight / 2;
    setOpenBelow(rect.top < viewportMidpointY);

    const viewportMidpointX = window.innerWidth / 2;
    setComputedAlign(rect.left < viewportMidpointX ? "left" : "right");
  };

  // decide whether to open the dropdown above or below based on trigger position
  useEffect(() => {
    if (!isOpen) return;

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [isOpen]);

  const modelsForCurrentMode =
    (selectedMode === EModelModes.NORMAL_CHAT ||
      selectedMode === EModelModes.WEB_SEARCH) &&
    disabledModelIds
      ? models.filter((model) => !disabledModelIds.includes(model.id))
      : models;

  const filteredModels = modelsForCurrentMode
    .filter((model) =>
      model.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((model) =>
      selectedMode === EModelModes.IMAGE_GENERATION
        ? true // Show all models for image generation
        : thinkingMode
        ? model.isReasoning
        : !model.isReasoning
    );

  // Returns the appropriate icon (and color) for a model based on whether it is a
  // reasoning model and its intelligence level.
  const getModelIcon = (model: Model) => {
    // Determine icon: Brain for reasoning, CPU for non-reasoning.
    const IconComponent = model?.isReasoning ? BrainCircuit : Cpu;

    // Determine color class based on intelligence level.
    let colorClass = "text-muted-foreground";
    switch (model?.intelligence) {
      case EModelIntelligence.QUICK:
        colorClass = "text-green-400";
        break;
      case EModelIntelligence.SMART:
        colorClass = "text-yellow-400";
        break;
      case EModelIntelligence.GENIUS:
        colorClass = "text-purple-400";
        break;
    }

    return <IconComponent size={16} className={colorClass} />;
  };

  const handleToggle = () => {
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen((prev) => !prev);
  };

  const handleSetThinkingMode = (value: boolean) => {
    setThinkingMode(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("chaitea-thinking-mode", String(value));
    }
  };

  return (
    <div className="relative -mb-[3px]" ref={selectorRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className=" px-2 cursor-pointer rounded-lg text-sm text-muted-foreground flex justify-start items-center gap-2"
      >
        <>
          {getModelIcon(currentModel)}
          <span>{currentModel?.name}</span>
        </>
        <LucideChevronsUpDown size={16} />
      </button>

      {isOpen && (
        <div
          className={`absolute w-80 bg-popover border border-border rounded-lg shadow-lg text-foreground z-10 ${
            openBelow ? "top-full mt-2" : "bottom-full mb-2"
          } ${computedAlign === "right" ? "right-0" : "left-0"}`}
        >
          <div className="p-2 border-b border-border">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for Models..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-muted border-border rounded-md py-1.5 px-2 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          {[EModelModes.NORMAL_CHAT, EModelModes.WEB_SEARCH].includes(
            selectedMode
          ) && (
            <div className="p-2 space-y-2 border-b border-border">
              <div className="flex items-center justify-between">
                <span>Thinking</span>
                <ToggleSwitch
                  checked={thinkingMode}
                  onChange={handleSetThinkingMode}
                />
              </div>
            </div>
          )}
          <div className="max-h-60 overflow-y-auto flex flex-col gap-[6px] thin-scrollbar px-2 py-3">
            {filteredModels.map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={() => {
                  if (onSelectModel) {
                    onSelectModel(model);
                    localStorage.setItem("chaitea-selected-model-id", model.id);
                  }
                  setIsOpen(false);
                }}
                className={`w-full text-left flex items-center rounded-lg justify-between p-2 hover:bg-muted cursor-pointer ${
                  currentModel?.id === model.id ? "bg-muted" : ""
                }`}
              >
                <div className="flex items-center space-x-2">
                  {getModelIcon(model)}
                  <span>{model.name}</span>
                  {model.maxOnly && (
                    <span className="text-xs text-muted-foreground">
                      MAX Only
                    </span>
                  )}
                </div>
                {currentModel?.id === model.id && <Check size={16} />}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                router.push("/account/models");
              }}
              className="w-full flex items-center mt-1 rounded-lg gap-2 justify-between text-left p-2 px-3 text-sm border-2 bg-transparent  text-secondary-foreground hover:bg-secondary/90 cursor-pointer"
            >
              Add models <LucidePlus size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
