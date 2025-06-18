import {
  getDirtyRecords,
  markSynced,
  mutateMessage,
  mutateThread,
  getThread,
} from "./db";

const SYNC_INTERVAL_MS = 60_000; // 1 minute

let syncTimer: ReturnType<typeof setInterval> | null = null;
let activeUserId: string | null = null;

/**
 * Pull remote changes, push local dirty records, then set last-sync timestamp.
 * This function is idempotent; callers may invoke it at any time.
 */
export async function initialSync(userId: string) {
  activeUserId = userId;

  // ----- First, push any local changes so the server has the latest state ---
  await syncDirty();

  const lastSyncKey = `chaitea-last-sync-${userId}`;
  const since = localStorage.getItem(lastSyncKey);

  try {
    // ---- Pull remote changes ------------------------------------------------
    const pullTargets: ("threads" | "messages")[] = ["threads", "messages"];

    for (const target of pullTargets) {
      const res = await fetch(
        `/api/sync/${target}${
          since ? `?since=${encodeURIComponent(since)}` : ""
        }`,
        { method: "GET" }
      ).catch(() => null);

      if (res && res.ok) {
        const records = (await res.json()) as any[];
        if (Array.isArray(records) && records.length) {
          await importRemoteRecords(target, records);
        }
      }
    }
  } catch (err) {
    console.error("[sync] initial pull failed", err);
  }

  // Finally, mark the last-sync timestamp.
  localStorage.setItem(lastSyncKey, new Date().toISOString());
}

/**
 * Scan local IndexedDB for dirty rows (unsynced or updated) and push them to the
 * server. On success mark them as synced locally.
 */
export async function syncDirty() {
  if (!activeUserId) return;

  const stores = ["threads", "messages"] as const;

  for (const store of stores) {
    const dirty = await getDirtyRecords(store);
    if (!dirty.length) continue;

    try {
      const res = await fetch(`/api/sync/${store}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: activeUserId, records: dirty }),
      });

      if (res.ok) {
        const ids = dirty.map((d: any) => d.id as string);
        await markSynced(store, ids);
      } else {
        const errorText = await res.text();
        console.error(`[sync] push ${store} failed:`, errorText);
      }
    } catch (err) {
      console.error(`[sync] push ${store} network error`, err);
    }
  }
}

export function startSyncLoop(userId: string) {
  // Avoid multiple loops per user.
  if (activeUserId === userId && syncTimer) return;

  stopSyncLoop(); // stop any previous loop (different user)
  activeUserId = userId;

  // Do an immediate sync, then schedule periodic flushes.
  initialSync(userId).catch((e) => console.error(e));

  syncTimer = setInterval(() => {
    syncDirty().catch((e) => console.error(e));
  }, SYNC_INTERVAL_MS);

  // Flush on tab close & when connection comes back.
  window.addEventListener("beforeunload", handleBeforeUnload);
  window.addEventListener("online", handleOnline);
}

export function stopSyncLoop() {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
  window.removeEventListener("beforeunload", handleBeforeUnload);
  window.removeEventListener("online", handleOnline);
  activeUserId = null;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

async function importRemoteRecords(
  store: "threads" | "messages",
  records: any[]
) {
  if (store === "threads") {
    const ids: string[] = [];
    for (const r of records) {
      const existing = await getThread(r.id).catch(() => null as any);
      const remoteUpdated = new Date(r.updatedAt ?? r.updated_at ?? 0);

      // If we already have a newer local version, skip importing this record
      if (
        existing &&
        existing.updatedAt &&
        existing.updatedAt > remoteUpdated
      ) {
        continue;
      }

      await mutateThread({
        ...(r as any),
        updatedAt: remoteUpdated,
        syncedAt: remoteUpdated,
      });
      ids.push(r.id);
    }
    await markSynced("threads", ids);
  } else {
    const ids: string[] = [];
    for (const r of records) {
      await mutateMessage({ ...(r as any), syncedAt: new Date(r.updatedAt) });
      ids.push(r.id);
    }
    await markSynced("messages", ids);
  }
}

function handleBeforeUnload() {
  syncDirty().catch(() => {
    /* ignore */
  });
}

function handleOnline() {
  syncDirty().catch(() => {
    /* ignore */
  });
}
