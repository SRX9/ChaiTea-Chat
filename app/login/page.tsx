"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { signInWithGithub, signInWithGoogle, useUser } from "@/lib/auth-client";
import { title } from "@/components/primitives";
import { BottomFooter } from "@/components/BottomFooter";
import { siteConfig } from "@/config/site";
import { Github } from "lucide-react";

// Simple Google brand icon
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path
      d="M21.805 10.023h-9.18v3.953h5.271a4.513 4.513 0 01-1.963 2.963v2.46h3.173c1.856-1.709 2.899-4.231 2.899-7.277 0-.955-.086-1.887-.2-2.099z"
      fill="#4285F4"
    />
    <path
      d="M12.625 22c2.515 0 4.626-.829 6.168-2.241l-3.174-2.46c-.882.593-2.009.939-3.161.939-2.433 0-4.49-1.64-5.225-3.843H4.91v2.458A9.368 9.368 0 0012.625 22z"
      fill="#34A853"
    />
    <path
      d="M7.4 14.395a5.636 5.636 0 010-3.79V8.146H4.91a9.368 9.368 0 000 7.708l2.49-1.459z"
      fill="#FBBC04"
    />
    <path
      d="M12.625 6.529c1.372 0 2.604.472 3.571 1.399l2.675-2.672C16.988 3.663 14.875 2.75 12.625 2.75 7.896 2.75 4.008 6.02 2.91 8.146l2.49 1.458c.735-2.202 2.792-3.843 5.225-3.843z"
      fill="#EA4335"
    />
  </svg>
);

export default function LoginPage() {
  const { isLoggedIn, isLoading } = useUser();
  const router = useRouter();

  // Redirect authenticated users to the homepage
  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      router.replace("/");
    }
  }, [isLoggedIn, isLoading, router]);

  if (isLoading) {
    return null;
  }

  return (
    <div className="flex min-h-[95vh]  flex-col items-center justify-between py-10 bg-background">
      {/* Main content */}
      <div className="flex flex-1 flex-col items-center justify-center">
        <Image
          src={siteConfig.logo}
          alt="ChaiTea Chat logo"
          width={128}
          height={128}
          className="mb-6 select-none"
          priority
        />
        <h1 className={title({ size: "lg" })}>Sign in to continue</h1>

        <div className="mt-6 flex w-72 flex-col gap-3">
          <Button
            variant="outline"
            onClick={async () => {
              await signInWithGithub();
            }}
          >
            <Github className="h-5 w-5" />
            Sign in with GitHub
          </Button>

          <Button
            variant="outline"
            onClick={async () => {
              await signInWithGoogle();
            }}
          >
            <GoogleIcon className="h-5 w-5" />
            Sign in with Google
          </Button>
        </div>
      </div>

      {/* Footer */}
      <BottomFooter noLines className="pb-6" />
    </div>
  );
}
