"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { GhostButton, PrimaryButton } from "@/components/fintech/ui";
import { cn } from "@/lib/utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaProvider() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    document.documentElement.classList.toggle("offline", !navigator.onLine);
    const syncOnlineClass = () => {
      document.documentElement.classList.toggle("offline", !navigator.onLine);
    };
    window.addEventListener("online", syncOnlineClass);
    window.addEventListener("offline", syncOnlineClass);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          registration.update().catch(() => undefined);
        })
        .catch(() => {
          // SW registration can fail without HTTPS; ignore silently.
        });
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("online", syncOnlineClass);
      window.removeEventListener("offline", syncOnlineClass);
    };
  }, []);

  if (!deferred || dismissed) return null;

  return (
    <div
      className="fixed bottom-20 left-3 right-3 z-40 mx-auto max-w-md rounded-2xl border border-sky-500/40 bg-neutral-900 p-4 text-slate-100 shadow-xl md:bottom-6 md:left-auto md:right-6"
      role="dialog"
      aria-label="Install app"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Install Paycheck Planner</p>
          <p className="mt-1 text-xs text-slate-400">Add to your home screen for a fast, app-like experience.</p>
        </div>
        <button className="rounded-lg p-1 text-slate-400 hover:bg-neutral-800" onClick={() => setDismissed(true)} aria-label="Dismiss install prompt">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <PrimaryButton
          className="flex-1"
          onClick={async () => {
            await deferred.prompt();
            setDeferred(null);
            setDismissed(true);
          }}
        >
          <Download className="mr-1 inline h-4 w-4" />
          Install
        </PrimaryButton>
        <GhostButton onClick={() => setDismissed(true)}>Not now</GhostButton>
      </div>
    </div>
  );
}

/** Improves touch targets on mobile */
export function touchFriendly(className?: string) {
  return cn("min-h-11 min-w-11 touch-manipulation", className);
}
