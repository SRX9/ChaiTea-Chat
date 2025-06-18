"use client";

import React, { useRef, useState, useEffect } from "react";
import { Paperclip, ArrowUp, Loader2, X as XIcon } from "lucide-react";
import {
  Model,
  supportedModels,
  EModelModes,
  SupportedModes,
} from "@/config/models";
import { ModelSelector } from "./ModelSelector";
import { ModeSelector } from "./ModeSelector";
import { nanoid } from "nanoid";
import Image from "next/image";
import {
  ALLOWED_EXTENSIONS,
  MAX_ATTACH_IMAGE_FILE_SIZE,
} from "@/Services/CF/utils";
import ImageModal from "./ImageModal";

interface ChatInputProps {
  input: string;
  handleInputChange: (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => void;
  handleSubmit: (
    e: React.FormEvent<HTMLFormElement>,
    options?: { experimental_attachments?: any }
  ) => void;
  isLoading: boolean;
  selectedModel?: Model;
  onSelectModel?: (model: Model) => void;
  selectedMode?: EModelModes;
  onSelectMode?: (mode: EModelModes) => void;
  allowedModes?: EModelModes[];
}

interface FileUploadItem {
  id: string;
  file: File;
  preview: string;
  remoteFilename?: string;
  remoteUrl?: string;
  uploading: boolean;
  error?: string;
}

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  selectedModel,
  onSelectModel,
  selectedMode,
  onSelectMode,
  allowedModes,
}: ChatInputProps) {
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const [modalImage, setModalImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);

  const modesList =
    allowedModes && allowedModes.length > 0 ? allowedModes : SupportedModes;

  const [internalMode, setInternalMode] = useState<EModelModes>(
    selectedMode !== undefined ? selectedMode : modesList[0]
  );

  useEffect(() => {
    if (selectedMode !== undefined && selectedMode !== internalMode) {
      setInternalMode(selectedMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMode]);

  useEffect(() => {
    if (!modesList.includes(internalMode)) {
      setInternalMode(modesList[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedModes]);

  const handleModeChange = (mode: EModelModes) => {
    // Update internal state (for uncontrolled usage) and propagate to parent
    setInternalMode(mode);

    // Bubble up if caller wants it
    onSelectMode?.(mode);

    if (onSelectModel) {
      const currentModelSupported =
        selectedModel?.supportedModes.includes(mode);
      if (!currentModelSupported || selectedModel?.id === "openrouter/auto") {
        const firstSupportedModel = supportedModels.find(
          (m) => m.supportedModes.includes(mode) && m.id !== "openrouter/auto"
        );
        if (firstSupportedModel) {
          onSelectModel(firstSupportedModel);
        }
      }
    }
  };

  const currentMode = selectedMode !== undefined ? selectedMode : internalMode;

  // Disable attachments entirely when in Image Generation mode.
  const allowAttachments = currentMode !== EModelModes.IMAGE_GENERATION;

  const availableModels = supportedModels.filter((m) =>
    m.supportedModes.includes(currentMode)
  );

  // ------------ Attachment Helpers -----------------
  const validateFile = (file: File): string | null => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      return "Unsupported file type";
    }
    if (file.size > MAX_ATTACH_IMAGE_FILE_SIZE) {
      return "Image size must be under 5MB";
    }
    return null;
  };

  const uploadFile = async (item: FileUploadItem) => {
    const formData = new FormData();
    formData.append("file", item.file);

    try {
      const res = await fetch("/api/attachments", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? {
                ...f,
                uploading: false,
                remoteFilename: data.filename,
                remoteUrl: data.url,
                preview: data.url,
              }
            : f
        )
      );
    } catch (err: any) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id ? { ...f, uploading: false, error: err.message } : f
        )
      );
    }
  };

  // Maximum number of attachments depends on the selected mode.
  // • Normal chat & web-search: up to 5 images (existing behaviour)
  // • Image editing          : exactly 1 image
  // • Image generation       : 0 (handled separately by `allowAttachments`)
  const MAX_ATTACHMENTS = currentMode === EModelModes.IMAGE_EDITING ? 1 : 5;

  const onFilesSelected = (selectedFiles: FileList | File[]) => {
    if (!allowAttachments) return;

    const arr = Array.from(selectedFiles);

    // In image-editing mode we only allow a single attachment. Selecting a new
    // image replaces the previous one (if any).
    if (currentMode === EModelModes.IMAGE_EDITING) {
      const file = arr[0];
      if (!file) return;

      const error = validateFile(file);
      if (error) {
        alert(error);
        return;
      }

      // If an attachment already exists, delete it first so that the UI &
      // backend stay consistent.
      if (files.length > 0) {
        handleDelete(files[0].id);
      }

      const id = nanoid();
      const preview = URL.createObjectURL(file);
      const newItem: FileUploadItem = {
        id,
        file,
        preview,
        uploading: true,
      };
      setFiles([newItem]);
      uploadFile(newItem);
      return;
    }

    // Default behaviour (chat, web-search) – up to MAX_ATTACHMENTS
    const remainingSlots = MAX_ATTACHMENTS - files.length;
    arr.slice(0, remainingSlots).forEach((file) => {
      const error = validateFile(file);
      if (error) {
        alert(error);
        return;
      }

      const id = nanoid();
      const preview = URL.createObjectURL(file);
      const newItem: FileUploadItem = {
        id,
        file,
        preview,
        uploading: true,
      };
      setFiles((prev) => [...prev, newItem]);
      uploadFile(newItem);
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!allowAttachments) return;
    if (e.target.files) {
      onFilesSelected(e.target.files);
    }
  };

  const triggerFileSelect = () => {
    if (!allowAttachments) return;
    inputRef.current?.click();
  };

  // Track whether any attachment deletion request is in-flight so that the
  // user cannot submit a message while a delete is occurring. We already
  // have per-file `uploading` flags, so the combination of those two states
  // will tell us if any attachment is currently "busy".
  const [isDeletingAttachment, setIsDeletingAttachment] = useState(false);

  async function handleDelete(id: string) {
    const target = files.find((f) => f.id === id);
    if (!target) return;

    // Revoke preview url to free memory if it's a local blob
    if (target.preview.startsWith("blob:")) {
      URL.revokeObjectURL(target.preview);
    }

    // Optimistic UI remove
    setFiles((prev) => prev.filter((f) => f.id !== id));

    if (target.remoteFilename) {
      // Call API to delete and mark deletion in-flight so that the submit
      // button stays disabled until the request is finished.
      try {
        setIsDeletingAttachment(true);
        await fetch("/api/attachments", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ filename: target.remoteFilename }),
        });
      } finally {
        setIsDeletingAttachment(false);
      }
    }
  }

  // Drag & drop handlers
  const [isDragging, setIsDragging] = useState(false);

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!allowAttachments) return;
  };

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!allowAttachments) return;
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!allowAttachments) return;
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!allowAttachments) return;
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  // ------------ Render -------------
  return (
    <div>
      <div
        className="fixed bottom-0 inset-x-0 z-1 px-2 mb-2 w-full max-w-3xl mx-auto"
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {allowAttachments && isDragging && (
          <div className="absolute inset-0 z-30 flex items-center justify-center rounded-2xl bg-black/60 text-white text-lg font-semibold pointer-events-none">
            Drop to upload
          </div>
        )}

        {allowAttachments && files.length > 0 && (
          <div className="bg-card border-t border-l border-r border-border rounded-t-2xl mx-5 px-1 shadow-lg">
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center overflow-x-auto">
                <span className="text-muted-foreground flex-shrink-0">@</span>
                <div className="flex items-center gap-2 ml-2">
                  {files.map((f) => (
                    <div
                      key={f.id}
                      className="relative flex items-center bg-muted rounded-md p-1 text-xs cursor-pointer select-none"
                      onClick={() => {
                        if (!f.uploading) {
                          setModalImage({ src: f.preview, alt: f.file.name });
                        }
                      }}
                    >
                      {f.uploading ? (
                        <Loader2 size={12} className="animate-spin mr-1" />
                      ) : (
                        <Image
                          src={f.preview}
                          alt={f.file.name}
                          width={16}
                          height={16}
                          className="mr-1 rounded-2xl"
                        />
                      )}
                      <span className="mr-1">Image</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(f.id);
                        }}
                        className="mx-1 hover:bg-muted rounded-full"
                      >
                        <XIcon size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="shadow-2xl rounded-2xl border border-border">
          <form
            onSubmit={(e) => {
              const attachments = files
                .filter((f) => !f.uploading && !f.error && f.remoteUrl)
                .map((f) => ({
                  url: f.remoteUrl!,
                  name: f.file.name,
                  contentType: f.file.type,
                }));

              handleSubmit(
                e as any,
                attachments.length
                  ? { experimental_attachments: attachments }
                  : undefined
              );

              setFiles((prev) => prev.filter((f) => f.uploading));
            }}
            className="bg-card rounded-2xl"
          >
            {/* Input */}
            <textarea
              value={input}
              onChange={handleInputChange}
              placeholder="Plan, search, build anything"
              className="w-full bg-transparent p-4 text-foreground placeholder-muted-foreground focus:outline-none resize-none overflow-y-auto thin-scrollbar"
              rows={3}
              maxLength={10000}
              disabled={isLoading}
            />

            <div className="flex items-center justify-between p-1">
              <div className="flex items-center gap-2 pl-1">
                <ModeSelector
                  modes={modesList}
                  selectedMode={currentMode}
                  onSelectMode={handleModeChange}
                />
                <ModelSelector
                  models={availableModels}
                  selectedModel={selectedModel}
                  onSelectModel={onSelectModel}
                  selectedMode={currentMode}
                />
              </div>
              <div className="flex items-center gap-3 m-1">
                {/* Hide the attachment button if: (a) attachments are disabled (image-gen) or (b) max (#) reached for the current mode */}
                {allowAttachments && files.length < MAX_ATTACHMENTS && (
                  <button
                    type="button"
                    className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100 disabled:text-zinc-400"
                    onClick={triggerFileSelect}
                    disabled={isLoading}
                  >
                    <Paperclip size={20} />
                  </button>
                )}
                {/* Submit button */}
                <button
                  className="rounded-lg p-2 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:bg-zinc-400 disabled:text-zinc-200 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-400"
                  type="submit"
                  disabled={
                    isLoading ||
                    !input.trim() ||
                    files.some((f) => f.uploading) ||
                    isDeletingAttachment
                  }
                >
                  <ArrowUp size={20} />
                </button>
              </div>
            </div>
            {/* Hidden file input (disabled for Image Generation mode) */}
            {allowAttachments && (
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                multiple
                hidden
                ref={inputRef}
                onChange={handleFileInputChange}
              />
            )}
          </form>
        </div>
      </div>
      {modalImage && (
        <ImageModal
          src={modalImage.src}
          alt={modalImage.alt}
          onClose={() => setModalImage(null)}
        />
      )}
    </div>
  );
}
