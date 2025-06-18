"use client";

import React from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { SyncProvider } from "@/components/SyncProvider";
import NextTopLoader from "nextjs-toploader";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NextTopLoader />
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <SyncProvider>{children}</SyncProvider>
      </ThemeProvider>
    </>
  );
}
