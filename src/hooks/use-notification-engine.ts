"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useAppDataStore } from "@/store/useAppDataStore";
import { useShallow } from "zustand/react/shallow";

/** Refreshes smart notifications from app data; toasts high-priority new items. */
export function useNotificationEngine() {
  const syncFromAppData = useNotificationStore((s) => s.syncFromAppData);
  const prevUnread = useRef(0);

  const { recurring, categories, goals, transactions } = useAppDataStore(
    useShallow((s) => ({
      recurring: s.demoRecurring,
      categories: s.categories,
      goals: s.goals,
      transactions: s.demoTransactions,
    }))
  );

  useEffect(() => {
    syncFromAppData({
      recurring,
      categories,
      goals,
      transactions: transactions.map((t) => ({
        category: t.category,
        amount: t.amount,
        date: t.date,
      })),
    });

    const unread = useNotificationStore.getState().unreadCount();
    const newHigh = useNotificationStore
      .getState()
      .notifications.filter((n) => !n.read && n.priority === "high").length;

    if (unread > prevUnread.current && newHigh > 0) {
      const latest = useNotificationStore.getState().notifications.find((n) => !n.read && n.priority === "high");
      if (latest) {
        toast(latest.title, { description: latest.body });
      }
    }
    prevUnread.current = unread;
  }, [syncFromAppData, recurring, categories, goals, transactions]);
}
