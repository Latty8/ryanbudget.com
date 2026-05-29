import type { CurrencyCode } from "@/types/app-settings";

/** Static daily-style rates vs USD (placeholder — swap for live API later). */
export const USD_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  CAD: 1.36,
  EUR: 0.92,
  GBP: 0.79,
};

export const CURRENCY_OPTIONS: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "CAD", label: "Canadian Dollar", symbol: "CA$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "British Pound", symbol: "£" },
];

export function convertAmount(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): number {
  if (from === to) return amount;
  const inUsd = amount / USD_RATES[from];
  return inUsd * USD_RATES[to];
}

export function formatConvertedHint(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): string | null {
  if (from === to) return null;
  const converted = convertAmount(amount, from, to);
  return `≈ ${converted.toLocaleString(undefined, { style: "currency", currency: to })}`;
}
