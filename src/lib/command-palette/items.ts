import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CircleDollarSign,
  History,
  Images,
  LayoutDashboard,
  LayoutTemplate,
  PiggyBank,
  Plus,
  ReceiptText,
  RefreshCw,
  Scale,
  Settings,
  Sparkles,
  Tags,
  Target,
  TrendingUp,
  Upload,
  Users,
  Wallet,
  Wand2,
} from "lucide-react";
import type { AppAccount, AppCategory, AppGoal } from "@/types/app-settings";
import type { DemoTransaction } from "@/lib/demo/sample-data";
import type { TransactionRule } from "@/types/transaction-rules";
import { loadRecentPalette, type RecentPaletteEntry } from "@/lib/command-palette/recent";

export type PaletteSection =
  | "Recent"
  | "Transactions"
  | "Wallets"
  | "Categories"
  | "Budgets"
  | "Goals"
  | "Rules"
  | "Navigate"
  | "Actions"
  | "Reports"
  | "Settings";

export type PaletteItem = {
  id: string;
  section: PaletteSection;
  title: string;
  subtitle?: string;
  keywords: string[];
  icon: LucideIcon;
  href?: string;
  action?: "new-transaction" | "export-data";
  amount?: number;
  /** Lower = higher in list */
  rank: number;
};

const RANK = {
  recent: 2,
  transactionExact: 0,
  transaction: 10,
  wallet: 20,
  category: 25,
  budget: 28,
  goal: 30,
  rule: 32,
  navGoTo: 40,
  nav: 45,
  action: 50,
  report: 55,
  settings: 60,
  default: 70,
} as const;

function nav(
  id: string,
  title: string,
  href: string,
  subtitle: string,
  keywords: string[],
  icon: LucideIcon,
  goTo = true
): PaletteItem {
  return {
    id,
    section: "Navigate",
    title: goTo ? `Go to ${title}` : title,
    subtitle,
    keywords: [title.toLowerCase(), ...keywords, "go", "open", "navigate"],
    icon,
    href,
    rank: RANK.navGoTo,
  };
}

const NAV: PaletteItem[] = [
  nav("nav-dashboard", "Dashboard", "/dashboard", "Overview & insights", ["home", "overview"], LayoutDashboard),
  nav("nav-transactions", "Transactions", "/transactions", "Activity & receipts", ["spending", "expenses"], ReceiptText),
  nav("nav-budgets", "Budgets", "/budgets", "Plan by category", ["budget", "envelope"], CircleDollarSign),
  nav("nav-recurring", "Paycheck Planner", "/recurring", "Bills & paychecks", ["bills", "paycheck", "planner"], RefreshCw),
  nav("nav-insights", "Insights", "/insights", "Trends, reviews, net worth & health", ["analytics", "insights", "trends"], BarChart3),
  nav("nav-insights-reviews", "Monthly review", "/insights?tab=reviews", "Insights · reviews", ["review", "monthly"], Sparkles),
  nav("nav-insights-health", "Financial health", "/insights?tab=health", "Insights · health score", ["health", "score"], Sparkles),
  nav("nav-accounts", "Accounts", "/accounts", "Wallets & balances", ["wallet", "bank"], Wallet),
  nav("nav-categories", "Categories", "/categories", "Groups & limits", ["tags"], Tags),
  nav("nav-templates", "Templates", "/template-library", "Budget plans & quick transactions", ["template", "50/30/20", "quick"], LayoutTemplate),
  nav("nav-goals", "Funds & Debts", "/goals", "Sinking funds & debt payoff", ["savings", "goals", "funds", "debt", "loan"], PiggyBank),
  nav("nav-insights-networth", "Net worth", "/insights?tab=net-worth", "Insights · balance sheet", ["wealth", "assets"], Scale),
  nav("nav-rules", "Rules", "/rules", "Auto-categorize transactions", ["categorize", "merchant"], Wand2),
  nav("nav-receipts", "Receipts", "/receipts", "Receipt gallery & vault", ["receipt", "attachments", "images"], Images),
  nav("nav-activity", "Activity Log", "/activity", "Recent changes", ["history", "audit"], History),
  nav("nav-household", "Household", "/household", "Shared planning", ["family"], Users),
  nav("nav-settings", "Settings", "/settings", "Profile & data", ["preferences"], Settings),
];

