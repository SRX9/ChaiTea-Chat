"use client";
import React from "react";
import { MemoizedMarkdown } from "./memoized-markdown";
import { RotateCcw, AlertTriangle } from "lucide-react";
import { Model, supportedModels, EModelModes } from "@/config/models";
import { ModelSelector } from "./ModelSelector";

interface AnswerCardProps {
  content: string;
  isStreaming?: boolean;
  showRetry?: boolean;
  model?: Model;
  onRetry?: (model: Model) => void;
  isError?: boolean;
  isMostRecent?: boolean;
  /** The mode under which the answer was generated. Determines available models in the retry selector. */
  selectedMode?: EModelModes;
}

const AnswerCard: React.FC<AnswerCardProps> = ({
  content,
  isStreaming,
  showRetry = false,
  model,
  onRetry,
  isError = false,
  isMostRecent = false,
  selectedMode = EModelModes.NORMAL_CHAT,
}) => {
  const [retryModel, setRetryModel] = React.useState<Model>(
    model || supportedModels[0]
  );

  const [showPopover, setShowPopover] = React.useState(false);
  const [openBelow, setOpenBelow] = React.useState(false);

  const triggerRef = React.useRef<HTMLDivElement>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);

  // Derive list of models depending on the mode. For image generation, only show models that explicitly support that mode.
  const modelsForSelector = React.useMemo(() => {
    if (selectedMode === EModelModes.IMAGE_GENERATION) {
      return supportedModels.filter((m) =>
        m.supportedModes.includes(EModelModes.IMAGE_GENERATION)
      );
    }
    return supportedModels;
  }, [selectedMode]);

  // close popover on outside click
  React.useEffect(() => {
    if (!showPopover) return;
    function handle(e: MouseEvent) {
      const target = e.target as Node;
      if (!target) return;
      if (!(target as HTMLElement).closest("[data-retry-popover]")) {
        setShowPopover(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [showPopover]);

  // decide whether to open the popover above or below based on available space
  React.useEffect(() => {
    if (!showPopover) return;

    function updatePosition() {
      if (!triggerRef.current || !popoverRef.current) return;

      const triggerRect = triggerRef.current.getBoundingClientRect();

      // If the trigger is in the upper half of the viewport, open below;
      // otherwise, open above.
      const viewportMidpoint = window.innerHeight / 2;
      setOpenBelow(triggerRect.top < viewportMidpoint);
    }

    // run once on mount
    updatePosition();

    // also update on window resize because available space can change
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [showPopover]);

  return (
    <div className="flex justify-start">
      <div
        className={`relative max-w-3xl px-4 py-2 rounded-lg overflow-visible ${
          isError
            ? "text-destructive-foreground border rounded-2xl py-5 px-5 "
            : ""
        } prose dark:prose-invert`}
      >
        {isError ? (
          <div className="flex items-start gap-2">
            <AlertTriangle size={18} className="mt-0.5 text-destructive" />
            {/* Display the actual error message coming from the server */}
            <MemoizedMarkdown content={content} />
          </div>
        ) : (
          <>
            <MemoizedMarkdown content={content} />
            {isStreaming && isMostRecent && (
              <span className="animate-pulse ml-1 inline-flex">▍</span>
            )}
          </>
        )}
        {showRetry && (!isStreaming || !isMostRecent) && (
          <div
            className="flex items-center gap-2 mt-2 relative"
            data-retry-popover
            ref={triggerRef}
          >
            {/* Display model name */}
            {model && (
              <span className="text-xs text-muted-foreground bg-accent rounded-md px-2 py-1">
                {model.name}
              </span>
            )}
            {/* Retry with tooltip */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => setShowPopover((p) => !p)}
                className="p-1 rounded hover:bg-muted flex items-center justify-center"
              >
                <RotateCcw size={16} />
              </button>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-xs text-background opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                Retry
              </span>
            </div>

            {showPopover && (
              <div
                ref={popoverRef}
                className={`absolute left-0 w-72 bg-popover border border-border rounded-lg shadow-lg p-3 z-20 space-y-3 ${
                  openBelow ? "top-full mt-2" : "bottom-full mb-2"
                }`}
              >
                <div>
                  <div className="text-xs uppercase font-heading text-muted-foreground pb-2">
                    Model
                  </div>
                  <ModelSelector
                    models={modelsForSelector}
                    selectedModel={retryModel}
                    onSelectModel={setRetryModel}
                    align="left"
                    selectedMode={selectedMode}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowPopover(false);
                    onRetry?.(retryModel);
                  }}
                  className="w-full flex items-center justify-between px-2 gap-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-md py-1 text-sm"
                >
                  Regenerate <RotateCcw size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export { AnswerCard };
