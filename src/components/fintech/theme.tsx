"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";

type FintechTheme = "dark" | "light";

type FintechThemeContextValue = {
  theme: FintechTheme;
  setTheme: (value: FintechTheme) => void;
  isLight: boolean;
};

const FintechThemeContext = createContext<FintechThemeContextValue | null>(null);

function readStoredTheme(): FintechTheme {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem("fintech-theme");
  return saved === "dark" ? "dark" : "light";
}

function applyThemeToDocument(theme: FintechTheme) {
  document.documentElement.dataset.theme = theme;
}

export function FintechThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<FintechTheme>("light");
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const stored = readStoredTheme();
    setThemeState(stored);
    applyThemeToDocument(stored);
    setReady(true);
  }, []);

  useLayoutEffect(() => {
    if (!ready) return;
    applyThemeToDocument(theme);
  }, [theme, ready]);

  const value = useMemo<FintechThemeContextValue>(
    () => ({
      theme,
      isLight: theme === "light",
      setTheme: (next) => {
        setThemeState(next);
        localStorage.setItem("fintech-theme", next);
        applyThemeToDocument(next);
      },
    }),
    [theme]
  );

  return <FintechThemeContext.Provider value={value}>{children}</FintechThemeContext.Provider>;
}

export function useFintechTheme() {
  const context = useContext(FintechThemeContext);
  if (!context) throw new Error("useFintechTheme must be used within FintechThemeProvider");
  return context;
}

/** @deprecated use useFintechTheme().isLight */
export function useShellTheme() {
  const { isLight } = useFintechTheme();
  return { isLight };
}
