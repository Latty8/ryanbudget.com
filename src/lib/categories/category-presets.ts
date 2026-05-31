import type { AppCategory, CategoryBudgetBehavior } from "@/types/app-settings";
import { ENTITY_COLOR_SWATCHES } from "@/lib/fintech/color-swatches";

/** Legacy groups kept for existing data; new groups are more descriptive. */
export const LEGACY_CATEGORY_GROUPS = ["Income", "Needs", "Wants", "Goals", "Custom"] as const;

export const CATEGORY_GROUPS = [
  "Income",
  "Housing",
  "Utilities",
  "Food",
  "Transportation",
  "Subscriptions",
  "Entertainment",
  "Shopping",
  "Personal",
  "Health",
  "Pets",
  "Savings",
  "Travel",
  "Debt",
  "Miscellaneous",
  ...LEGACY_CATEGORY_GROUPS.filter((g) => g !== "Income"),
] as const;

export type CategoryGroup = (typeof CATEGORY_GROUPS)[number];

export const BUDGET_BEHAVIOR_OPTIONS: {
  value: CategoryBudgetBehavior;
  label: string;
  hint: string;
}[] = [
  { value: "fixed", label: "Fixed", hint: "Same amount each period" },
  { value: "flexible", label: "Flexible", hint: "Adjust as needed" },
  { value: "percentage", label: "Percentage", hint: "Share of income" },
  { value: "rollover", label: "Rollover", hint: "Unused rolls forward" },
];

export type CategoryPreset = Omit<AppCategory, "id"> & {
  presetId: string;
};

/** Curated presets for the add-category panel — Income + common expenses. */
export const CATEGORY_PRESETS: CategoryPreset[] = [
  // Income
  { presetId: "paycheck", name: "Paycheck", group: "Income", icon: "Wallet", color: "#22c55e", budgeted: 0, budgetBehavior: "fixed" },
  { presetId: "bonus", name: "Bonus", group: "Income", icon: "Sparkles", color: "#34d399", budgeted: 0, budgetBehavior: "fixed" },
  { presetId: "refund", name: "Refund", group: "Income", icon: "Repeat", color: "#2dd4bf", budgeted: 0, budgetBehavior: "fixed" },
  { presetId: "side-income", name: "Side Income", group: "Income", icon: "CircleDollarSign", color: "#14b8a6", budgeted: 0, budgetBehavior: "flexible" },
  { presetId: "other-income", name: "Other Income", group: "Income", icon: "CircleDollarSign", color: "#10b981", budgeted: 0, budgetBehavior: "flexible" },
  // Expenses
  { presetId: "rent", name: "Rent", group: "Housing", icon: "Home", color: "#38bdf8", budgeted: 1200, budgetBehavior: "fixed" },
  { presetId: "utilities", name: "Utilities", group: "Utilities", icon: "Zap", color: "#60a5fa", budgeted: 150, budgetBehavior: "fixed" },
  { presetId: "electric", name: "Electric", group: "Utilities", icon: "Zap", color: "#fbbf24", budgeted: 80, budgetBehavior: "fixed" },
  { presetId: "water", name: "Water / Sewer", group: "Utilities", icon: "Droplets", color: "#38bdf8", budgeted: 45, budgetBehavior: "fixed" },
  { presetId: "internet", name: "Internet", group: "Utilities", icon: "Wifi", color: "#818cf8", budgeted: 70, budgetBehavior: "fixed" },
  { presetId: "phone", name: "Phone", group: "Utilities", icon: "Smartphone", color: "#a78bfa", budgeted: 60, budgetBehavior: "fixed" },
  { presetId: "groceries", name: "Groceries", group: "Food", icon: "ShoppingCart", color: "#34d399", budgeted: 400, budgetBehavior: "flexible" },
  { presetId: "restaurants", name: "Restaurants", group: "Food", icon: "Utensils", color: "#fb7185", budgeted: 120, budgetBehavior: "flexible" },
  { presetId: "gas", name: "Gas", group: "Transportation", icon: "Fuel", color: "#f97316", budgeted: 120, budgetBehavior: "flexible" },
  { presetId: "car-payment", name: "Car Payment", group: "Transportation", icon: "Car", color: "#fbbf24", budgeted: 350, budgetBehavior: "fixed" },
  { presetId: "insurance", name: "Insurance", group: "Transportation", icon: "Shield", color: "#22c55e", budgeted: 110, budgetBehavior: "fixed" },
  { presetId: "subscriptions", name: "Subscriptions", group: "Subscriptions", icon: "Repeat", color: "#c084fc", budgeted: 50, budgetBehavior: "fixed" },
  { presetId: "entertainment", name: "Entertainment", group: "Entertainment", icon: "Tv", color: "#f472b6", budgeted: 80, budgetBehavior: "flexible" },
  { presetId: "shopping", name: "Shopping", group: "Shopping", icon: "ShoppingBag", color: "#fb923c", budgeted: 100, budgetBehavior: "flexible" },
  { presetId: "pets", name: "Pets", group: "Pets", icon: "PawPrint", color: "#fdba74", budgeted: 50, budgetBehavior: "flexible" },
  { presetId: "health", name: "Health", group: "Health", icon: "Heart", color: "#f87171", budgeted: 60, budgetBehavior: "flexible" },
  { presetId: "savings", name: "Savings", group: "Savings", icon: "PiggyBank", color: "#22c55e", budgeted: 200, budgetBehavior: "percentage" },
  { presetId: "emergency", name: "Emergency Fund", group: "Savings", icon: "ShieldCheck", color: "#10b981", budgeted: 150, budgetBehavior: "rollover" },
  { presetId: "travel", name: "Travel", group: "Travel", icon: "Plane", color: "#38bdf8", budgeted: 100, budgetBehavior: "flexible" },
  { presetId: "debt-payment", name: "Debt Payment", group: "Debt", icon: "Landmark", color: "#64748b", budgeted: 200, budgetBehavior: "fixed" },
  { presetId: "misc", name: "Miscellaneous", group: "Miscellaneous", icon: "Sparkles", color: "#94a3b8", budgeted: 50, budgetBehavior: "flexible" },
];

