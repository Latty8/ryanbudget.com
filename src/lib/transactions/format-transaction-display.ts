import type { CurrencyCode } from "@/types/app-settings";
import { convertAmount } from "@/lib/currency/exchange-rates";
import {
  formatSignedAmountPrefix,
  formatSignedTransactionAmount,
  transactionAmountClassName,
} from "@/lib/transactions/transaction-amount";

function formatCurrency(magnitude: number, currency: CurrencyCode): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(magnitude);
}

/** Display a signed transaction amount with +/− prefix in primary currency. */
export function formatTransactionAmountDisplay(
  amount: number,
  currency: CurrencyCode = "USD"
): string {
  return formatSignedTransactionAmount(amount, (m) => formatCurrency(m, currency));
}

/**
 * Signed amount in primary currency, with native currency in parentheses when different.
 */
export function formatTransactionAmountWithSource(
  amount: number,
  primary: CurrencyCode,
  source?: CurrencyCode
): string {
  const from = source ?? primary;
  const magnitude = Math.abs(amount);
  const prefix = formatSignedAmountPrefix(amount);
  const main = formatCurrency(convertAmount(magnitude, from, primary), primary);

  if (from === primary) {
    return prefix ? `${prefix}${main}` : main;
  }

  const native = formatCurrency(magnitude, from);
  return prefix ? `${prefix}${main} (${native})` : `${main} (${native})`;
}

export { transactionAmountClassName };
