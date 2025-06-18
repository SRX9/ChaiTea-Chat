import { ChevronLeft, ChevronRight, X } from "lucide-react";
import React from "react";

interface LightboxProps {
  images: string[];
  selected: number;
  onClose: () => void;
  onSelect: (index: number) => void;
}

export const Lightbox: React.FC<LightboxProps> = ({
  images,
  selected,
  onClose,
  onSelect,
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft")
        onSelect(selected === 0 ? images.length - 1 : selected - 1);
      if (e.key === "ArrowRight") onSelect((selected + 1) % images.length);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selected, images.length, onClose, onSelect]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(selected === 0 ? images.length - 1 : selected - 1);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect((selected + 1) % images.length);
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 z-[9999999] flex items-center justify-center backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
        aria-label="Close"
      >
        <X size={24} />
      </button>

      <div className="relative flex items-center justify-center w-full h-full p-16">
        <img
          src={images[selected]}
          alt={`Image ${selected + 1}`}
          className="max-h-full max-w-xl object-contain rounded-lg "
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors p-2 bg-black/20 rounded-full"
            aria-label="Previous image"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors p-2 bg-black/20 rounded-full"
            aria-label="Next image"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}
    </div>
  );
};
