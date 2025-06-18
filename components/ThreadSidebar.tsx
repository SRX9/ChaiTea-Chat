"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Plus, Pin, PinOff, MoreVertical } from "lucide-react";
import clsx from "clsx";

import { getThreads, mutateThread } from "@/lib/db";
import { ThreadSettingsModal } from "./ThreadSettingsModal";
import { EModelModes } from "@/config/models";

interface ThreadSidebarProps {
  open: boolean;
  onClose: () => void;
  /** When provided, the sidebar will automatically open the settings modal for this thread id */
  editThreadId?: string | null;
  /** Called when the settings modal is closed so parent can reset state */
  onSettingsClose?: () => void;
}

export const ThreadSidebar = ({
  open,
  onClose,
  editThreadId,
  onSettingsClose,
}: ThreadSidebarProps) => {
  const pathname = usePathname();

  const threadId = useMemo(() => {
    const match = pathname.match(/\/folder\/thread\/([^/]+)/);
    return match ? match[1] : undefined;
  }, [pathname]);

  const [threads, setThreads] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [settingsThread, setSettingsThread] = useState<any | null>(null);
  const [titleInput, setTitleInput] = useState("");

  // Load threads list when sidebar opens
  useEffect(() => {
    if (!open) return;
    const load = async () => {
      try {
        const all = await getThreads();
        setThreads(all);
      } catch {
        setThreads([]);
      }
    };
    load();
  }, [open]);

  const filteredThreads = useMemo(() => {
    if (!searchQuery.trim()) return threads;
    const q = searchQuery.toLowerCase();
    return threads.filter((t) =>
      (t.title || "Untitled").toLowerCase().includes(q)
    );
  }, [searchQuery, threads]);

  // Sort pinned first then updatedAt/createdAt desc
  const sortedThreads = useMemo(() => {
    const arr = [...filteredThreads];
    arr.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      const aDate = a.updatedAt ? new Date(a.updatedAt) : new Date(a.createdAt);
      const bDate = b.updatedAt ? new Date(b.updatedAt) : new Date(b.createdAt);
      return bDate.getTime() - aDate.getTime();
    });
    return arr;
  }, [filteredThreads]);

  const handleTogglePin = async (t: any) => {
    try {
      await mutateThread({
        ...t,
        pinned: !t.pinned,
        updatedAt: new Date(),
      });
      setThreads((prev) =>
        prev.map((th) => (th.id === t.id ? { ...th, pinned: !th.pinned } : th))
      );
    } catch (e) {
      console.error("Failed to toggle pin", e);
    }
  };

  const closeModal = () => {
    setSettingsThread(null);
    onSettingsClose?.();
  };

  // Automatically open settings modal if editThreadId provided once threads are loaded
  useEffect(() => {
    if (!editThreadId) return;
    const t = threads.find((th) => th.id === editThreadId);
    if (t) {
      setSettingsThread(t);
      setTitleInput(t.title || "Untitled");
    }
  }, [editThreadId, threads]);

  // --------------------------
  // Helpers
  // --------------------------

  const pinnedThreads = sortedThreads.filter((t) => t.pinned);
  const otherThreads = sortedThreads.filter((t) => !t.pinned);

  // Group other threads by date (YYYY-MM-DD)
  const otherGrouped: Record<string, any[]> = {};
  for (const t of otherThreads) {
    const date = (t.updatedAt ?? t.createdAt) as Date;
    const key = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      .toISOString()
      .slice(0, 10); // YYYY-MM-DD
    (otherGrouped[key] ||= []).push(t);
  }

  const sortedDateKeys = Object.keys(otherGrouped).sort((a, b) =>
    a < b ? 1 : -1
  );

  const formatDateHeader = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const sameDay = (x: Date, y: Date) =>
      x.getFullYear() === y.getFullYear() &&
      x.getMonth() === y.getMonth() &&
      x.getDate() === y.getDate();

    if (sameDay(d, today)) return "Today";
    if (sameDay(d, yesterday)) return "Yesterday";
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  };

  const renderThreadItem = (t: any) => (
    <li
      key={t.id}
      className={clsx(
        "group hover:bg-accent/50",
        t.id === threadId && "bg-accent/70"
      )}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <Link
          href={`${
            [EModelModes.IMAGE_GENERATION, EModelModes.IMAGE_EDITING].includes(
              t.mode
            )
              ? "/folder/thread/image"
              : "/folder/thread"
          }/${t.id}`}
          className={clsx(
            "truncate flex-1",
            t.id === threadId && "font-semibold"
          )}
          onClick={onClose}
        >
          {t.title || "Untitled"}
        </Link>
        <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
          <button
            onClick={() => handleTogglePin(t)}
            className="p-1 hover:bg-accent rounded"
            aria-label={t.pinned ? "Unpin" : "Pin"}
          >
            {t.pinned ? (
              <PinOff className="w-4 h-4" />
            ) : (
              <Pin className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSettingsThread(t);
              setTitleInput(t.title || "Untitled");
            }}
            className="p-1 hover:bg-accent rounded"
            aria-label="Settings"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
    </li>
  );

  return (
    <>
      {/* Overlay */}
      <div
        className={clsx(
          "fixed inset-0 bg-black/50 transition-opacity duration-300 ease-in-out z-40",
          open
            ? "opacity-50 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed top-0 left-0 bottom-0 w-72 pb-20 bg-background border-r border-border z-50 flex flex-col transform transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background z-10">
          <h2 className="text-lg font-semibold">Threads</h2>
          <div className="flex items-center gap-1">
            <Link
              href="/"
              onClick={onClose}
              className="p-1 hover:bg-accent rounded"
              aria-label="Home"
            >
              <Plus className="w-5 h-5" />
            </Link>
            <button
              onClick={onClose}
              className="p-1 hover:bg-accent rounded"
              aria-label="Close sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="p-3 border-b border-border sticky top-[3.5rem] bg-background z-10">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search threads..."
            className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {sortedThreads.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              No threads found.
            </p>
          ) : (
            <>
              {/* Pinned section */}
              {pinnedThreads.length > 0 && (
                <div className="pb-1">
                  <h3 className="px-4 pt-4 pb-2 font-sans   font-semibold uppercase tracking-wider text-gray-500">
                    Pinned
                  </h3>
                  <ul className="divide-y divide-border">
                    {pinnedThreads.map((t) => renderThreadItem(t))}
                  </ul>
                </div>
              )}

              {/* Others section grouped by date */}
              {sortedDateKeys.map((k, idx) => (
                <div
                  key={k}
                  className={clsx(
                    idx === 0 && pinnedThreads.length === 0 ? "" : "mt-4",
                    "pt-4 pb-4"
                  )}
                >
                  <h3 className="px-4 pb-2 font-sans  font-semibold uppercase tracking-wider text-gray-500">
                    {formatDateHeader(k)}
                  </h3>
                  <ul className="divide-y divide-border">
                    {otherGrouped[k].map((t) => renderThreadItem(t))}
                  </ul>
                </div>
              ))}
            </>
          )}
        </div>
      </aside>

      <ThreadSettingsModal
        open={!!settingsThread}
        thread={settingsThread}
        onClose={closeModal}
        onThreadUpdated={(updated) => {
          setThreads((prev) =>
            prev.map((t) => (t.id === updated.id ? updated : t))
          );
        }}
        onThreadDeleted={(id) => {
          setThreads((prev) => prev.filter((t) => t.id !== id));
          if (id === threadId) {
            location.href = "/";
          }
        }}
      />
    </>
  );
};
