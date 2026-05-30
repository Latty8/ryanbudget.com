"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type FintechTheme = "dark" | "light";

type FintechThemeContextValue = {
  theme: FintechTheme;
  setTheme: (value: FintechTheme) => void;
};

const FintechThemeContext = createContext<FintechThemeContextValue | null>(null);

export function FintechThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<FintechTheme>("light");

  useEffect(() => {
    const id = window.setTimeout(() => {
      const saved = localStorage.getItem("fintech-theme");
      if (saved === "light" || saved === "dark") {
        setThemeState(saved);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const value = useMemo<FintechThemeContextValue>(
    () => ({
      theme,
      setTheme: (next) => {
        setThemeState(next);
        localStorage.setItem("fintech-theme", next);
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
