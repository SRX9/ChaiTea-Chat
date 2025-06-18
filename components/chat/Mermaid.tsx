"use client";

import React, { useEffect, useRef } from "react";
import mermaid from "mermaid";

interface MermaidProps {
  chart: string;
}

export const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: "dark" });

    if (ref.current) {
      const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
      try {
        mermaid.render(id, chart, (svgCode: string) => {
          if (ref.current) {
            ref.current.innerHTML = svgCode;
          }
        });
      } catch (err) {
        if (ref.current) {
          ref.current.innerHTML = `<pre class='text-red-500'>${String(
            err
          )}</pre>`;
        }
      }
    }
  }, [chart]);

  return <div ref={ref} className="w-full overflow-x-auto" />;
};
