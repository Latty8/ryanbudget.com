"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  GhostButton,
  PrimaryButton,
  ShellCard,
  fintechForeground,
  fintechIconButton,
  fintechMuted,
} from "@/components/fintech/ui";
import { DialogPortal } from "@/components/ui/dialog-portal";
import { APP_VERSION, CHANGELOG_ENTRIES } from "@/lib/version";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export const CHANGELOG_KEY = "planner-changelog-seen";
export { APP_VERSION as CHANGELOG_VERSION };

export function ChangelogModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const show = () => {
      const seen = localStorage.getItem(CHANGELOG_KEY);
      if (seen !== APP_VERSION) setOpen(true);
    };
    const ric = window.requestIdleCallback;
    if (ric) {
      const id = ric(show, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(show, 3000);
    return () => clearTimeout(id);
  }, []);

  if (!open) return null;

  return (
    <DialogPortal open={open} layer="modal">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-[var(--overlay)]/90"
        onClick={() => setOpen(false)}
      />
      <ShellCard className="relative z-10 mx-auto w-full max-w-md shadow-[var(--shadow-modal)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={cn("text-lg font-semibold", fintechForeground)}>What&apos;s new</p>
            <p className={cn("text-xs", fintechMuted)}>Version {APP_VERSION}</p>
          </div>
          <button type="button" className={fintechIconButton} onClick={() => setOpen(false)} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <ul className={cn("mt-3 list-inside list-disc space-y-2 text-sm", fintechMuted)}>
          {CHANGELOG_ENTRIES.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <PrimaryButton
          className="mt-4 w-full"
          onClick={() => {
            localStorage.setItem(CHANGELOG_KEY, APP_VERSION);
            trackEvent("changelog_dismissed", { version: APP_VERSION });
            setOpen(false);
          }}
        >
          Got it
        </PrimaryButton>
        <GhostButton className="mt-2 w-full" onClick={() => setOpen(false)}>
          Remind me later
        </GhostButton>
      </ShellCard>
    </DialogPortal>
  );
}
