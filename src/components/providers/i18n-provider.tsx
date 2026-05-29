"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { getMessages, translate, type TranslationKey } from "@/i18n";
import { useAppDataStore } from "@/store/useAppDataStore";
import type { AppLocale } from "@/types/app-settings";

type I18nContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (key: TranslationKey) => string;
  messages: ReturnType<typeof getMessages>;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useAppDataStore((s) => s.preferences.locale ?? "en");
  const setPreferences = useAppDataStore((s) => s.setPreferences);

  const setLocale = useCallback(
    (next: AppLocale) => {
      setPreferences({ locale: next });
    },
    [setPreferences]
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const messages = useMemo(() => getMessages(locale), [locale]);

  const t = useCallback((key: TranslationKey) => translate(locale, key), [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, t, messages }),
    [locale, setLocale, t, messages]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslations() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslations must be used within I18nProvider");
  return ctx;
}
