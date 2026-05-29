import type { AppLocale } from "@/types/app-settings";
import { en, type Messages } from "@/i18n/messages/en";
import { es } from "@/i18n/messages/es";

const catalogs: Record<AppLocale, Messages> = { en, es };

export function getMessages(locale: AppLocale): Messages {
  return catalogs[locale] ?? en;
}

export type TranslationKey =
  | `common.${keyof Messages["common"]}`
  | `onboarding.${keyof Messages["onboarding"]}`
  | `settings.${keyof Messages["settings"]}`
  | `household.${keyof Messages["household"]}`
  | `transactions.${keyof Messages["transactions"]}`;

export function translate(locale: AppLocale, key: TranslationKey): string {
  const [ns, k] = key.split(".") as [keyof Messages, string];
  const table = catalogs[locale][ns] as Record<string, string>;
  return table[k] ?? (en[ns] as Record<string, string>)[k] ?? key;
}
