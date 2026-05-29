"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  generateSmartNotifications,
  notificationFingerprint,
} from "@/lib/notifications/generate-notifications";
import type { AppNotification } from "@/types/notifications";

type NotificationState = {
  notifications: AppNotification[];
  pushEnabled: boolean;
  lastSyncedAt: string | null;
  syncFromAppData: (data: Parameters<typeof generateSmartNotifications>[0]) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  setPushEnabled: (enabled: boolean) => void;
  unreadCount: () => number;
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      pushEnabled: false,
      lastSyncedAt: null,

      syncFromAppData: (data) => {
        const generated = generateSmartNotifications(data);
        const existing = get().notifications;
        const fingerprints = new Set(existing.map((n) => notificationFingerprint(n)));

        const merged: AppNotification[] = [...existing];
        for (const next of generated) {
          const fp = notificationFingerprint(next);
          if (fingerprints.has(fp)) continue;
          fingerprints.add(fp);
          merged.unshift(next);
        }

        set({
          notifications: merged.slice(0, 40),
          lastSyncedAt: new Date().toISOString(),
        });
      },

      markRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

      dismiss: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      setPushEnabled: (pushEnabled) => set({ pushEnabled }),

      unreadCount: () => get().notifications.filter((n) => !n.read).length,
    }),
    { name: "paycheck-planner-notifications" }
  )
);
