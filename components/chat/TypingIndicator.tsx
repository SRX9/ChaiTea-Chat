"use client";
import React from "react";

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center space-x-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block w-[6px] h-[6px] bg-gray-400 rounded-full"
          style={{
            animation: "typing-bounce 1s infinite ease-in-out",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
};

export { TypingIndicator };
