import { addDays, format } from "date-fns";
import { nanoid } from "nanoid";
import { logActivity } from "@/store/useActivityLogStore";
import { useAppDataStore } from "@/store/useAppDataStore";
import type { PublicBudgetTemplate } from "@/types/budget-template";

export function applyPublicTemplate(template: PublicBudgetTemplate) {
  useAppDataStore.getState().loadFromPublicTemplate({
    accounts: template.accounts.map((a) => ({
      ...a,
      id: nanoid(),
      balance: 0,
      color: "#38bdf8",
      icon: "Wallet",
    })),
    categories: template.categories.map((c) => ({ ...c, id: nanoid() })),
    recurring: template.recurring.map((r) => ({
      id: nanoid(),
      name: r.name,
      amount: r.amount,
      cadence: r.cadence,
      nextDate: format(addDays(new Date(), 7), "yyyy-MM-dd"),
    })),
    goals: (template.goals ?? []).map((g) => ({
      id: nanoid(),
      name: g.name,
      target: g.target,
      current: 0,
      targetDate: format(addDays(new Date(), 180), "yyyy-MM-dd"),
      icon: g.icon ?? "Target",
      color: g.color ?? "#22c55e",
      fundType: "general" as const,
    })),
  });
  logActivity("created", "import", template.name, "Budget template imported");
}
