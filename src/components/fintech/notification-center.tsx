"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, X } from "lucide-react";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useNotificationEngine } from "@/hooks/use-notification-engine";
import { usePremium } from "@/hooks/use-premium";
import { requestWebPushPermission } from "@/lib/notifications/push";
import { cn } from "@/lib/utils";
import { useFintechTheme } from "@/components/fintech/theme";

const kindColors: Record<string, string> = {
  bill_due: "text-amber-400",
  budget_alert: "text-rose-300",
  goal_milestone: "text-emerald-400",
  paycheck_reminder: "text-sky-400",
  system: "text-slate-400",
};

export function NotificationCenter() {
  useNotificationEngine();
  const { theme } = useFintechTheme();
  const isLight = theme === "light";
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
        className={cn(
          "relative inline-flex h-10 w-10 items-center justify-center rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
          isLight
            ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            : "border-slate-600 bg-neutral-900 text-slate-200 hover:bg-neutral-800"
        )}
        onClick={() => setOpen((v) => !v)}
        aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}
        aria-expanded={open}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-bold text-slate-950">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className={cn(
            "absolute right-0 z-50 mt-2 w-[min(100vw-1.5rem,22rem)] overflow-hidden rounded-2xl border shadow-xl",
            isLight ? "border-slate-200 bg-white text-slate-900" : "border-slate-700 bg-neutral-900 text-slate-100"
          )}
          role="dialog"
          aria-label="Notification center"
        >
          <div className="flex items-center justify-between border-b border-slate-700/50 px-3 py-2.5">
            <p className="text-sm font-semibold">Notifications</p>
            <div className="flex items-center gap-1">
              {unread > 0 ? (
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-neutral-800 hover:text-slate-200"
                  onClick={markAllRead}
                  aria-label="Mark all read"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
              ) : null}
              <button
                type="button"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-neutral-800"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!pushEnabled && pushAllowed && typeof window !== "undefined" && "Notification" in window ? (
            <div className="border-b border-slate-700/40 px-3 py-2">
              <button
                type="button"
                className="w-full rounded-lg bg-sky-500/15 px-2 py-1.5 text-xs text-sky-300 hover:bg-sky-500/25"
                onClick={() => void enablePush()}
              >
                Enable browser reminders (PWA)
              </button>
            </div>
          ) : null}

          <ul className="max-h-80 overflow-y-auto overscroll-contain">
            {notifications.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-slate-400">No notifications yet</li>
            ) : (
              notifications.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "border-b border-slate-700/30 px-3 py-2.5 last:border-0",
                    !n.read && (isLight ? "bg-sky-50/80" : "bg-sky-500/5")
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-xs font-medium", kindColors[n.kind] ?? "text-slate-300")}>
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">{n.body}</p>
                      {n.href ? (
                        <Link
                          href={n.href}
                          className="mt-1 inline-block text-xs text-sky-400 hover:underline"
                          onClick={() => {
                            markRead(n.id);
                            setOpen(false);
                          }}
                        >
                          View →
                        </Link>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="shrink-0 rounded p-1 text-slate-500 hover:text-slate-300"
                      onClick={() => dismiss(n.id)}
                      aria-label="Dismiss"
                    >
                      <X className="h-3 w-3" />
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
