"use client";

import { FC, useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import clsx from "clsx";
import { SunFilledIcon, MoonFilledIcon } from "@/components/icons";

export interface ThemeSwitchProps {
  className?: string;
}

export const ThemeSwitch: FC<ThemeSwitchProps> = ({ className }) => {
  const { theme, resolvedTheme, setTheme } = useTheme();

  // Avoid hydration mismatch by rendering only after the component has mounted
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // next-themes may return undefined on first render; fallback to "system"
  const current = theme ?? "system";

  const [open, setOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (value: string) => {
    setTheme(value);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={clsx("relative", className)}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Select theme"
        className="p-2 rounded-md hover:bg-accent flex items-center justify-center"
      >
        {mounted &&
        (current === "dark" ||
          (current === "system" && resolvedTheme === "dark")) ? (
          <MoonFilledIcon className="w-5 h-5" />
        ) : (
          mounted && <SunFilledIcon className="w-5 h-5" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-32 bg-background border border-border rounded-md shadow-lg text-sm z-50">
          {[
            { label: "Light", value: "light" },
            { label: "Dark", value: "dark" },
            { label: "System", value: "system" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={clsx(
                "w-full text-left px-3 py-1.5 hover:bg-accent",
                opt.value === current && "font-semibold"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
