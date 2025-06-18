import { openDB, DBSchema, IDBPDatabase } from "idb";
import { Message } from "@ai-sdk/react";

const DB_NAME = "ChaiTeaDB";
const DB_VERSION = 1;
const THREADS_STORE = "threads";
const MESSAGES_STORE = "messages";

export interface TokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface AttachmentMeta {
  url: string;
  name?: string;
  contentType?: string;
}

interface ChaiTeaDB extends DBSchema {
  [THREADS_STORE]: {
    key: string;
    value: {
      id: string;
      title: string;
      createdAt: Date;
      userId: string;
      /** Indicates the mode (e.g., Chat, Image Generation) the thread was created in */
      mode?: import("@/config/models").EModelModes;
      /** Local change tracking */
      updatedAt?: Date;
      syncedAt?: Date | null;
      version?: number;
      /** Whether the thread is pinned to the top of sidebar */
      pinned?: boolean;
    };
  };
  [MESSAGES_STORE]: {
    key: string;
    value: Message & {
      threadId: string;
      modelId?: string;
      tokenUsage?: TokenUsage;
      attachments?: AttachmentMeta[];
      /** Soft-delete flag for sync */
      deleted?: boolean;
      /** Local change tracking */
      updatedAt?: Date;
      syncedAt?: Date | null;
      version?: number;
    };
    indexes: { threadId: string };
  };
}

let dbPromise: Promise<IDBPDatabase<ChaiTeaDB>> | null = null;

const initDB = () => {
  if (dbPromise) return dbPromise;

  dbPromise = openDB<ChaiTeaDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(THREADS_STORE)) {
        db.createObjectStore(THREADS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
        const store = db.createObjectStore(MESSAGES_STORE, { keyPath: "id" });

        store.createIndex("threadId", "threadId");
      }
    },
  });

  return dbPromise;
};

export const getThread = async (id: string) => {
  const db = await initDB();

  return db.get(THREADS_STORE, id);
};

export const getMessages = async (threadId: string) => {
  const db = await initDB();
  const messagesRaw = await db.getAllFromIndex(
    MESSAGES_STORE,
    "threadId",
    threadId
  );
  const messages = messagesRaw.filter((m: any) => !m.deleted);
  if (messages.length > 0) {
    return messages.toSorted(
      (a, b) => (a?.createdAt?.getTime() ?? 0) - (b?.createdAt?.getTime() ?? 0)
    );
  }

  // If no local messages found, attempt remote fetch to heal local store.
  try {
    const res = await fetch(
      `/api/sync/messages?threadId=${encodeURIComponent(threadId)}`,
      {
        method: "GET",
      }
    );

    if (res.ok) {
      const remoteMessages = (await res.json()) as any[];
      if (remoteMessages.length) {
        // insert messages into IndexedDB and mark synced
        const insertedIds: string[] = [];
        for (const m of remoteMessages) {
          const normalized: any = {
            ...m,
            id: m.id,
            threadId: m.threadId ?? m.thread_id,
            content: m.content,
            role: m.role,
            createdAt: m.createdAt
              ? new Date(m.createdAt)
              : new Date(m.created_at),
            updatedAt: m.updatedAt
              ? new Date(m.updatedAt)
              : new Date(m.updated_at),
            syncedAt: new Date(m.updated_at ?? m.updatedAt),
            modelId: m.modelId ?? m.model_id,
            tokenUsage: m.tokenUsage ?? m.token_usage,
            attachments:
              typeof m.attachments === "string"
                ? JSON.parse(m.attachments)
                : m.attachments,
            deleted: m.deleted ?? false,
          };

          await addMessage(normalized);
          insertedIds.push(m.id);
        }
        // Ensure the thread exists locally
        const existingThread = await getThread(threadId);
        if (!existingThread) {
          try {
            const threadRes = await fetch(
              `/api/sync/threads?threadId=${encodeURIComponent(threadId)}`,
              { method: "GET" }
            );
            if (threadRes.ok) {
              const remoteThreads = (await threadRes.json()) as any[];
              if (remoteThreads.length) {
                const tRaw = remoteThreads[0];
                const tNorm: any = {
                  ...tRaw,
                  id: tRaw.id,
                  userId: tRaw.user_id ?? tRaw.userId,
                  title: tRaw.title,
                  createdAt: tRaw.createdAt
                    ? new Date(tRaw.createdAt)
                    : new Date(tRaw.created_at),
                  updatedAt: tRaw.updatedAt
                    ? new Date(tRaw.updatedAt)
                    : new Date(tRaw.updated_at),
                  mode: tRaw.mode ?? undefined,
                  syncedAt: new Date(tRaw.updated_at ?? tRaw.updatedAt),
                  version: tRaw.version ?? 1,
                };

                await addThread(tNorm);
                try {
                  const { markSynced } = await import("./db");
                  await markSynced("threads", [threadId]);
                } catch {}
              }
            }
          } catch (threadErr) {
            console.error("Failed to hydrate thread", threadId, threadErr);
          }
        }
        // Mark messages as synced so they are not re-uploaded immediately
        try {
          const { markSynced } = await import("./db");
          await markSynced("messages", insertedIds);
        } catch {}
        return remoteMessages.toSorted(
          (a, b) =>
            new Date(a.created_at ?? a.createdAt).getTime() -
            new Date(b.created_at ?? b.createdAt).getTime()
        ) as any;
      }
    }
  } catch (err) {
    console.error("Failed to fetch remote messages for thread", threadId, err);
  }

  return [];
};

