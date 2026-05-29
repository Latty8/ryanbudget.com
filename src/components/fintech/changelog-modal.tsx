"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { GhostButton, PrimaryButton, ShellCard } from "@/components/fintech/ui";
import { APP_VERSION, CHANGELOG_ENTRIES } from "@/lib/version";
import { trackEvent } from "@/lib/analytics";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <ShellCard className="w-full max-w-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold">What&apos;s new</p>
            <p className="text-xs text-slate-400">Version {APP_VERSION}</p>
          </div>
          <button
            type="button"
            className="rounded-lg p-1 text-slate-400 hover:bg-neutral-800"
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-slate-300">
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
    </div>
  );
}
