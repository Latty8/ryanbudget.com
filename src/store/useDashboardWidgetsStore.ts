"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DashboardWidgetId =
  | "financial_health"
  | "balance"
  | "money_left"
  | "monthly_summary"
  | "income_expenses"
  | "budget_progress"
  | "cashflow"
  | "upcoming"
  | "ai_insights"
  | "net_worth";

export type DashboardWidgetConfig = {
  id: DashboardWidgetId;
  enabled: boolean;
  order: number;
};

const DEFAULT_WIDGETS: DashboardWidgetConfig[] = [
  { id: "financial_health", enabled: true, order: 0 },
  { id: "balance", enabled: true, order: 1 },
  { id: "money_left", enabled: true, order: 2 },
  { id: "monthly_summary", enabled: true, order: 3 },
  { id: "income_expenses", enabled: true, order: 4 },
  { id: "budget_progress", enabled: true, order: 5 },
  { id: "cashflow", enabled: true, order: 6 },
  { id: "upcoming", enabled: true, order: 7 },
  { id: "ai_insights", enabled: true, order: 8 },
  { id: "net_worth", enabled: false, order: 9 },
];

type WidgetState = {
  widgets: DashboardWidgetConfig[];
  setWidgetEnabled: (id: DashboardWidgetId, enabled: boolean) => void;
  reorderWidgets: (orderedIds: DashboardWidgetId[]) => void;
  resetWidgets: () => void;
  isEnabled: (id: DashboardWidgetId) => boolean;
  orderedEnabled: () => DashboardWidgetId[];
};

function normalizeWidgets(widgets: DashboardWidgetConfig[] | undefined): DashboardWidgetConfig[] {
  if (!widgets?.length) return DEFAULT_WIDGETS;
  const merged = DEFAULT_WIDGETS.map((def) => {
    const saved = widgets.find((w) => w.id === def.id);
    return saved ? { ...def, enabled: saved.enabled, order: saved.order } : def;
  });
  const hasEnabled = merged.some((w) => w.enabled);
  return hasEnabled ? merged : DEFAULT_WIDGETS;
}

export const useDashboardWidgetsStore = create<WidgetState>()(
  persist(
    (set, get) => ({
      widgets: DEFAULT_WIDGETS,
      setWidgetEnabled: (id, enabled) =>
        set((state) => ({
          widgets: state.widgets.map((w) => (w.id === id ? { ...w, enabled } : w)),
        })),
      reorderWidgets: (orderedIds) =>
        set((state) => ({
          widgets: state.widgets.map((w) => ({
            ...w,
            order: orderedIds.indexOf(w.id) >= 0 ? orderedIds.indexOf(w.id) : w.order,
          })),
        })),
      resetWidgets: () => set({ widgets: DEFAULT_WIDGETS }),
      isEnabled: (id) => get().widgets.find((w) => w.id === id)?.enabled ?? true,
      orderedEnabled: () =>
        [...get().widgets]
          .filter((w) => w.enabled)
          .sort((a, b) => a.order - b.order)
          .map((w) => w.id),
    }),
    {
      name: "paycheck-planner-dashboard-widgets",
      merge: (persisted, current) => {
        const p = persisted as Partial<WidgetState> | undefined;
        return {
          ...current,
          widgets: normalizeWidgets(p?.widgets),
        };
      },
    }
  )
);

/** Stable primitive for selectors — avoids getServerSnapshot / infinite loop issues. */
export function selectEnabledWidgetKey(state: WidgetState): string {
  return state.widgets
    .filter((w) => w.enabled)
    .sort((a, b) => a.order - b.order)
    .map((w) => w.id)
    .join("\0");
}

export function selectWidgetsConfigKey(state: WidgetState): string {
  return state.widgets
    .sort((a, b) => a.order - b.order)
    .map((w) => `${w.id}:${w.enabled ? 1 : 0}:${w.order}`)
    .join("|");
}

export const DASHBOARD_WIDGET_LABELS: Record<DashboardWidgetId, string> = {
  financial_health: "Financial health score",
  balance: "Current balance",
  money_left: "Money left to spend",
  monthly_summary: "Monthly summary",
  income_expenses: "Income & expenses",
  budget_progress: "Budget progress",
  cashflow: "Cash flow chart",
  upcoming: "Upcoming bills & paycheck",
  ai_insights: "AI insights",
  net_worth: "Net worth snapshot",
};
