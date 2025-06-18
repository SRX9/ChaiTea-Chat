"use client";
import { useEffect } from "react";
import { startSyncLoop, stopSyncLoop } from "./syncEngine";
import { useUser } from "./auth-client";

export function useSync() {
  const { user } = useUser();

  useEffect(() => {
    if (user?.id) {
      startSyncLoop(user.id);
      return () => {
        stopSyncLoop();
      };
    } else {
      stopSyncLoop();
    }
  }, [user?.id]);
}
