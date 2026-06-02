"use client";

import { useState } from "react";
import { LayoutGrid } from "lucide-react";
import { GhostButton, ModalOverlay, PrimaryButton, fintechForeground, fintechMuted } from "@/components/fintech/ui";
import {
  DASHBOARD_WIDGET_LABELS,
  useDashboardWidgetsStore,
  type DashboardWidgetId,
} from "@/store/useDashboardWidgetsStore";
import { cn } from "@/lib/utils";

function DashboardCustomizeModal({ onClose }: { onClose: () => void }) {
  const widgets = useDashboardWidgetsStore((s) => s.widgets);
  const setEnabled = useDashboardWidgetsStore((s) => s.setWidgetEnabled);
  const reorder = useDashboardWidgetsStore((s) => s.reorderWidgets);
  const reset = useDashboardWidgetsStore((s) => s.resetWidgets);

  const sorted = [...widgets].sort((a, b) => a.order - b.order);

  const move = (id: DashboardWidgetId, dir: -1 | 1) => {
    const ids = sorted.map((w) => w.id);
    const idx = ids.indexOf(id);
    const next = idx + dir;
    if (next < 0 || next >= ids.length) return;
    const copy = [...ids];
    [copy[idx], copy[next]] = [copy[next], copy[idx]];
    reorder(copy);
  };

  return (
    <ModalOverlay open onClose={onClose} title="Dashboard widgets">
      <p className={cn("text-sm", fintechMuted)}>
        Choose what appears on your dashboard. Order is top to bottom.
      </p>
      <ul className="mt-4 space-y-2">
        {sorted.map((w, i) => (
          <li
            key={w.id}
            className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2"
          >
            <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={w.enabled}
                onChange={(e) => setEnabled(w.id, e.target.checked)}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              <span className={fintechForeground}>
                {DASHBOARD_WIDGET_LABELS[w.id] ?? w.id}
              </span>
            </label>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={i === 0}
                className="rounded px-2 py-1 text-xs text-[var(--muted)] disabled:opacity-30"
                onClick={() => move(w.id, -1)}
                aria-label="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                disabled={i === sorted.length - 1}
                className="rounded px-2 py-1 text-xs text-[var(--muted)] disabled:opacity-30"
                onClick={() => move(w.id, 1)}
                aria-label="Move down"
              >
                ↓
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex justify-between gap-2">
        <GhostButton type="button" onClick={reset}>
          Reset defaults
        </GhostButton>
        <PrimaryButton type="button" onClick={onClose}>
          Done
        </PrimaryButton>
      </div>
    </ModalOverlay>
  );
}

export function DashboardCustomizeButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <GhostButton type="button" className="!text-xs" onClick={() => setOpen(true)}>
        <LayoutGrid className="mr-1 inline h-3.5 w-3.5" />
        Customize
      </GhostButton>
      {open ? <DashboardCustomizeModal onClose={() => setOpen(false)} /> : null}
    </>
  );
}
