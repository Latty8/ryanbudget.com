"use client";

import { useDemoModeContext } from "@/components/providers/demo-mode-provider";

/** Demo mode state and actions (requires DemoModeProvider in the tree). */
export function useDemoMode() {
  return useDemoModeContext();
}
