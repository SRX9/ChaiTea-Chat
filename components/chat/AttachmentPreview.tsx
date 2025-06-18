"use client";

import Image from "next/image";
import { X, Loader2 } from "lucide-react";
import React from "react";

interface AttachmentPreviewProps {
  url: string;
  name: string;
  isUploading: boolean;
  onDelete: () => void;
}

export default function AttachmentPreview({
  url,
  name,
  isUploading,
  onDelete,
}: AttachmentPreviewProps) {
  return (
    <div className="relative w-24 h-24 rounded-md overflow-hidden bg-muted flex-shrink-0">
      <Image src={url} alt={name} fill sizes="96px" className="object-cover" />

      {isUploading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
          <Loader2 className="animate-spin text-white" size={24} />
        </div>
      )}

      <button
        type="button"
        onClick={onDelete}
        className="absolute top-1 right-1 bg-background/60 rounded-full p-0.5 hover:bg-background/80"
      >
        <X size={16} className="text-white" />
      </button>
    </div>
  );
}
