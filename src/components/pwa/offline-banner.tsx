"use client";

import { CloudOff, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { GhostButton } from "@/components/fintech/ui";

export function OfflineBanner() {
  const [offline, setOffline] = useState(
    () => typeof window !== "undefined" && !navigator.onLine
  );

  useEffect(() => {
    const onOffline = () => setOffline(true);
    const onOnline = () => setOffline(false);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      className="fixed left-0 right-0 top-0 z-50 flex items-center justify-center gap-2 border-b border-amber-500/40 bg-amber-950/95 px-3 py-2 text-xs text-amber-100"
      role="status"
      aria-live="polite"
    >
      <CloudOff className="h-4 w-4 shrink-0" aria-hidden />
      <span>You&apos;re offline — viewing cached data. New entries save as drafts.</span>
      <GhostButton
        className="ml-1 min-h-8 px-2 py-1 text-[11px]"
        onClick={() => window.location.reload()}
      >
        <RefreshCw className="mr-1 inline h-3 w-3" />
        Retry
      </GhostButton>
    </div>
  );
}
