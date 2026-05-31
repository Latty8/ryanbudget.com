"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, X } from "lucide-react";
import { fintechIconButton, fintechMuted, fintechSurface } from "@/components/fintech/ui";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useNotificationEngine } from "@/hooks/use-notification-engine";
import { usePremium } from "@/hooks/use-premium";
import { requestWebPushPermission } from "@/lib/notifications/push";
import { cn } from "@/lib/utils";

const kindColors: Record<string, string> = {
  bill_due: "text-amber-600 dark:text-amber-400",
  budget_alert: "text-rose-600 dark:text-rose-400",
  goal_milestone: "text-[var(--positive)]",
  paycheck_reminder: "text-[var(--accent)]",
  system: "text-[var(--muted)]",
};

export function NotificationCenter() {
  useNotificationEngine();
  const { canUse, demoMode } = usePremium();
  const pushAllowed = canUse("push_notifications") || demoMode;

  const notifications = useNotificationStore((s) => s.notifications);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const dismiss = useNotificationStore((s) => s.dismiss);
  const pushEnabled = useNotificationStore((s) => s.pushEnabled);
  const setPushEnabled = useNotificationStore((s) => s.setPushEnabled);

  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  const enablePush = async () => {
    if (!pushAllowed) return;
    const permission = await requestWebPushPermission();
    setPushEnabled(permission === "granted");
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        className={cn(fintechIconButton, "relative")}
        onClick={() => setOpen((v) => !v)}
        aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}
        aria-expanded={open}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-bold text-[var(--accent-foreground)]">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className={cn(
            fintechSurface,
            "absolute right-0 z-50 mt-2 w-[min(100vw-1.5rem,22rem)] overflow-hidden shadow-[var(--shadow-modal)]"
          )}
          role="dialog"
          aria-label="Notification center"
        >
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-3 py-2.5">
            <p className="text-sm font-semibold">Notifications</p>
            <div className="flex items-center gap-1">
              {unread > 0 ? (
                <button type="button" className={fintechIconButton} onClick={markAllRead} aria-label="Mark all read">
                  <CheckCheck className="h-4 w-4" />
                </button>
              ) : null}
              <button type="button" className={fintechIconButton} onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!pushEnabled && pushAllowed && typeof window !== "undefined" && "Notification" in window ? (
            <div className="border-b border-[var(--border-subtle)] px-3 py-2">
              <button
                type="button"
                className="min-h-10 w-full rounded-lg bg-[var(--accent-muted)] px-2 py-2 text-xs font-medium text-[var(--accent)] transition hover:brightness-105"
                onClick={() => void enablePush()}
              >
                Enable browser reminders
              </button>
            </div>
          ) : null}

          <ul className="max-h-[min(60dvh,20rem)] overflow-y-auto overscroll-contain">
            {notifications.length === 0 ? (
              <li className={cn("px-4 py-8 text-center text-sm", fintechMuted)}>No notifications yet</li>
            ) : (
              notifications.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "border-b border-[var(--border-subtle)] px-3 py-3 last:border-0",
                    !n.read && "bg-[var(--surface-elevated)]"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={cn("text-xs font-medium uppercase tracking-wide", kindColors[n.kind] ?? fintechMuted)}>
                        {n.kind.replace(/_/g, " ")}
                      </p>
                      <p className="mt-0.5 text-sm font-medium">{n.title}</p>
                      <p className={cn("mt-0.5 text-xs leading-relaxed", fintechMuted)}>{n.body}</p>
                      {n.href ? (
                        <Link href={n.href} className="mt-1 inline-block text-xs font-medium text-[var(--accent)]" onClick={() => setOpen(false)}>
                          View
                        </Link>
                      ) : null}
                    </div>
                    <button type="button" className={fintechIconButton} onClick={() => dismiss(n.id)} aria-label="Dismiss">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