const ACTIONS: PaletteItem[] = [
  {
    id: "act-new-tx",
    section: "Actions",
    title: "New transaction",
    subtitle: "Record income or expense",
    keywords: ["add", "create", "expense", "income", "new"],
    icon: Plus,
    action: "new-transaction",
    rank: RANK.action,
  },
  {
    id: "act-goal",
    section: "Actions",
    title: "Add fund or debt",
    subtitle: "Sinking fund or debt tracker",
    keywords: ["goal", "savings", "target", "add", "debt", "loan"],
    icon: Target,
    href: "/goals",
    rank: RANK.action,
  },
  {
    id: "act-budget",
    section: "Actions",
    title: "Add budget",
    subtitle: "Set category limits",
    keywords: ["budget", "limit", "add"],
    icon: CircleDollarSign,
    href: "/budgets",
    rank: RANK.action + 1,
  },
  {
    id: "act-wallet",
    section: "Actions",
    title: "Add wallet",
    subtitle: "Link an account",
    keywords: ["account", "wallet", "add"],
    icon: Wallet,
    href: "/accounts",
    rank: RANK.action + 2,
  },
  {
    id: "act-export",
    section: "Actions",
    title: "Export data",
    subtitle: "Download JSON or CSV backup",
    keywords: ["export", "download", "backup", "json", "csv"],
    icon: Upload,
    action: "export-data",
    rank: RANK.action + 3,
  },
  {
    id: "act-whatif",
    section: "Actions",
    title: "What-if scenario",
    subtitle: "Open AI coach",
    keywords: ["simulate", "coach", "ai", "what if"],
    icon: Wand2,
    href: "/dashboard",
    rank: RANK.action + 4,
  },
];

const SETTINGS: PaletteItem[] = [
  {
    id: "set-export",
    section: "Settings",
    title: "Export data",
    subtitle: "Settings → backup",
    keywords: ["export", "download", "backup"],
    icon: Upload,
    href: "/settings",
    rank: RANK.settings,
  },
  {
    id: "set-sub",
    section: "Settings",
    title: "Subscription",
    subtitle: "Premium & billing",
    keywords: ["premium", "upgrade", "billing"],
    icon: TrendingUp,
    href: "/settings",
    rank: RANK.settings + 1,
  },
];

const REPORTS: PaletteItem[] = [
  {
    id: "rep-main",
    section: "Reports",
    title: "Go to Reports",
    subtitle: "Insights · cash flow & charts",
    keywords: ["report", "analytics", "charts"],
    icon: BarChart3,
    href: "/insights?tab=reports",
    rank: RANK.report,
  },
];

function scoreMatch(item: PaletteItem, q: string): number | null {
  const title = item.title.toLowerCase();
  const subtitle = (item.subtitle ?? "").toLowerCase();
  const keys = item.keywords.join(" ").toLowerCase();
  const hay = `${title} ${subtitle} ${keys}`;

  const bare = title.replace(/^go to /i, "");
  if (title === q || bare === q || q === bare) return item.rank;
  if (title.startsWith(q) || bare.startsWith(q)) return item.rank + 2;
  if (hay.includes(q)) return item.rank + 8;
  if (q.startsWith("go ") && hay.includes(q.slice(3).trim())) return item.rank + 6;
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length > 1 && tokens.every((t) => hay.includes(t))) return item.rank + 12;
  return null;
}

function recentToItems(recent: RecentPaletteEntry[], transactions: DemoTransaction[]): PaletteItem[] {
  const icon = ReceiptText;
  return recent.map((r) => {
    const tx = transactions.find((t) => r.id === `tx-${t.id}`);
    return {
      id: r.id,
      section: "Recent" as const,
      title: r.title,
      subtitle: tx ? `${tx.category} · ${tx.date}` : "Recently opened",
      keywords: [],
      icon: r.id.startsWith("tx-") ? icon : LayoutDashboard,
      href: r.href,
      action: r.action,
      amount: tx?.amount,
      rank: RANK.recent,
    };
  });
}

function latestTransactions(transactions: DemoTransaction[]): PaletteItem[] {
  return [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4)
    .map((t) => ({
      id: `tx-${t.id}`,
      section: "Recent" as const,
      title: t.merchant,
      subtitle: `${t.category} · ${t.date}`,
      keywords: [],
      icon: ReceiptText,
      href: `/transactions?highlight=${t.id}`,
      amount: t.amount,
      rank: RANK.recent + 1,
    }));
}

