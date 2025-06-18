"use client";

import { ReactNode, useEffect } from "react";
import { AccountSidebar } from "@/components/AccountSidebar";
import { useUser } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { BottomFooter } from "@/components/BottomFooter";

export default function AccountLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex h-full min-h-screen pb-40 justify-center items-center">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[80vh] relative pt-2 sm:pt-10 justify-center">
      {/* Desktop sidebar */}
      <AccountSidebar className="hidden md:flex " />

      {/* Content area */}
      <div className=" flex flex-col overflow-y-auto max-w-[700px] pb-20 ">
        <div className="px-6 pt-3 flex-1 overflow-y-auto flex justify-center">
          <div className="w-full max-w-3xl h-auto ">{children}</div>
        </div>
        <BottomFooter noLines className="pt-10" />
      </div>
    </div>
  );
}
