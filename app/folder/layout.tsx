"use client";

import { ReactNode, useEffect } from "react";
import { useUser } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

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

  return children;
}
