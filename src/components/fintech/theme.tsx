"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";

export type FintechTheme = "light" | "dark" | "system";

type ResolvedTheme = "light" | "dark";

type FintechThemeContextValue = {
  theme: FintechTheme;
  resolvedTheme: ResolvedTheme;
  setTheme: (value: FintechTheme) => void;
  isLight: boolean;
};

const FintechThemeContext = createContext<FintechThemeContextValue | null>(null);

function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function readStoredTheme(): FintechTheme {
  if (typeof window === "undefined") return "system";
  const saved = localStorage.getItem("fintech-theme");
  if (saved === "dark" || saved === "light" || saved === "system") return saved;
  return "light";
}

function resolveTheme(theme: FintechTheme): ResolvedTheme {
  if (theme === "system") return systemPrefersDark() ? "dark" : "light";
  return theme;
}

function applyThemeToDocument(resolved: ResolvedTheme) {
  document.documentElement.dataset.theme = resolved;
}

export function FintechThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<FintechTheme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const stored = readStoredTheme();
    setThemeState(stored);
    const resolved = resolveTheme(stored);
    setResolvedTheme(resolved);
    applyThemeToDocument(resolved);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const resolved = resolveTheme("system");
      setResolvedTheme(resolved);
      applyThemeToDocument(resolved);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme, ready]);

  useLayoutEffect(() => {
    if (!ready) return;
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
    applyThemeToDocument(resolved);
  }, [theme, ready]);

  const value = useMemo<FintechThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      isLight: resolvedTheme === "light",
      setTheme: (next) => {
        setThemeState(next);
        localStorage.setItem("fintech-theme", next);
        const resolved = resolveTheme(next);
        setResolvedTheme(resolved);
        applyThemeToDocument(resolved);
      },
    }),
    [theme, resolvedTheme]
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
