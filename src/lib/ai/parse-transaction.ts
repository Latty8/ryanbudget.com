import {
  addDays,
  format,
  nextFriday,
  nextMonday,
  parse,
  parseISO,
  isValid,
  previousFriday,
  subDays,
} from "date-fns";

export type ParsedTransactionDraft = {
  amount: number;
  description: string;
  category: string;
  date: string;
  notes?: string;
  type?: "expense" | "income";
  recurring?: boolean;
  recurringFrequency?: "weekly" | "bi-weekly" | "monthly" | "yearly";
  confidence: number;
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Dining: ["starbucks", "coffee", "restaurant", "dining", "uber eats", "doordash", "lunch", "dinner"],
  Groceries: ["grocery", "groceries", "trader", "costco", "walmart", "target", "aldi"],
  Transportation: ["uber", "lyft", "gas", "shell", "chevron", "parking", "transit"],
  Housing: ["rent", "mortgage", "hoa", "landlord"],
  Entertainment: ["netflix", "spotify", "movie", "concert", "game"],
  Personal: ["amazon", "shopping", "clothing"],
  Paycheck: ["paycheck", "payroll", "salary", "wage", "direct deposit"],
  Income: ["deposit", "income", "bonus", "refund"],
  Utilities: ["electric", "water", "internet", "phone bill"],
  Health: ["pharmacy", "cvs", "doctor", "medical"],
};

const AMOUNT_PATTERN = /\$?\s*(\d+(?:\.\d{1,2})?)/;
const ON_DAY_PATTERN = /\bon\s+(\w+day|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|\d{4}-\d{2}-\d{2})/i;
const LAST_DAY_PATTERN = /\blast\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i;
const AS_CATEGORY_PATTERN = /\bas\s+([a-z\s]+?)(?:\s+on|\s*$)/i;
const AT_MERCHANT_PATTERN = /\bat\s+([A-Za-z0-9][\w\s&'.-]{1,40})/i;

function parseRelativeDate(token: string, base = new Date()): string | null {
  const lower = token.toLowerCase();
  if (lower === "today") return format(base, "yyyy-MM-dd");
  if (lower === "tomorrow") return format(addDays(base, 1), "yyyy-MM-dd");
  if (lower === "yesterday") return format(subDays(base, 1), "yyyy-MM-dd");
  if (lower === "friday" || lower === "next friday") return format(nextFriday(base), "yyyy-MM-dd");
  if (lower === "monday" || lower === "next monday") return format(nextMonday(base), "yyyy-MM-dd");
  const slash = parse(token, "M/d/yyyy", base);
  if (isValid(slash)) return format(slash, "yyyy-MM-dd");
  const iso = parseISO(token);
  if (isValid(iso)) return format(iso, "yyyy-MM-dd");
  return null;
}

function parseLastWeekday(text: string, base: Date): string | null {
  const match = text.match(LAST_DAY_PATTERN);
  if (!match?.[1]) return null;
  const day = match[1].toLowerCase();
  if (day === "friday") return format(previousFriday(base), "yyyy-MM-dd");
  return null;
}

function inferCategory(text: string): { category: string; confidence: number } {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return { category, confidence: 0.85 };
    }
  }
  const asMatch = lower.match(AS_CATEGORY_PATTERN);
  if (asMatch?.[1]) {
    const raw = asMatch[1].trim();
    const hit = Object.keys(CATEGORY_KEYWORDS).find((c) => c.toLowerCase() === raw);
    if (hit) return { category: hit, confidence: 0.9 };
    return { category: raw.charAt(0).toUpperCase() + raw.slice(1), confidence: 0.7 };
  }
  return { category: "Personal", confidence: 0.4 };
}

function inferDescription(text: string, amount: number): string {
  const atMatch = text.match(AT_MERCHANT_PATTERN);
  if (atMatch?.[1]) {
    return atMatch[1].trim().replace(/\s+/g, " ");
  }
  let desc = text
    .replace(AMOUNT_PATTERN, "")
    .replace(/\badd\b/i, "")
    .replace(AS_CATEGORY_PATTERN, "")
    .replace(ON_DAY_PATTERN, "")
    .replace(LAST_DAY_PATTERN, "")
    .replace(/\bbi-?weekly\b/i, "")
    .replace(/\bpaycheck\b/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!desc) desc = `Expense $${amount}`;
  return desc.charAt(0).toUpperCase() + desc.slice(1);
}

function inferRecurring(text: string): {
  recurring?: boolean;
  recurringFrequency?: ParsedTransactionDraft["recurringFrequency"];
} {
  const lower = text.toLowerCase();
  if (/\bbi-?weekly\b/.test(lower) && /\bpay(check|roll)\b/.test(lower)) {
    return { recurring: true, recurringFrequency: "bi-weekly" };
  }
  if (/\bmonthly\b/.test(lower)) return { recurring: true, recurringFrequency: "monthly" };
  if (/\bweekly\b/.test(lower)) return { recurring: true, recurringFrequency: "weekly" };
  return {};
}

/**
 * Rule-based natural language transaction parser (no external API).
 */
export function parseNaturalLanguageTransaction(
  input: string,
  baseDate = new Date()
): ParsedTransactionDraft | null {
  const text = input.trim();
  if (text.length < 3) return null;

  const amountMatch = text.match(AMOUNT_PATTERN);
  if (!amountMatch) return null;

  const amount = Number.parseFloat(amountMatch[1]);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const { category, confidence } = inferCategory(text);
  const isIncome =
    category === "Income" ||
    category === "Paycheck" ||
    /\bpay(check|roll| period)\b/i.test(text) ||
    /\b(salary|refund|deposit)\b/i.test(text);

  let date = format(baseDate, "yyyy-MM-dd");
  const onMatch = text.match(ON_DAY_PATTERN);
  if (onMatch?.[1]) {
    const parsed = parseRelativeDate(onMatch[1], baseDate);
    if (parsed) date = parsed;
  }
  const lastDay = parseLastWeekday(text, baseDate);
  if (lastDay) date = lastDay;

  const recurringMeta = inferRecurring(text);

  return {
    amount,
    description: inferDescription(text, amount),
    category,
    date,
    type: isIncome ? "income" : "expense",
    confidence,
    ...recurringMeta,
  };
}
