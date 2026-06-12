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

function writeDemoModeCookie(active: boolean): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  if (active) {
    const maxAge = 60 * 60 * 24 * 30;
    document.cookie = `${DEMO_MODE_COOKIE}=true; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
  } else {
    document.cookie = `${DEMO_MODE_COOKIE}=; path=/; max-age=0; SameSite=Lax${secure}`;
  }
}

export function setClientDemoMode(active: boolean): void {
  if (typeof window === "undefined") return;
  if (active) {
    localStorage.setItem(DEMO_MODE_STORAGE_KEY, "true");
    writeDemoModeCookie(true);
  } else {
    localStorage.removeItem(DEMO_MODE_STORAGE_KEY);
    localStorage.removeItem("planner-demo-premium");
    writeDemoModeCookie(false);
  }
}

/** Demo is active only when the session is demo or no real user is signed in yet. */
export function resolveClientDemoMode(user: SessionPayload | null | undefined): boolean {
  if (user && !isDemoSession(user)) return false;
  return readClientDemoMode() || isDemoSession(user);
}