export function buildPaletteItems(input: {
  query: string;
  transactions: DemoTransaction[];
  accounts: AppAccount[];
  categories: AppCategory[];
  goals: AppGoal[];
  rules?: TransactionRule[];
  recent?: RecentPaletteEntry[];
}): PaletteItem[] {
  const q = input.query.trim().toLowerCase();
  const recentEntries = input.recent ?? loadRecentPalette();

  if (!q) {
    const recentItems = recentToItems(recentEntries, input.transactions);
    const seen = new Set(recentItems.map((i) => i.id));
    const fillRecent = latestTransactions(input.transactions).filter((i) => !seen.has(i.id));
    return [
      ...recentItems,
      ...fillRecent.slice(0, Math.max(0, 4 - recentItems.length)),
      ACTIONS[0],
      ACTIONS[1],
      ACTIONS[3],
      ACTIONS[4],
      NAV.find((n) => n.id === "nav-insights"),
      NAV.find((n) => n.id === "nav-budgets"),
      NAV.find((n) => n.id === "nav-recurring"),
      NAV.find((n) => n.id === "nav-transactions"),
      SETTINGS[0],
    ].filter((item): item is PaletteItem => item != null);
  }

  const entityItems: PaletteItem[] = [];

  for (const t of input.transactions) {
    const merchant = t.merchant.toLowerCase();
    const match =
      merchant.includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.account.toLowerCase().includes(q);
    if (!match) continue;
    const exact = merchant === q || merchant.startsWith(q);
    entityItems.push({
      id: `tx-${t.id}`,
      section: "Transactions",
      title: t.merchant,
      subtitle: `${t.category} · ${t.date}`,
      keywords: [t.category, t.account],
      icon: ReceiptText,
      href: `/transactions?highlight=${t.id}`,
      amount: t.amount,
      rank: exact ? RANK.transactionExact : RANK.transaction,
    });
  }

  for (const a of input.accounts) {
    if (!a.name.toLowerCase().includes(q) && !a.kind.includes(q)) continue;
    entityItems.push({
      id: `acc-${a.id}`,
      section: "Wallets",
      title: a.name,
      subtitle: a.kind,
      keywords: ["wallet", "account"],
      icon: Wallet,
      href: "/accounts",
      rank: RANK.wallet,
    });
  }

  for (const c of input.categories) {
    if (!c.name.toLowerCase().includes(q) && !c.group.toLowerCase().includes(q)) continue;
    entityItems.push({
      id: `cat-${c.id}`,
      section: "Categories",
      title: c.name,
      subtitle: c.group,
      keywords: ["category"],
      icon: Tags,
      href: "/categories",
      rank: RANK.category,
    });
    if (c.budgeted > 0 && (c.name.toLowerCase().includes(q) || q.includes("budget"))) {
      entityItems.push({
        id: `bud-${c.id}`,
        section: "Budgets",
        title: `${c.name} budget`,
        subtitle: `Budgeted · ${c.group}`,
        keywords: ["budget"],
        icon: CircleDollarSign,
        href: "/budgets",
        rank: RANK.budget,
      });
    }
  }

  for (const g of input.goals) {
    if (!g.name.toLowerCase().includes(q) && !q.includes("goal") && !q.includes("fund")) continue;
    entityItems.push({
      id: `goal-${g.id}`,
      section: "Goals",
      title: g.name,
      subtitle: `${Math.round((g.current / Math.max(g.target, 1)) * 100)}% funded`,
      keywords: ["goal", "fund", "sinking"],
      icon: PiggyBank,
      href: "/goals",
      rank: RANK.goal,
    });
  }

  for (const rule of input.rules ?? []) {
    const hay = `${rule.name} ${rule.categoryName} ${rule.merchantContains.join(" ")}`.toLowerCase();
    if (!hay.includes(q) && !q.includes("rule")) continue;
    entityItems.push({
      id: `rule-${rule.id}`,
      section: "Rules",
      title: rule.name,
      subtitle: `→ ${rule.categoryName}`,
      keywords: ["rule", "auto", "categorize", ...rule.merchantContains],
      icon: Wand2,
      href: "/rules",
      rank: RANK.rule,
    });
  }

  const staticPool = [...NAV, ...ACTIONS, ...REPORTS, ...SETTINGS];
  const staticMatched = staticPool
    .map((item) => ({ item, score: scoreMatch(item, q) }))
    .filter((x): x is { item: PaletteItem; score: number } => x.score !== null);

  const merged = [...entityItems, ...staticMatched.map((x) => ({ ...x.item, rank: x.score }))];
  merged.sort((a, b) => a.rank - b.rank || a.title.localeCompare(b.title));

  return merged.slice(0, 18);
}

export const SECTION_ORDER: PaletteSection[] = [
  "Recent",
  "Transactions",
  "Wallets",
  "Categories",
  "Budgets",
  "Goals",
  "Rules",
  "Navigate",
  "Actions",
  "Reports",
  "Settings",
];

export function groupPaletteItems(items: PaletteItem[]): Array<{ section: PaletteSection; items: PaletteItem[] }> {
  const map = new Map<PaletteSection, PaletteItem[]>();
  for (const item of items) {
    if (!item?.section) continue;
    const list = map.get(item.section) ?? [];
    list.push(item);
    map.set(item.section, list);
  }
  return SECTION_ORDER.filter((s) => map.has(s)).map((section) => ({
    section,
    items: map.get(section)!,
  }));
}
