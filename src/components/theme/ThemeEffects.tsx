"use client";

import { useEffect } from "react";
import {
  DEFAULT_ACCENT_HEX,
  resolveAppearanceMode,
  useThemeStore,
} from "@/store/useThemeStore";

/** Applies persisted appearance + accent to the document; listens for OS theme when mode is system. */
export function ThemeEffects() {
  const appearance = useThemeStore((s) => s.appearance);
  const accentHex = useThemeStore((s) => s.accentHex);

  useEffect(() => {
    const hex = accentHex?.trim() || DEFAULT_ACCENT_HEX;
    document.documentElement.style.setProperty("--accent-custom", hex);
    document.documentElement.dataset.theme = resolveAppearanceMode(appearance);
  }, [appearance, accentHex]);

  useEffect(() => {
    if (appearance !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      document.documentElement.dataset.theme = mq.matches ? "dark" : "light";
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [appearance]);

  return null;
}
