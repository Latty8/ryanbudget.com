import type { AccountKind } from "@/types/finance";

export type AccountKindTheme = {
  label: string;
  accent: string;
  gradient: string;
  badge: string;
};

export const ACCOUNT_KIND_THEME: Record<AccountKind, AccountKindTheme> = {
  checking: {
    label: "Checking",
    accent: "#3b82f6",
    gradient: "from-blue-500/15 via-blue-500/5 to-transparent",
    badge: "bg-blue-500/10 text-blue-700",
  },
  savings: {
    label: "Savings",
    accent: "#10b981",
    gradient: "from-emerald-500/15 via-emerald-500/5 to-transparent",
    badge: "bg-emerald-500/10 text-emerald-700",
  },
  credit: {
    label: "Credit",
    accent: "#f43f5e",
    gradient: "from-rose-500/15 via-rose-500/5 to-transparent",
    badge: "bg-rose-500/10 text-rose-700",
  },
  cash: {
    label: "Cash",
    accent: "#f59e0b",
    gradient: "from-amber-500/15 via-amber-500/5 to-transparent",
    badge: "bg-amber-500/10 text-amber-800",
  },
  investment: {
    label: "Investment",
    accent: "#8b5cf6",
    gradient: "from-violet-500/15 via-violet-500/5 to-transparent",
    badge: "bg-violet-500/10 text-violet-700",
  },
};

export function getAccountKindTheme(kind: AccountKind): AccountKindTheme {
  return ACCOUNT_KIND_THEME[kind] ?? ACCOUNT_KIND_THEME.checking;
}
