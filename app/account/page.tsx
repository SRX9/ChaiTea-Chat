"use client";

import { useUser, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Sun, Moon, Laptop, Loader2 } from "lucide-react";
import { fontHeading } from "@/config/ts-style";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useState } from "react";

export default function AccountGeneralPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    await signOut();
    router.push("/");
  };

  const handleDeleteAccount = () => {
    alert("This is a coming soon feature.");
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className=" max-w-2xl mx-auto">
      <div
        className={cn(
          fontHeading.className,
          "text-xl text-zinc-400 font-normal -tracking-tight"
        )}
      >
        Account
      </div>

      {/* User Info */}
      <section className="bg-card rounded-md p-4 flex flex-col md:flex-row mt-3 items-start md:items-center gap-4">
        <img
          src={user?.image || `https://avatar.vercel.sh/${user?.email}.png`}
          alt="User Avatar"
          className="w-16 h-16 rounded-full"
        />
        <div>
          <div className="text-base font-sans pb-2 font-semibold text-foreground/90">
            {user?.name}
          </div>
          <p className="text-sm text-zinc-400">{user?.email}</p>
        </div>
      </section>

      {/* Theme */}
      <section className="bg-card rounded-md p-4 flex flex-col md:flex-row mt-6 items-start md:items-center justify-between gap-4 md:gap-0">
        <div>
          <div className="text-base font-sans pb-2 font-semibold text-foreground/90">
            Theme
          </div>
          <p className="text-sm text-zinc-400  sm:pr-10">
            Select your preferred theme.
          </p>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setTheme("light")}
            className={cn(
              "flex items-center space-x-2 p-2 px-3 rounded-md hover:bg-accent/80",
              theme === "light" && "bg-accent"
            )}
          >
            <Sun className="w-5 h-5" />
            <span>Light</span>
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={cn(
              "flex items-center space-x-2 p-2 px-3 rounded-md hover:bg-accent/80",
              theme === "dark" && "bg-accent"
            )}
          >
            <Moon className="w-5 h-5" />
            <span>Dark</span>
          </button>
          <button
            onClick={() => setTheme("system")}
            className={cn(
              "flex items-center space-x-2 p-2 px-3 rounded-md hover:bg-accent/80",
              theme === "system" && "bg-accent"
            )}
          >
            <Laptop className="w-5 h-5" />
            <span>System</span>
          </button>
        </div>
      </section>

      {/* Logout */}
      <section className="bg-card rounded-md p-4 flex flex-col md:flex-row mt-6 items-start md:items-center justify-between gap-4 md:gap-0">
        <div>
          <div className="text-base font-sans pb-2 font-semibold text-foreground/90">
            Sign Out
          </div>
          <p className="text-sm text-zinc-400  sm:pr-10">
            Signout from your account. You will be returned to the homepage.
          </p>
        </div>
        <button
          onClick={handleSignOut}
          disabled={isLoggingOut}
          className="px-4 py-2 rounded border border-border text-sm hover:bg-accent/20 w-full md:w-24 text-center"
        >
          {isLoggingOut ? (
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          ) : (
            "Log Out"
          )}
        </button>
      </section>

      {/* Delete Account */}
      <section className="bg-card rounded-md p-4 flex flex-col md:flex-row mt-6 items-start md:items-center justify-between gap-4 md:gap-0">
        <div>
          <div className="text-base font-sans pb-2 font-semibold text-foreground/90">
            Delete your account
          </div>
          <p className="text-sm text-zinc-400 sm:pr-10">
            Permanently delete your account and all of your content. This action
            is not reversible.
          </p>
        </div>
        <button
          onClick={handleDeleteAccount}
          className="px-4 py-2 rounded border border-border text-sm hover:bg-accent/20 text-zinc-400 w-full md:w-auto"
        >
          Delete
        </button>
      </section>
    </div>
  );
}
