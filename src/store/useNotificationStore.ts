"use client";

import { addHours } from "date-fns";
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
  /** Fingerprint → ISO snooze expiry (syncs across tabs via persist) */
  snoozedUntil: Record<string, string>;
  syncFromAppData: (data: Parameters<typeof generateSmartNotifications>[0]) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  snooze: (notification: AppNotification, hours?: number) => void;
  setPushEnabled: (enabled: boolean) => void;
  unreadCount: () => number;
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      pushEnabled: false,
      lastSyncedAt: null,
      snoozedUntil: {},

      syncFromAppData: (data) => {
        const generated = generateSmartNotifications(data);
        const now = Date.now();
        const { snoozedUntil } = get();

        const readFingerprints = new Set(
          get()
            .notifications.filter((n) => n.read)
            .map((n) => notificationFingerprint(n))
        );

        const notifications = generated
          .filter((n) => {
            const fp = notificationFingerprint(n);
            const until = snoozedUntil[fp];
            if (!until) return true;
            return new Date(until).getTime() <= now;
          })
          .map((n) => ({
            ...n,
            read: readFingerprints.has(notificationFingerprint(n)),
          }));

        set({
          notifications,
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

      snooze: (notification, hours = 24) => {
        const fp = notificationFingerprint(notification);
        set((state) => ({
          snoozedUntil: {
            ...state.snoozedUntil,
            [fp]: addHours(new Date(), hours).toISOString(),
          },
          notifications: state.notifications.filter((n) => n.id !== notification.id),
        }));
      },

      setPushEnabled: (pushEnabled) => set({ pushEnabled }),

      unreadCount: () => get().notifications.filter((n) => !n.read).length,
    }),
    { name: "paycheck-planner-notifications" }
  )
);
