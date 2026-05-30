"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAppDataStore } from "@/store/useAppDataStore";

type Props = {
  className?: string;
  children: React.ReactNode;
};

/** Clears onboarded cookie gate and opens setup (fixes middleware redirect loop). */
export function SetupOnboardingLink({ className, children }: Props) {
  const router = useRouter();
  const restartOnboarding = useAppDataStore((s) => s.restartOnboarding);

  return (
    <Link
      href="/onboarding?setup=1"
      className={className}
      onClick={async (e) => {
        e.preventDefault();
        restartOnboarding();
        try {
          await fetch("/api/auth/session", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ onboarded: false }),
          });
        } catch {
          /* still navigate — ?setup=1 bypasses middleware */
        }
        router.push("/onboarding?setup=1");
      }}
    >
      {children}
    </Link>
  );
}
