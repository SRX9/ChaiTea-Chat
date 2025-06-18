"use client";

import { useEffect, useState } from "react";
import { mutateThread, deleteThread } from "@/lib/db";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { X as CloseIcon } from "lucide-react";

interface ThreadSettingsModalProps {
  open: boolean;
  thread: any | null;
  onClose: () => void;
  /** Called after a thread has been updated */
  onThreadUpdated?: (thread: any) => void;
  /** Called after a thread has been deleted */
  onThreadDeleted?: (threadId: string) => void;
}

export const ThreadSettingsModal = ({
  open,
  thread,
  onClose,
  onThreadUpdated,
  onThreadDeleted,
}: ThreadSettingsModalProps) => {
  const [titleInput, setTitleInput] = useState("");

  // Sync title input when thread or modal visibility changes
  useEffect(() => {
    if (open && thread) {
      setTitleInput(thread.title || "Untitled");
    }
  }, [open, thread]);

  if (!open || !thread) return null;

  const handleSave = async () => {
    const newTitle = titleInput.trim();
    if (!newTitle) return;
    try {
      const updated = { ...thread, title: newTitle, updatedAt: new Date() };
      await mutateThread(updated);
      onThreadUpdated?.(updated);
      onClose();
    } catch (err) {
      console.error("Failed to update title", err);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this thread? This cannot be undone.")) return;
    try {
      await deleteThread(thread.id);
      onThreadDeleted?.(thread.id);
      onClose();
    } catch (err) {
      console.error("Failed to delete thread", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="relative w-full max-w-sm bg-popover text-popover-foreground border border-border/60 rounded-2xl shadow-2xl p-4 z-50 animate-fade-in">
        {/* Close */}
        <button
          className="absolute top-4 right-4 rounded-lg p-1.5 hover:bg-accent transition-colors"
          onClick={onClose}
          aria-label="Close"
        >
          <CloseIcon className="w-4 h-4" />
        </button>

        <h2 className="text-lg font-semibold mb-4">Thread settings</h2>

        {/* Edit title */}
        <div className="space-y-2 mt-4">
          <label
            className="block text-sm font-medium"
            htmlFor="thread-title-input"
          >
            Title
          </label>
          <Input
            id="thread-title-input"
            type="text"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
          />
        </div>

        {/* Delete section */}
        <div className=" pt-6 flex items-end justify-between">
          <div>
            <label className="block text-sm font-medium pb-2">
              Delete Thread?
            </label>
            <p className="text-xs text-muted-foreground max-w-xs pr-10">
              This will permanently delete the thread and all its messages.
            </p>
          </div>
          <Button
            variant="destructive"
            className="rounded-md "
            size="sm"
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-8">
          <Button
            className="w-full rounded-lg"
            variant="secondary"
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};