// legacy addMessage/deleteMessage removed

export const DIRTY_SYNC_PREDICATE = (record: {
  syncedAt?: Date | null;
  updatedAt: Date;
}) => {
  return !record.syncedAt || record.updatedAt > record.syncedAt;
};

/**
 * Utility: fetch all dirty (unsynced or updated-since-last-sync) records from a given store.
 */
export const getDirtyRecords = async (
  storeName: typeof THREADS_STORE | typeof MESSAGES_STORE
) => {
  const db = await initDB();
  const all = await db.getAll(storeName as any);
  return all.filter((r: any) => DIRTY_SYNC_PREDICATE(r));
};

/**
 * Utility: mark records as successfully synced.
 */
export const markSynced = async (
  storeName: typeof THREADS_STORE | typeof MESSAGES_STORE,
  ids: string[]
) => {
  const db = await initDB();
  const tx = db.transaction(storeName as any, "readwrite");
  const now = new Date();
  for (const id of ids) {
    const rec: any | undefined = await tx.store.get(id);
    if (rec) {
      rec.syncedAt = now;
      await tx.store.put(rec);
    }
  }
  await tx.done;
};

/**
 * Internal helper to prepare a record before persistence.
 */
const touchRecord = <
  T extends { updatedAt?: Date; version?: number; syncedAt?: Date | null }
>(
  record: T
): T => {
  const now = new Date();
  return {
    ...record,
    updatedAt: now,
    syncedAt: null,
    version: (record.version ?? 0) + 1,
  };
};

export const mutateThread = async (
  thread: Omit<
    ChaiTeaDB["threads"]["value"],
    "updatedAt" | "syncedAt" | "version"
  > &
    Partial<
      Pick<ChaiTeaDB["threads"]["value"], "updatedAt" | "syncedAt" | "version">
    >
) => {
  const db = await initDB();
  const prepared = touchRecord(thread);
  return db.put(THREADS_STORE, prepared);
};

export const mutateMessage = async (
  message: Message & { threadId: string } & Partial<
      ChaiTeaDB["messages"]["value"]
    >
) => {
  const db = await initDB();
  const prepared = touchRecord({ deleted: false, ...message });
  return db.put(MESSAGES_STORE, prepared);
};

/**
 * Soft delete: mark as deleted and dirty.
 */
export const markMessageDeleted = async (id: string) => {
  const db = await initDB();
  const existing = await db.get(MESSAGES_STORE, id);
  if (!existing) return;
  existing.deleted = true;
  await mutateMessage(existing as any);
};

// --------------------
// Backward-compat wrappers
// --------------------

export const addThread = mutateThread;

export const addMessage = mutateMessage;

export const deleteMessage = markMessageDeleted;

export const getThreads = async () => {
  const db = await initDB();
  const threads = await db.getAll(THREADS_STORE);

  if (threads.length > 0) {
    // Sort by updatedAt desc if available, else createdAt desc
    return threads.toSorted(
      (a, b) =>
        (b.updatedAt?.getTime() ?? b.createdAt.getTime()) -
        (a.updatedAt?.getTime() ?? a.createdAt.getTime())
    );
  }

  // If no local threads found, attempt remote fetch to heal local store.
  try {
    const res = await fetch("/api/sync/threads", { method: "GET" });
    if (res.ok) {
      const remoteThreads = (await res.json()) as any[];
      if (remoteThreads.length) {
        const insertedIds: string[] = [];
        const normalizedRecords: any[] = [];
        for (const tRaw of remoteThreads) {
          const tNorm: any = {
            ...tRaw,
            id: tRaw.id,
            userId: tRaw.user_id ?? tRaw.userId,
            title: tRaw.title,
            pinned: tRaw.pinned ?? false,
            createdAt: tRaw.createdAt
              ? new Date(tRaw.createdAt)
              : new Date(tRaw.created_at),
            updatedAt: tRaw.updatedAt
              ? new Date(tRaw.updatedAt)
              : new Date(tRaw.updated_at),
            mode: tRaw.mode ?? undefined,
            syncedAt: new Date(tRaw.updated_at ?? tRaw.updatedAt),
            version: tRaw.version ?? 1,
          };

          await addThread(tNorm);
          insertedIds.push(tNorm.id);
          normalizedRecords.push(tNorm);
        }

        // Mark threads as synced so they are not re-uploaded immediately
        try {
          const { markSynced } = await import("./db");
          await markSynced("threads", insertedIds);
        } catch {}

        // Sort before returning
        return normalizedRecords.toSorted(
          (a, b) =>
            (b.updatedAt?.getTime() ?? b.createdAt.getTime()) -
            (a.updatedAt?.getTime() ?? a.createdAt.getTime())
        );
      }
    }
  } catch (err) {
    console.error("Failed to fetch remote threads list", err);
  }

  return [];
};

/**
 * Permanently delete a thread and all of its messages locally.
 * This does not mark as synced; the caller should handle remote deletion.
 */
export const deleteThread = async (threadId: string) => {
  const db = await initDB();
  // Delete the thread itself
  await db.delete(THREADS_STORE, threadId);

  // Delete associated messages
  const msgs = await db.getAllFromIndex(MESSAGES_STORE, "threadId", threadId);
  for (const msg of msgs) {
    await db.delete(MESSAGES_STORE, msg.id as any);
  }
};
