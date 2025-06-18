"use client";

import React, { useState, useEffect, useRef } from "react";
import { EModelModes } from "@/config/models";
import type { LucideIcon } from "lucide-react";
import {
  Check,
  Search,
  Paintbrush,
  Image as ImageIcon,
  MessageSquare,
  Sparkles,
} from "lucide-react";

interface ModeSelectorProps {
  modes: EModelModes[];
  selectedMode: EModelModes;
  onSelectMode: (mode: EModelModes) => void;
}

// Map every mode to a meaningful icon
const modeIcons: Record<EModelModes, LucideIcon> = {
  [EModelModes.WEB_SEARCH]: Search,
  [EModelModes.IMAGE_EDITING]: Paintbrush,
  [EModelModes.IMAGE_GENERATION]: ImageIcon,
  [EModelModes.NORMAL_CHAT]: MessageSquare,
};

export function ModeSelector({
  modes,
  selectedMode,
  onSelectMode,
}: ModeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

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

  const handleSelectMode = (mode: EModelModes) => {
    onSelectMode(mode);
    setIsOpen(false);
  };

  const Icon = modeIcons[selectedMode] || MessageSquare;

  return (
    <div className="relative -mb-[3px]" ref={selectorRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-foreground bg-muted px-2 py-1 rounded-md text-sm flex items-center gap-2"
      >
        <Icon size={16} />
        <span>{selectedMode}</span>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-60 bg-popover border border-border rounded-lg shadow-lg text-foreground z-10">
          <div className="max-h-64 my-[2px] overflow-y-auto p-2 flex flex-col gap-2">
            {modes.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => handleSelectMode(mode)}
                className={`w-full text-left flex items-center rounded-lg justify-between p-2 hover:bg-muted cursor-pointer ${
                  selectedMode === mode ? "bg-muted" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  {React.createElement(modeIcons[mode], { size: 16 })}
                  <span>{mode}</span>
                </div>
                {selectedMode === mode && <Check size={16} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
