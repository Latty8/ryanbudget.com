import type { CurrencyCode } from "@/types/app-settings";
import { convertAmount, formatConvertedHint } from "@/lib/currency/exchange-rates";

export function formatInPrimaryCurrency(
  amount: number,
  primary: CurrencyCode,
  source?: CurrencyCode
): { primary: string; hint: string | null } {
  const from = source ?? primary;
  const value = convertAmount(amount, from, primary);
  const primaryFormatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: primary,
  }).format(value);
  const hint = formatConvertedHint(amount, from, primary);
  return { primary: primaryFormatted, hint: from !== primary ? hint : null };
}
