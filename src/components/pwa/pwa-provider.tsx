"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { GhostButton, PrimaryButton, fintechForeground, fintechMuted, fintechSurface } from "@/components/fintech/ui";
import { cn } from "@/lib/utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaProvider() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const dismissedKey = "planner:pwa-install-dismissed";
    if (sessionStorage.getItem(dismissedKey) === "1") {
      setDismissed(true);
    }

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

  const dismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("planner:pwa-install-dismissed", "1");
  };

  if (!deferred || dismissed) return null;

  return (
    <div
      className={cn(
        fintechSurface,
        "fixed bottom-24 left-3 right-3 z-40 mx-auto max-w-md p-4 shadow-[var(--shadow-modal)] xl:bottom-6 xl:left-auto xl:right-6"
      )}
      role="dialog"
      aria-label="Install app"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={cn("text-sm font-medium", fintechForeground)}>Install Paycheck Planner</p>
          <p className={cn("mt-1 text-xs leading-relaxed", fintechMuted)}>
            Add to your home screen for quick access between paychecks.
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--surface-hover)]"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row">
        <GhostButton type="button" className="w-full sm:w-auto" onClick={dismiss}>
          Not now
        </GhostButton>
        <PrimaryButton
          type="button"
          className="w-full flex-1 sm:w-auto"
          onClick={async () => {
            await deferred.prompt();
            setDeferred(null);
            dismiss();
          }}
        >
          <Download className="mr-1.5 inline h-4 w-4" />
          Install
        </PrimaryButton>
      </div>
    </div>
  );
}

/** Improves touch targets on mobile */
export function touchFriendly(className?: string) {
  return cn("min-h-11 min-w-11 touch-manipulation", className);
}
