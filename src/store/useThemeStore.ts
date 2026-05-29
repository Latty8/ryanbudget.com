"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Appearance = "light" | "dark" | "system";

export const DEFAULT_ACCENT_HEX = "#0071e3";

interface ThemeState {
  appearance: Appearance;
  accentHex: string;
  setAppearance: (appearance: Appearance) => void;
  setAccentHex: (accentHex: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      appearance: "system",
      accentHex: DEFAULT_ACCENT_HEX,
      setAppearance: (appearance) => set({ appearance }),
      setAccentHex: (accentHex) => set({ accentHex }),
    }),
    {
      name: "ryanbudget-appearance",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);

export function resolveAppearanceMode(
  appearance: Appearance
): "light" | "dark" {
  if (appearance === "system") {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return appearance;
}
