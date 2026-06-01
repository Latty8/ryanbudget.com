"use client";

import { Moon, Sun } from "lucide-react";
import { useFintechTheme } from "@/components/fintech/theme";
import { fintechIconButton } from "@/components/fintech/ui";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  showLabel?: boolean;
};

export function ThemeToggle({ className, showLabel }: Props) {
  const { theme, setTheme, isLight } = useFintechTheme();

  const next = isLight ? "dark" : "light";
  const label = isLight ? "Switch to dark mode" : "Switch to light mode";

  return (
    <button
      type="button"
      className={cn(fintechIconButton, showLabel && "min-w-0 gap-2 px-3", className)}
      onClick={() => setTheme(next)}
      aria-label={label}
      title={label}
    >
      {theme === "light" ? (
        <Moon className="h-4 w-4" strokeWidth={1.75} />
      ) : (
        <Sun className="h-4 w-4" strokeWidth={1.75} />
      )}
      {showLabel ? (
        <span className="hidden text-xs font-medium sm:inline">{isLight ? "Dark" : "Light"}</span>
      ) : null}
    </button>
  );
}
