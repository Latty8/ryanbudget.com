import { setClientDemoMode } from "@/lib/auth/demo-mode";

export type DemoSessionUser = {
  userId: string;
  email: string;
  name: string;
  isDemo?: boolean;
};

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

  await fetch("/api/auth/session", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ onboarded: true }),
  });

  return result.user;
}
