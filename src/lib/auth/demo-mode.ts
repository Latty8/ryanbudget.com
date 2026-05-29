import { DEMO_MODE_COOKIE, type SessionPayload } from "@/lib/auth/session";

export const DEMO_MODE_STORAGE_KEY = "planner-demo-mode";

export function isDemoUserId(userId: string): boolean {
  return userId.startsWith("demo-");
}

export function isDemoSession(session: SessionPayload | null | undefined): boolean {
  if (!session) return false;
  return session.isDemo === true || isDemoUserId(session.userId);
}

/** Client-side: read demo flag from cookie string or localStorage. */
export function readClientDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem(DEMO_MODE_STORAGE_KEY) === "true") return true;
  return document.cookie.includes(`${DEMO_MODE_COOKIE}=true`);
}

export function setClientDemoMode(active: boolean): void {
  if (typeof window === "undefined") return;
  if (active) {
    localStorage.setItem(DEMO_MODE_STORAGE_KEY, "true");
  } else {
    localStorage.removeItem(DEMO_MODE_STORAGE_KEY);
    localStorage.removeItem("planner-demo-premium");
  }
}
