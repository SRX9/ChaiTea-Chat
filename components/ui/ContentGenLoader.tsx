"use client";

import { cn } from "@/lib/utils";
import { fontHeading } from "@/config/ts-style";
import { FlickeringGrid } from "../magicui/flickering-grid";

export const ContentGenLoader = ({ text }: { text?: string }) => {
  return (
    <div className="relative h-auto rounded-lg w-full overflow-hidden ">
      <FlickeringGrid
        className="z-0 absolute inset-0 size-full"
        squareSize={4}
        gridGap={6}
        color="#6B7280"
        maxOpacity={0.5}
        flickerChance={0.5}
        height={200}
        width={400}
      />
      <div
        className={cn(
          fontHeading.className,
          "h-auto aspect-square w-inherit px-5 flex justify-center items-center -tracking-tighter text-base "
        )}
      >
        {text || "Generating..."}
      </div>
    </div>
  );
};
