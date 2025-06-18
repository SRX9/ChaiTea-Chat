"use client";

import { createPortal } from "react-dom";
import Image from "next/image";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface ImageModalProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export default function ImageModal({ src, alt, onClose }: ImageModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative max-w-full max-h-full p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={src}
          alt={alt}
          width={800}
          height={800}
          className="object-contain max-h-screen max-w-screen"
        />
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 bg-black/60 rounded-full p-1 hover:bg-black/80"
        >
          <X size={24} className="text-white" />
        </button>
      </div>
    </div>,
    document.body
  );
}
