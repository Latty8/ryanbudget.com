import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Ellipsis,
  History,
  LayoutDashboard,
  LayoutTemplate,
  PiggyBank,
  ReceiptText,
  RefreshCw,
  Scale,
  Settings,
  Sparkles,
  Tags,
  Users,
  Wallet,
  CircleDollarSign,
  Wand2,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description?: string;
};

export const APP_HOME = "/dashboard";

export const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ReceiptText },
  { href: "/budgets", label: "Budgets", icon: CircleDollarSign },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/recurring", label: "Paycheck Planner", icon: RefreshCw },
  { href: "/reviews", label: "Reviews", icon: Sparkles },
];

export const MORE_NAV: NavItem[] = [
  {
    href: "/budget-templates",
    label: "Templates",
    icon: LayoutTemplate,
    description: "Import bi-weekly & 50/30/20 plans",
  },
  {
    href: "/reports",
    label: "Reports",
    icon: BarChart3,
    description: "Charts, cash flow & exports",
  },
  {
    href: "/goals",
    label: "Sinking Funds",
    icon: PiggyBank,
    description: "Vacation, holidays, repairs",
  },
  {
    href: "/net-worth",
    label: "Net Worth",
    icon: Scale,
    description: "Assets, liabilities & trend",
  },
  {
    href: "/rules",
    label: "Rules",
    icon: Wand2,
    description: "Auto-categorize transactions",
  },
  {
    href: "/activity",
    label: "Activity Log",
    icon: History,
    description: "Recent edits & imports",
  },
  {
    href: "/household",
    label: "Household",
    icon: Users,
    description: "Share with a partner",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    description: "Currency, data & preferences",
  },
];

const MORE_HREFS = new Set(MORE_NAV.map((item) => item.href));

export function isMoreNavActive(pathname: string): boolean {
  if (pathname === "/more") return true;
  if (pathname.startsWith("/household")) return true;
  if (pathname.startsWith("/budget-templates")) return true;
  return MORE_NAV.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
}

export function isNavItemActive(href: string, pathname: string): boolean {
  if (href === "/more") return isMoreNavActive(pathname);
  if (MORE_HREFS.has(href)) return pathname === href || pathname.startsWith(`${href}/`);
  return pathname === href || pathname.startsWith(`${href}/`);
}

export const MOBILE_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/transactions", label: "Activity", icon: ReceiptText },
  { href: "/budgets", label: "Budgets", icon: CircleDollarSign },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/more", label: "More", icon: Ellipsis },
];

export const MARKETING_PATHS = new Set(["/", "/pricing", "/changelog", "/help", "/templates"]);
