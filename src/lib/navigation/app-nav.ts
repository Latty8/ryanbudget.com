import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Ellipsis,
  Grid3x3,
  HeartPulse,
  History,
  Images,
  LayoutDashboard,
  LayoutTemplate,
  PiggyBank,
  ReceiptText,
  RefreshCw,
  Scale,
  Settings,
  Sparkles,
  LineChart,
  Tags,
  Users,
  CircleDollarSign,
  Wand2,
  Wallet,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description?: string;
};

export const APP_HOME = "/dashboard";

/** Six sidebar destinations: five links + More (dropdown). */
export const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ReceiptText },
  { href: "/budgets", label: "Budgets", icon: CircleDollarSign },
  { href: "/recurring", label: "Paycheck Planner", icon: RefreshCw },
  { href: "/insights", label: "Insights", icon: LineChart, description: "Trends, reviews, net worth & health" },
];

/** Everything else — accounts, setup, templates, and tools. */
export const MORE_NAV: NavItem[] = [
  {
    href: "/accounts",
    label: "Accounts",
    icon: Wallet,
    description: "Wallets & balances",
  },
  {
    href: "/categories",
    label: "Categories",
    icon: Tags,
    description: "Groups, icons & budgets",
  },
  {
    href: "/template-library",
    label: "Templates",
    icon: LayoutTemplate,
    description: "Budget plans & quick transactions",
  },
  {
    href: "/goals",
    label: "Funds & Debts",
    icon: PiggyBank,
    description: "Sinking funds & debt payoff",
  },
  {
    href: "/receipts",
    label: "Receipts",
    icon: Images,
    description: "Receipt gallery & attachments",
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
    description: "Profile, data & preferences",
  },
];

export type InsightsTabId =
  | "trends"
  | "reviews"
  | "reports"
  | "heatmap"
  | "net-worth"
  | "health";

export const INSIGHTS_TABS: { id: InsightsTabId; label: string; icon: LucideIcon }[] = [
  { id: "trends", label: "Trends", icon: LineChart },
  { id: "reviews", label: "Reviews", icon: Sparkles },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "heatmap", label: "Heatmap", icon: Grid3x3 },
  { id: "net-worth", label: "Net worth", icon: Scale },
  { id: "health", label: "Health", icon: HeartPulse },
];

const MORE_HREFS = new Set(MORE_NAV.map((item) => item.href));

/** Legacy analytics routes merged into /insights */
const LEGACY_INSIGHTS_PATHS = new Set(["/reviews", "/reports", "/net-worth"]);

export function isInsightsActive(pathname: string): boolean {
  if (pathname === "/insights" || pathname.startsWith("/insights/")) return true;
  return LEGACY_INSIGHTS_PATHS.has(pathname);
}

export function isMoreNavActive(pathname: string): boolean {
  if (pathname === "/more") return true;
  if (pathname.startsWith("/household")) return true;
  if (pathname.startsWith("/template-library")) return true;
  if (pathname.startsWith("/transaction-templates") || pathname.startsWith("/budget-templates")) return true;
  return MORE_NAV.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
}

export function isNavItemActive(href: string, pathname: string): boolean {
  if (href === "/more") return isMoreNavActive(pathname);
  if (href === "/insights") return isInsightsActive(pathname);
  if (MORE_HREFS.has(href)) return pathname === href || pathname.startsWith(`${href}/`);
  return pathname === href || pathname.startsWith(`${href}/`);
}

export const MOBILE_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/transactions", label: "Activity", icon: ReceiptText },
  { href: "/budgets", label: "Budgets", icon: CircleDollarSign },
  { href: "/recurring", label: "Planner", icon: RefreshCw },
  { href: "/insights", label: "Insights", icon: LineChart },
  { href: "/more", label: "More", icon: Ellipsis },
];

export const MARKETING_PATHS = new Set(["/", "/pricing", "/changelog", "/help", "/templates"]);
