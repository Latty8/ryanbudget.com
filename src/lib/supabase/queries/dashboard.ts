import { hasSupabaseEnv, supabase } from "@/lib/supabase/client";
import { computeDashboardSummary, defaultDemoSummary } from "@/lib/dashboard/compute-summary";
import { enrichedAccounts } from "@/lib/demo/enriched-demo-data";
import { demoBudgets, demoRecurring, demoTransactions } from "@/lib/demo/sample-data";
import type { DashboardSummary } from "@/types/finance";

/** Server-safe fetch; client dashboard prefers live store via hook. */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  if (hasSupabaseEnv && supabase) {
    const { data: accounts } = await supabase.from("accounts").select("id,name,type,balance").limit(6);
    const { data: categories } = await supabase.from("categories").select("id,name,group_name,monthly_target").limit(12);
    const totalBalance = (accounts ?? []).reduce((sum, a) => sum + Number(a.balance ?? 0), 0);
    const fallback = defaultDemoSummary();
    return {
      ...fallback,
      totalBalance: totalBalance || fallback.totalBalance,
      categoryProgress: (categories ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        group: c.group_name,
        budgeted: Number(c.monthly_target ?? 0),
        spent: Number(c.monthly_target ?? 0) * 0.62,
        rolloverEnabled: true,
      })).length
        ? (categories ?? []).map((c) => ({
            id: c.id,
            name: c.name,
            group: c.group_name,
            budgeted: Number(c.monthly_target ?? 0),
            spent: Number(c.monthly_target ?? 0) * 0.62,
            rolloverEnabled: true,
          }))
        : fallback.categoryProgress,
    };
  }

  return computeDashboardSummary({
    accounts: enrichedAccounts.length ? enrichedAccounts : [
      { id: "acc-checking", name: "Main Checking", kind: "checking", balance: 2840.44, color: "#38bdf8", icon: "Wallet" },
      { id: "acc-savings", name: "High-Yield Savings", kind: "savings", balance: 9300, color: "#34d399", icon: "PiggyBank" },
      { id: "acc-credit", name: "Rewards Credit Card", kind: "credit", balance: -742.15, color: "#f472b6", icon: "CreditCard" },
    ],
    categories: demoBudgets.map((b, idx) => ({
      id: `cat-${idx}`,
      name: b.category,
      group: "Spending",
      icon: "Wallet",
      color: "#38bdf8",
      budgeted: b.budgeted,
    })),
    transactions: demoTransactions,
    recurring: demoRecurring.map((r) => ({
      id: r.id,
      name: r.name,
      amount: r.amount,
      cadence: r.cadence as "weekly" | "bi-weekly" | "monthly" | "yearly",
      nextDate: r.nextDate,
    })),
  });
}
