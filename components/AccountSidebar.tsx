"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  X,
  User as UserIcon,
  Settings,
  Infinity,
  ArrowRight,
  Box,
  GitFork,
  FileText,
  Database,
  Globe,
  ChevronsRight,
  Book,
  ExternalLink,
  Shield,
  CreditCard,
  ChartLine,
  Key,
} from "lucide-react";
import { useUser } from "@/lib/auth-client";
import Image from "next/image";

interface AccountSidebarProps {
  /**
   * When provided, the sidebar is shown/hidden on mobile.
   * On desktop (≥ md) the sidebar is always visible regardless of this flag.
   */
  open?: boolean;
  /** Called when the user clicks outside the sidebar or the close button on mobile  */
  onClose?: () => void;
  /** Additional custom classes */
  className?: string;
}

const navGroups = [
  {
    items: [
      { label: "General", href: "/account", icon: Settings, exactMatch: true },
      { label: "Models", href: "/account/models", icon: Box },
      { label: "BYOK", href: "/account/byok", icon: Key },
    ],
  },
  {
    items: [
      {
        label: "Billing",
        href: "/account/billing",
        icon: CreditCard,
      },
      {
        label: "Usage",
        href: "/account/usage",
        icon: ChartLine,
      },
    ],
  },
  {
    items: [
      { label: "Security", href: "/account/security", icon: Shield },
      { label: "Docs", href: "/account/docs", icon: Database },
    ],
  },
];

export function AccountSidebar({
  open = false,
  onClose,
  className,
}: AccountSidebarProps) {
  const { user } = useUser();
  const pathname = usePathname();

  const renderNavItem = (item: (typeof navGroups)[0]["items"][0]) => {
    const active = item.exactMatch
      ? pathname === item.href
      : pathname.startsWith(item.href);
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          className={clsx(
            "flex items-center px-3 py-2 rounded-md text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800",
            active
              ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-white"
              : "text-zinc-500 dark:text-zinc-400"
          )}
          onClick={() => onClose?.()}
        >
          <item.icon className="w-5 h-5 mr-3" />
          <span>{item.label}</span>
        </Link>
      </li>
    );
  };

  return (
    <>
      <aside className={clsx("w-64 flex-col  flex", className)}>
        {/* User info */}
        <div className="hidden md:flex items-center gap-3 px-4 pt-4 pb-3 ">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-bold text-lg">
            {user?.image ? (
              <Image src={user.image} alt="avatar" width={32} height={32} />
            ) : (
              <UserIcon className="w-5 h-5" />
            )}
          </div>
          <div className="flex flex-col leading-tight truncate">
            <span
              className="text-sm font-medium truncate text-zinc-900 dark:text-zinc-100"
              title={user?.email || "Anon"}
            >
              {user?.email || "Guest"}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Hobby Plan
            </span>
          </div>
        </div>

        {/* Mobile close button */}
        <div className="flex items-center justify-between md:hidden px-4 py-3 ">
          <span className="font-semibold text-zinc-900 dark:text-zinc-50">
            Account Settings
          </span>
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav list */}
        <nav className="flex-1 overflow-y-auto px-4 pt-4 space-y-4">
          {navGroups.map((group, index) => (
            <div key={index}>
              <ul className="space-y-1">
                {group.items.map((item) => renderNavItem(item))}
              </ul>
              {index < navGroups.length - 1 && (
                <div className="pt-4">
                  <hr className="border-zinc-200 dark:border-zinc-800" />
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
