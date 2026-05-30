export const OAUTH_NEXT_COOKIE = "planner-oauth-next";

export function setOAuthReturnPath(path: string) {
  if (typeof window === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${OAUTH_NEXT_COOKIE}=${encodeURIComponent(path)}; path=/; max-age=600; samesite=lax${secure}`;
}

export function readOAuthReturnPath(
  cookieValue: string | undefined,
  fallback = "/dashboard"
): string {
  if (!cookieValue) return fallback;
  try {
    const path = decodeURIComponent(cookieValue);
    return path.startsWith("/") ? path : fallback;
  } catch {
    return fallback;
  }
}

export function consumeOAuthReturnPath(fallback = "/dashboard"): string {
  if (typeof document === "undefined") return fallback;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${OAUTH_NEXT_COOKIE}=([^;]+)`)
  );
  const next = readOAuthReturnPath(match?.[1], fallback);
  document.cookie = `${OAUTH_NEXT_COOKIE}=; path=/; max-age=0; samesite=lax`;
  return next;
}
