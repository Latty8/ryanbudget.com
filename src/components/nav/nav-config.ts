import type { ComponentType, SVGProps } from "react";
import {
  IconBudget,
  IconCategories,
  IconDebts,
  IconHome,
  IconTransactions,
  IconVault,
  IconWallet,
} from "@/components/nav/icons";

export type NavIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type NavLink = {
  href: string;
  label: string;
  icon: NavIcon;
};

export const NAV_PRIMARY: NavLink[] = [
  { href: "/", label: "Overview", icon: IconHome },
  { href: "/transactions", label: "Transactions", icon: IconTransactions },
  { href: "/accounts", label: "Accounts", icon: IconWallet },
  { href: "/budgets", label: "Budget", icon: IconBudget },
];

export const NAV_MORE: NavLink[] = [
  { href: "/vaults", label: "Vaults", icon: IconVault },
  { href: "/debts", label: "Debts", icon: IconDebts },
  { href: "/categories", label: "Categories", icon: IconCategories },
];

export const NAV_ALL: NavLink[] = [...NAV_PRIMARY, ...NAV_MORE];

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

