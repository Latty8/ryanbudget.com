import type { PublicBudgetTemplate, TemplateFilterCategory } from "@/types/budget-template";

export const publicBudgetTemplates: PublicBudgetTemplate[] = [
  {
    id: "tpl-biweekly-paycheck",
    slug: "bi-weekly-paycheck-budget",
    name: "Bi-Weekly Paycheck Budget",
    description:
      "The flagship plan: split monthly bills across paychecks, weekly groceries, and savings every pay day.",
    author: "Paycheck Planner",
    tags: ["bi-weekly", "starter", "popular"],
    popularity: 4820,
    payCadence: "bi-weekly",
    filterCategory: "bi-weekly",
    accounts: [
      { name: "Main Checking", kind: "checking" },
      { name: "Savings", kind: "savings" },
      { name: "Credit Card", kind: "credit" },
    ],
    categories: [
      { name: "Income", group: "Income", icon: "Wallet", color: "#22c55e", budgeted: 0 },
      { name: "Housing", group: "Needs", icon: "Home", color: "#38bdf8", budgeted: 1200 },
      { name: "Groceries", group: "Needs", icon: "ShoppingCart", color: "#34d399", budgeted: 300 },
      { name: "Transportation", group: "Needs", icon: "Car", color: "#fbbf24", budgeted: 180 },
      { name: "Dining", group: "Wants", icon: "Utensils", color: "#fb7185", budgeted: 120 },
      { name: "Savings", group: "Goals", icon: "PiggyBank", color: "#2dd4bf", budgeted: 250 },
    ],
    recurring: [
      { name: "Payroll", amount: 1825, cadence: "bi-weekly" },
      { name: "Rent", amount: 1200, cadence: "monthly" },
      { name: "Weekly Groceries", amount: 75, cadence: "weekly" },
      { name: "Car Insurance", amount: 116, cadence: "monthly" },
    ],
    goals: [{ name: "Emergency fund", target: 3000, icon: "Shield", color: "#22c55e" }],
  },
  {
    id: "tpl-debt-snowball",
    slug: "debt-snowball",
    name: "Debt Snowball",
    description:
      "Minimums on everything, extra payments on the smallest balance first — classic momentum method.",
    author: "Paycheck Planner",
    tags: ["debt", "snowball"],
    popularity: 2910,
    payCadence: "bi-weekly",
    filterCategory: "debt",
    accounts: [
      { name: "Checking", kind: "checking" },
      { name: "Debt payoff fund", kind: "savings" },
    ],
    categories: [
      { name: "Income", group: "Income", icon: "Wallet", color: "#22c55e", budgeted: 0 },
      { name: "Minimum payments", group: "Debt", icon: "CreditCard", color: "#f97316", budgeted: 450 },
      { name: "Snowball extra", group: "Debt", icon: "Target", color: "#ef4444", budgeted: 200 },
      { name: "Essentials", group: "Needs", icon: "Home", color: "#38bdf8", budgeted: 900 },
      { name: "Flex spending", group: "Wants", icon: "Utensils", color: "#fb7185", budgeted: 150 },
    ],
    recurring: [
      { name: "Paycheck", amount: 1650, cadence: "bi-weekly" },
      { name: "Credit card min", amount: 180, cadence: "monthly" },
      { name: "Student loan min", amount: 220, cadence: "monthly" },
    ],
    goals: [{ name: "Debt-free milestone", target: 5000, icon: "Target", color: "#ef4444" }],
  },
  {
    id: "tpl-aggressive-savings",
    slug: "aggressive-savings",
    name: "Aggressive Savings",
    description: "High savings rate with lean wants — built for FIRE-minded bi-weekly earners.",
    author: "Paycheck Planner",
    tags: ["savings", "fire"],
    popularity: 2240,
    payCadence: "bi-weekly",
    filterCategory: "savings",
    accounts: [
      { name: "Checking", kind: "checking" },
      { name: "High-yield savings", kind: "savings" },
      { name: "Investing", kind: "investment" },
    ],
    categories: [
      { name: "Income", group: "Income", icon: "Wallet", color: "#22c55e", budgeted: 0 },
      { name: "Fixed bills", group: "Needs", icon: "Home", color: "#38bdf8", budgeted: 1100 },
      { name: "Groceries", group: "Needs", icon: "ShoppingCart", color: "#34d399", budgeted: 250 },
      { name: "Auto transfer savings", group: "Goals", icon: "PiggyBank", color: "#2dd4bf", budgeted: 600 },
      { name: "Fun money", group: "Wants", icon: "Music", color: "#a78bfa", budgeted: 80 },
    ],
    recurring: [
      { name: "Salary", amount: 2100, cadence: "bi-weekly" },
      { name: "Rent", amount: 950, cadence: "monthly" },
      { name: "Savings transfer", amount: 300, cadence: "bi-weekly" },
    ],
    goals: [
      { name: "6-month emergency", target: 15000, icon: "Shield", color: "#22c55e" },
      { name: "House down payment", target: 40000, icon: "Home", color: "#38bdf8" },
    ],
  },
  {
    id: "tpl-basic-monthly",
    slug: "basic-monthly-budget",
    name: "Basic Monthly Budget",
    description: "Simple monthly categories — great if you get paid once or twice a month on calendar dates.",
    author: "Paycheck Planner",
    tags: ["monthly", "simple"],
    popularity: 3560,
    payCadence: "monthly",
    filterCategory: "monthly",
    accounts: [{ name: "Checking", kind: "checking" }, { name: "Savings", kind: "savings" }],
    categories: [
      { name: "Income", group: "Income", icon: "Wallet", color: "#22c55e", budgeted: 0 },
      { name: "Housing", group: "Needs", icon: "Home", color: "#38bdf8", budgeted: 1400 },
      { name: "Food", group: "Needs", icon: "Utensils", color: "#fb7185", budgeted: 500 },
      { name: "Transport", group: "Needs", icon: "Car", color: "#fbbf24", budgeted: 200 },
      { name: "Utilities", group: "Needs", icon: "Zap", color: "#60a5fa", budgeted: 180 },
      { name: "Personal", group: "Wants", icon: "ShoppingCart", color: "#a78bfa", budgeted: 200 },
    ],
    recurring: [
      { name: "Monthly salary", amount: 4200, cadence: "monthly" },
      { name: "Rent", amount: 1400, cadence: "monthly" },
      { name: "Electric", amount: 120, cadence: "monthly" },
    ],
  },
  {
    id: "tpl-household-shared",
    slug: "household-shared-budget",
    name: "Household Shared Budget",
    description:
      "Joint checking, shared bills, and sinking funds — designed for couples or roommates on one plan.",
    author: "Paycheck Planner",
    tags: ["household", "shared", "family"],
    popularity: 1890,
    payCadence: "bi-weekly",
    filterCategory: "household",
    accounts: [
      { name: "Joint Checking", kind: "checking" },
      { name: "Household savings", kind: "savings" },
      { name: "Personal fun", kind: "cash" },
    ],
    categories: [
      { name: "Combined income", group: "Income", icon: "Wallet", color: "#22c55e", budgeted: 0 },
      { name: "Shared housing", group: "Needs", icon: "Home", color: "#38bdf8", budgeted: 1600 },
      { name: "Shared groceries", group: "Needs", icon: "ShoppingCart", color: "#34d399", budgeted: 700 },
      { name: "Kids / childcare", group: "Needs", icon: "Users", color: "#f97316", budgeted: 400 },
      { name: "Date night", group: "Wants", icon: "Heart", color: "#fb7185", budgeted: 120 },
      { name: "Joint emergency", group: "Goals", icon: "PiggyBank", color: "#2dd4bf", budgeted: 350 },
    ],
    recurring: [
      { name: "Partner A pay", amount: 1900, cadence: "bi-weekly" },
      { name: "Partner B pay", amount: 1650, cadence: "bi-weekly" },
      { name: "Mortgage", amount: 1600, cadence: "monthly" },
    ],
    goals: [{ name: "Family vacation", target: 2500, icon: "Plane", color: "#38bdf8" }],
  },
];

export const TEMPLATE_FILTERS: { id: TemplateFilterCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "bi-weekly", label: "Bi-weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "debt", label: "Debt payoff" },
  { id: "savings", label: "Savings" },
  { id: "household", label: "Household" },
];

export function getTemplateBySlug(slug: string) {
  return publicBudgetTemplates.find((t) => t.slug === slug);
}

export function filterTemplates(
  query: string,
  category: TemplateFilterCategory
): PublicBudgetTemplate[] {
  const q = query.toLowerCase().trim();
  return publicBudgetTemplates.filter((t) => {
    const matchesCategory = category === "all" || t.filterCategory === category;
    if (!matchesCategory) return false;
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.includes(q))
    );
  });
}
