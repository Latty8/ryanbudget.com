"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/providers/auth-provider";
import {
  isDemoSession,
  resolveClientDemoMode,
  setClientDemoMode,
} from "@/lib/auth/demo-mode";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";

type DemoModeContextValue = {
  demoMode: boolean;
  enableDemoMode: () => void;
  exitDemoMode: () => void;
};

const DemoModeContext = createContext<DemoModeContextValue | null>(null);

function ensureDemoPremium() {
  const { tier, status } = useSubscriptionStore.getState();
  if (tier !== "premium" || status !== "active") {
    useSubscriptionStore.getState().setPremium(true);
  }
}

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [demoMode, setDemoMode] = useState(false);

  const sync = useCallback(() => {
    if (user && !isDemoSession(user)) {
      setClientDemoMode(false);
    }
    const active = resolveClientDemoMode(user);
    setDemoMode(active);
    if (active) ensureDemoPremium();
  }, [user]);

  useEffect(() => {
    sync();
    window.addEventListener("planner:demo-mode", sync);
    return () => window.removeEventListener("planner:demo-mode", sync);
  }, [sync]);

  const enableDemoMode = useCallback(() => {
    setClientDemoMode(true);
    ensureDemoPremium();
    setDemoMode(true);
    window.dispatchEvent(new CustomEvent("planner:demo-mode"));
  }, []);

  const exitDemoMode = useCallback(() => {
    setClientDemoMode(false);
    setDemoMode(false);
    void useSubscriptionStore.getState().syncFromServer();
    window.dispatchEvent(new CustomEvent("planner:demo-mode"));
  }, []);

  const value = useMemo(
    () => ({ demoMode, enableDemoMode, exitDemoMode }),
    [demoMode, enableDemoMode, exitDemoMode]
  );

  return <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>;
}

export function useDemoModeContext() {
  const context = useContext(DemoModeContext);
  if (!context) {
    throw new Error("useDemoMode must be used within DemoModeProvider");
  }
  return context;
}
