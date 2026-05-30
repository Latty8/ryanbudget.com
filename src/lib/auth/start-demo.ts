import { completeSignInClient } from "@/lib/auth/complete-sign-in-client";
import { setClientDemoMode } from "@/lib/auth/demo-mode";
import type { SessionPayload } from "@/lib/auth/session";
import { useAppDataStore } from "@/store/useAppDataStore";

export type DemoSessionUser = SessionPayload;

/** Creates demo session cookies and marks onboarding complete (for instant app access). */
export async function startDemoSession(): Promise<DemoSessionUser> {
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "demo@paycheckplanner.app",
      password: "demo1234",
      demo: true,
    }),
  });
  const result = (await response.json()) as {
    ok: boolean;
    message?: string;
    user?: DemoSessionUser;
  };
  if (!response.ok || !result.ok || !result.user) {
    throw new Error(result.message ?? "Could not start demo");
  }

  setClientDemoMode(true);
  await completeSignInClient({ ...result.user, isDemo: true });
  useAppDataStore.getState().loadDemoData();

  await fetch("/api/auth/session", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ onboarded: true }),
  });

  return result.user;
}
