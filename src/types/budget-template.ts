import type { AccountKind, RecurringFrequency } from "@/types/finance";

export type TemplateFilterCategory =
  | "all"
  | "popular"
  | "bi-weekly"
  | "monthly"
  | "debt"
  | "savings"
  | "household"
  | "starter";

export type PublicBudgetTemplate = {
  id: string;
  slug: string;
  name: string;
  description: string;
  author: string;
  tags: string[];
  popularity: number;
  payCadence: "bi-weekly" | "weekly" | "monthly";
  filterCategory: Exclude<TemplateFilterCategory, "all">;
  categories: Array<{
    name: string;
    group: string;
    icon: string;
    color: string;
    budgeted: number;
  }>;
  accounts: Array<{
    name: string;
    kind: AccountKind;
  }>;
  recurring: Array<{
    name: string;
    amount: number;
    cadence: RecurringFrequency;
  }>;
  goals?: Array<{
    name: string;
    target: number;
    icon?: string;
    color?: string;
  }>;
};
