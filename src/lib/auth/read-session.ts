import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions, sessionPayloadFromNextAuth } from "@/lib/auth";
import { SESSION_COOKIE, type SessionPayload } from "@/lib/auth/session";

function hasNextAuthSecret(): boolean {
  return Boolean(process.env.NEXTAUTH_SECRET?.trim());
}

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

  if (!hasNextAuthSecret()) {
    return null;
  }

  try {
    const nextAuthSession = await getServerSession(authOptions);
    if (nextAuthSession) {
      return sessionPayloadFromNextAuth(nextAuthSession);
    }
  } catch (error) {
    console.error("[readSession] getServerSession failed:", error);
  }

  return null;
}
