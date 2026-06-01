import type { AppAccount } from "@/types/app-settings";
import type { NetWorthItem } from "@/types/net-worth";

export type NetWorthLineItem = NetWorthItem & { source: "account" | "manual" };

export function buildNetWorthItems(
  accounts: AppAccount[],
  manualItems: NetWorthItem[]
): NetWorthLineItem[] {
  const fromAccounts: NetWorthLineItem[] = accounts
    .filter((a) => !a.hidden)
    .map((a) => ({
      id: `acc-${a.id}`,
      name: a.name,
      kind: a.kind === "credit" ? ("liability" as const) : ("asset" as const),
      balance: Math.abs(a.balance),
      accountId: a.id,
      includeInChart: true,
      source: "account" as const,
    }));

  const manual: NetWorthLineItem[] = manualItems.map((m) => ({ ...m, source: "manual" as const }));

  return [...fromAccounts, ...manual];
}

export function sumNetWorth(items: NetWorthLineItem[]) {
  let assets = 0;
  let liabilities = 0;
  for (const item of items) {
    if (!item.includeInChart) continue;
    if (item.kind === "asset") assets += item.balance;
    else liabilities += item.balance;
  }
  return { assets, liabilities, netWorth: assets - liabilities };
}
