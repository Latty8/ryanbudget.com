import { SESSION_COOKIE, type SessionPayload } from "@/lib/auth/session";

export function readSessionFromRequest(request: Request): SessionPayload | null {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1])) as SessionPayload;
  } catch {
    return null;
  }
}
