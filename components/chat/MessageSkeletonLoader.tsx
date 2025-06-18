"use client";

import React from "react";

/**
 * Renders a list of animated skeleton chat bubbles that mimics a typical
 * conversation layout while content is being fetched.
 */
export const MessageSkeletonLoader: React.FC = () => {
  // Hard-coded widths so every bubble has slightly different length which
  // feels more natural.
  const widths = [
    "w-4/5",
    "w-3/5",
    "w-2/4",
    "w-1/2",
    "w-3/4",
    "w-1/2",
    "w-2/3",
    "w-full",
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 gap-10 flex flex-col pb-80 thin-scrollbar animate-fade-in">
      {widths.map((w, idx) => (
        <div
          key={idx}
          className={`flex ${idx % 2 === 0 ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-xl p-4 bg-secondary/70 ${w} space-y-2 animate-pulse ${
              idx % 2 !== 0
                ? "rounded-tl-2xl rounded-br-2xl rounded-tr-2xl rounded-bl-none"
                : "rounded-tr-2xl rounded-bl-2xl rounded-tl-2xl rounded-br-none"
            }`}
          >
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-11/12" />
            <div className="h-4 bg-muted rounded w-5/12" />
          </div>
        </div>
      ))}
    </div>
  );
};
