import type { AppCategory } from "@/types/app-settings";
import type { TransactionInput } from "@/types/finance";

const PAYCHECK_PATTERN = /paycheck|payroll|salary|wage|direct deposit|pay day|pay period/i;

function categoryName(input: TransactionInput, categories: AppCategory[]): string {
  const cat = categories.find((c) => c.id === input.categoryId || c.name === input.categoryId);
  return cat?.name ?? String(input.categoryId ?? "");
}

export function isPaycheckIncome(input: TransactionInput, categories: AppCategory[]): boolean {
  const name = categoryName(input, categories).toLowerCase();
  if (name === "income" || name === "paycheck") return true;
  const desc = (input.description ?? "").trim();
  return PAYCHECK_PATTERN.test(desc);
}

export function isRecurringPaycheckRule(rule: {
  name: string;
  amount: number;
  cadence?: string;
  paused?: boolean;
}): boolean {
  if (rule.paused) return false;
  if (rule.amount <= 0) return false;
  return PAYCHECK_PATTERN.test(rule.name);
}
