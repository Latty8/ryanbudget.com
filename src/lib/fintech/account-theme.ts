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
    gradient: "from-sky-500/20 via-blue-500/10 to-transparent",
    badge: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  },
  savings: {
    label: "Savings",
    accent: "#10b981",
    gradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
    badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  },
  credit: {
    label: "Credit",
    accent: "#f43f5e",
    gradient: "from-rose-500/20 via-pink-500/10 to-transparent",
    badge: "bg-rose-500/15 text-rose-600 dark:text-rose-300",
  },
  cash: {
    label: "Cash",
    accent: "#f59e0b",
    gradient: "from-amber-500/20 via-orange-500/10 to-transparent",
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  investment: {
    label: "Investment",
    accent: "#8b5cf6",
    gradient: "from-violet-500/20 via-purple-500/10 to-transparent",
    badge: "bg-violet-500/15 text-violet-600 dark:text-violet-300",
  },
};

export function getAccountKindTheme(kind: AccountKind): AccountKindTheme {
  return ACCOUNT_KIND_THEME[kind] ?? ACCOUNT_KIND_THEME.checking;
}
