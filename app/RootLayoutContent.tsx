"use client";

import { useScroll } from "@/lib/ScrollContext";
import { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";

export function RootLayoutContent({ children }: { children: ReactNode }) {
  const { scrollableRef } = useScroll();

  return (
    <main
      ref={scrollableRef}
      className="relative flex flex-col h-screen overflow-y-scroll"
    >
      <Navbar />
      <section className="flex-1">{children}</section>
    </main>
  );
}
