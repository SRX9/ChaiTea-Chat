"use client";
import React from "react";
import { RotateCcw, Maximize } from "lucide-react";
import { Model, supportedModels, EModelModes } from "@/config/models";
import { ModelSelector } from "./ModelSelector";
import { Lightbox } from "../ui/lightbox";

interface Attachment {
  url: string;
  name?: string;
  contentType?: string;
}

interface QuestionCardProps {
  content: string;
  attachments?: Attachment[];
  model?: Model;
  onRetry?: (model: Model) => void;
  showRetry?: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  content,
  attachments,
  model,
  onRetry,
  showRetry,
}) => {
  const [retryModel, setRetryModel] = React.useState<Model>(
    model || supportedModels[0]
  );
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState(0);

  const openLightbox = (index: number) => {
    setSelectedImage(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const [showPopover, setShowPopover] = React.useState(false);
  const [openBelow, setOpenBelow] = React.useState(false);

  const triggerRef = React.useRef<HTMLDivElement>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);

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

  const hasAttachments = attachments && attachments.length > 0;
  const imagesToShow = hasAttachments ? attachments.slice(0, 4) : [];
  const remainingCount = hasAttachments
    ? attachments.length - imagesToShow.length
    : 0;
  const numImages = imagesToShow.length;
  const isSingleImage = numImages === 1;

  return (
    <>
      <div className="group flex justify-end pt-10 ">
        <div className="flex items-center gap-2">
          {showRetry && (
            <div
              className="flex items-center relative"
              data-retry-popover
              ref={triggerRef}
            >
              {/* Retry with tooltip */}
              <div className="relative group/tooltip">
                <button
                  type="button"
                  onClick={() => setShowPopover((p) => !p)}
                  className="p-1 rounded hover:bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <RotateCcw size={16} />
                </button>
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-xs text-background opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity">
                  Retry
                </span>
              </div>

              {showPopover && (
                <div
                  ref={popoverRef}
                  className={`absolute right-0 w-72 bg-popover border border-border rounded-lg shadow-lg p-3 z-20 space-y-3 ${
                    openBelow ? "top-full mt-2" : "bottom-full mb-2"
                  }`}
                >
                  <div>
                    <div className="text-xs uppercase font-heading text-muted-foreground pb-2">
                      Model
                    </div>
                    <ModelSelector
                      models={supportedModels}
                      selectedModel={retryModel}
                      onSelectModel={setRetryModel}
                      selectedMode={EModelModes.NORMAL_CHAT}
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
          <div className=" overflow-hidden flex flex-col justify-end items-end">
            {hasAttachments && (
              <div className="pl-2 py-2 max-w-xl">
                <div className="grid grid-cols-2 gap-2">
                  {imagesToShow.map((img, i) => {
                    const isLastImage = i === imagesToShow.length - 1;
                    const showPlusMore = remainingCount > 0 && isLastImage;
                    const isThreeLayoutFirst = numImages === 3 && i === 0;
                    const spanFullWidth = isThreeLayoutFirst || isSingleImage;

                    return (
                      <div
                        key={img.url}
                        className={`relative cursor-pointer group/attachment rounded-t-2xl rounded-bl-2xl overflow-hidden ${
                          spanFullWidth ? "col-span-2" : ""
                        }`}
                        onClick={() => openLightbox(i)}
                      >
                        <img
                          src={img.url}
                          alt={img.name || `attachment ${i + 1}`}
                          className={`object-cover w-full h-full group-hover/attachment:scale-105 transition-transform duration-300 ${
                            spanFullWidth ? "aspect-video" : "aspect-square"
                          }`}
                        />
                        <div className="absolute inset-0 bg-black/10"></div>
                        {showPlusMore ? (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white text-2xl font-bold">
                              +{remainingCount}
                            </span>
                          </div>
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover/attachment:opacity-100 transition-opacity flex items-end justify-end p-1">
                            <Maximize
                              size={20}
                              className="text-white drop-shadow-lg"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div
              className={`bg-accent rounded-b-2xl rounded-tl-2xl w-[fit-content]  prose dark:prose-invert flex justify-end max-w-xl ${
                content?.length > 75 ? "p-5" : "px-5 py-3"
              } `}
            >
              <p className="whitespace-pre-wrap break-words">{content}</p>
            </div>
          </div>
        </div>
      </div>
      {lightboxOpen && attachments && (
        <Lightbox
          images={attachments.map((a) => a.url)}
          selected={selectedImage}
          onClose={closeLightbox}
          onSelect={setSelectedImage}
        />
      )}
    </>
  );
};

export { QuestionCard };
