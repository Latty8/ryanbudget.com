"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  variant?: "header" | "hero";
};

/** Opens the signed-in app (Finance Hub). Middleware sends unauthenticated users to login. */
export function GoToAppLink({ className, variant = "header" }: Props) {
  if (variant === "hero") {
    return (
      <Link
        href="/dashboard"
        className={cn(
          "inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-sky-400",
          className
        )}
      >
        Go to app
        <ArrowRight className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <Link
      href="/dashboard"
      className={cn(
        "rounded-xl border border-sky-500/40 bg-sky-500/10 px-3 py-2 font-medium text-sky-300 hover:bg-sky-500/20",
        className
      )}
    >
      Go to app
    </Link>
  );
}
