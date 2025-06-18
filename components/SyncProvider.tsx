"use client";
import { ReactNode } from "react";
import { useSync } from "@/lib/useSync";

export function SyncProvider({ children }: { children: ReactNode }) {
  useSync();
  return <>{children}</>;
}
