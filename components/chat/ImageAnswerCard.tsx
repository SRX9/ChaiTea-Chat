"use client";
import React from "react";
import { Lightbox } from "../ui/lightbox";
import { RotateCcw, Download, Loader2 } from "lucide-react";
import { Model } from "@/config/models";

interface ImageAnswerCardProps {
  imageUrl: string;
  showRetry?: boolean;
  model?: Model;
  onRetry?: (model: Model) => void;
}

const ImageAnswerCard: React.FC<ImageAnswerCardProps> = ({
  imageUrl,
  showRetry = false,
  model,
  onRetry,
}) => {
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);

  const openLightbox = () => setLightboxOpen(true);
  const closeLightbox = () => setLightboxOpen(false);

  const handleDownload = async () => {
    if (downloading) return;
    try {
      setDownloading(true);
      const apiUrl = `/api/misc/download?image_url=${encodeURIComponent(
        imageUrl
      )}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error("Failed to download image");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const filename = imageUrl.split("/").pop() || "downloaded-image";

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error(error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex justify-start">
      <div className="relative max-w-xl">
        <img
          src={imageUrl}
          alt="Generated"
          className="rounded-2xl cursor-pointer shadow hover:opacity-90 transition-opacity"
          onClick={openLightbox}
        />
        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex space-x-2">
          {showRetry && model && (
            <button
              type="button"
              onClick={() => onRetry?.(model)}
              className="p-1 rounded-md bg-black/60 text-white hover:bg-black/70"
            >
              <RotateCcw size={16} />
            </button>
          )}
          {/* Download image button */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="p-1 rounded-md bg-black/60 text-white hover:bg-black/70 disabled:opacity-50"
            aria-label="Download image"
          >
            {downloading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
          </button>
        </div>
      </div>
      {lightboxOpen && (
        <Lightbox
          images={[imageUrl]}
          selected={0}
          onClose={closeLightbox}
          onSelect={() => {}}
        />
      )}
    </div>
  );
};

export { ImageAnswerCard };
