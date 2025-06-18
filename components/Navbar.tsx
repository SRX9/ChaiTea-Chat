"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Plus,
  Menu,
  Pencil,
  User as UserIcon,
  LogOut,
  LogIn,
} from "lucide-react";
import { ThemeSwitch } from "@/components/theme-switch";
import { useUser } from "@/lib/auth-client";
import Image from "next/image";
import { ThreadSidebar } from "@/components/ThreadSidebar";
import { ThreadSettingsModal } from "@/components/ThreadSettingsModal";
import { useRouter } from "nextjs-toploader/app";
import { fontHeading } from "@/config/ts-style";
import { cn } from "@/lib/utils";

export const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoggedIn } = useUser();

  const threadId = useMemo(() => {
    const match = pathname.match(/\/folder\/thread\/([^/]+)/);
    return match ? match[1] : undefined;
  }, [pathname]);

  const [threadTitle, setThreadTitle] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsThread, setSettingsThread] = useState<any | null>(null);

  // Load current thread title if on thread page
  useEffect(() => {
    const loadTitle = async () => {
      if (threadId) {
        try {
          const t = await (await import("@/lib/db")).getThread(threadId);
          setThreadTitle(t?.title ?? "Untitled");
        } catch {
          setThreadTitle(null);
        }
      } else {
        setThreadTitle(null);
      }
    };
    loadTitle();
  }, [threadId]);

  const handleEditTitle = async () => {
    if (!threadId) return;
    try {
      const t = await (await import("@/lib/db")).getThread(threadId);
      if (t) {
        setSettingsThread(t);
      }
    } catch (e) {
      console.error("Failed to load thread for editing", e);
    }
  };

  const handleThreadButton = () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setSidebarOpen(true);
  };

  const handleProfileClick = () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    } else {
      router.push("/account");
    }
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full backdrop-blur border-b border-border/40 bg-background/70 supports-[backdrop-filter]:bg-background/30">
        <div className="mx-auto flex items-center justify-between px-2 pr-3 pt-1 h-14">
          {/* Left section */}
          <div className="flex items-center">
            <button
              onClick={handleThreadButton}
              className="p-2 hover:bg-accent rounded-md"
              aria-label="Threads"
            >
              <Menu className="w-6 h-6" />
            </button>{" "}
            <Link href="/" className="p-2 hover:bg-accent rounded-md">
              <Plus className="w-6 h-6" />
            </Link>
          </div>

          {/* Center */}
          <div className="flex items-center gap-2 font-semibold">
            {threadId ? (
              <>
                <span className="truncate max-w-[45vw]  sm:max-w-xs md:max-w-sm">
                  {threadTitle ?? "Untitled"}
                </span>
                <button
                  onClick={handleEditTitle}
                  className="p-1 hover:bg-accent rounded-md"
                  aria-label="Edit title"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </>
            ) : (
              <Link
                href="/"
                className={cn(
                  fontHeading.className,
                  "text-zinc-600 dark:text-zinc-300 text-lg"
                )}
              >
                ChaiTea Chat
              </Link>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <ThemeSwitch />
            <div className="relative">
              <button
                onClick={handleProfileClick}
                className="rounded-full overflow-hidden w-8 h-8 border border-border/50 flex items-center justify-center bg-accent/30"
              >
                {user?.image ? (
                  <Image src={user.image} alt="avatar" width={32} height={32} />
                ) : (
                  <UserIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Thread sidebar */}
      <ThreadSidebar open={sidebarOpen} onClose={handleSidebarClose} />

      {/* Settings modal opened from navbar */}
      <ThreadSettingsModal
        open={!!settingsThread}
        thread={settingsThread}
        onClose={() => setSettingsThread(null)}
        onThreadUpdated={(updated) => {
          setThreadTitle(updated.title);
          setSettingsThread(null);
        }}
        onThreadDeleted={(id) => {
          if (id === threadId) {
            router.push("/");
          }
          setSettingsThread(null);
        }}
      />
    </>
  );
};
