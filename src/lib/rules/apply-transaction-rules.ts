import type { TransactionRule } from "@/types/transaction-rules";
import type { TransactionInput } from "@/types/finance";

function descriptionOf(input: TransactionInput): string {
  return (input.description ?? "").toLowerCase();
}

export function applyTransactionRules(
  input: TransactionInput,
  rules: TransactionRule[]
): { input: TransactionInput; matchedRule?: TransactionRule } {
  const desc = descriptionOf(input);
  if (!desc) return { input };

  const active = [...rules]
    .filter((r) => r.enabled && r.merchantContains.length > 0 && r.categoryName)
    .sort((a, b) => a.priority - b.priority);

  for (const rule of active) {
    const hit = rule.merchantContains.some((term) => desc.includes(term.toLowerCase().trim()));
    if (!hit) continue;
    return {
      input: { ...input, categoryId: rule.categoryName },
      matchedRule: rule,
    };
  }

  return { input };
}

export function suggestCategoryFromRules(
  merchant: string,
  rules: TransactionRule[]
): string | undefined {
  const desc = merchant.toLowerCase();
  const active = [...rules].filter((r) => r.enabled).sort((a, b) => a.priority - b.priority);
  for (const rule of active) {
    if (rule.merchantContains.some((t) => desc.includes(t.toLowerCase().trim()))) {
      return rule.categoryName;
    }
  }
  return undefined;
}