export const CATEGORY_COLOR_OPTIONS = [...ENTITY_COLOR_SWATCHES];

export const CATEGORY_ICON_NAMES = [
  "Home",
  "Building2",
  "Zap",
  "Droplets",
  "Wifi",
  "Smartphone",
  "ShoppingCart",
  "Utensils",
  "Coffee",
  "Car",
  "Fuel",
  "Bus",
  "Shield",
  "Wrench",
  "Repeat",
  "Tv",
  "Gamepad2",
  "ShoppingBag",
  "User",
  "Heart",
  "Dumbbell",
  "PawPrint",
  "PiggyBank",
  "ShieldCheck",
  "Plane",
  "Landmark",
  "CreditCard",
  "GraduationCap",
  "CircleDollarSign",
  "Sparkles",
  "Wallet",
  "Music",
] as const;

export function categoryGroupsForSelect(existingGroups: string[] = []) {
  const merged = new Set<string>([...CATEGORY_GROUPS, ...existingGroups]);
  return [...merged].sort((a, b) => {
    const ai = CATEGORY_GROUPS.indexOf(a as CategoryGroup);
    const bi = CATEGORY_GROUPS.indexOf(b as CategoryGroup);
    if (ai >= 0 && bi >= 0) return ai - bi;
    if (ai >= 0) return -1;
    if (bi >= 0) return 1;
    return a.localeCompare(b);
  });
}

export function presetToCategory(preset: CategoryPreset): Omit<AppCategory, "id"> {
  const { presetId: _id, ...category } = preset;
  return category;
}

export function findPresetByName(name: string) {
  return CATEGORY_PRESETS.find((p) => p.name.toLowerCase() === name.toLowerCase());
}

/** Lookup preset by id or legacy names (budget modal quick picks). */
export function findPresetByIdOrName(idOrName: string) {
  return (
    CATEGORY_PRESETS.find((p) => p.presetId === idOrName) ??
    findPresetByName(idOrName)
  );
}
