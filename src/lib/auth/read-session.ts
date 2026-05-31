import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions, sessionPayloadFromNextAuth } from "@/lib/auth";
import { SESSION_COOKIE, type SessionPayload } from "@/lib/auth/session";

export async function readSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (raw) {
    try {
      return JSON.parse(decodeURIComponent(raw)) as SessionPayload;
    } catch {
      /* fall through to NextAuth */
    }
  }

  const nextAuthSession = await getServerSession(authOptions);
  if (nextAuthSession) {
    return sessionPayloadFromNextAuth(nextAuthSession);
  }

  return null;
}
