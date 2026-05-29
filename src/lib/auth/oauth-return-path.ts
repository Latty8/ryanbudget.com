const OAUTH_NEXT_KEY = "planner-oauth-next";

export function setOAuthReturnPath(path: string) {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(OAUTH_NEXT_KEY, path);
  }
}

export function consumeOAuthReturnPath(fallback = "/dashboard"): string {
  if (typeof window === "undefined") return fallback;
  const next = sessionStorage.getItem(OAUTH_NEXT_KEY) ?? fallback;
  sessionStorage.removeItem(OAUTH_NEXT_KEY);
  return next;
}
