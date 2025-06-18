"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        className={cn(
          "peer relative h-7 w-12 shrink-0 cursor-pointer appearance-none rounded-full border-2 border-transparent bg-zinc-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background checked:bg-blue-600",
          "before:pointer-events-none before:absolute before:left-[2px] before:top-[2px] before:h-5 before:w-5 before:rounded-full before:bg-white before:shadow-lg before:ring-0 before:transition-transform checked:before:translate-x-full",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Switch.displayName = "Switch";

export { Switch };
