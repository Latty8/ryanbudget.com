"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { completeSignInClient } from "@/lib/auth/complete-sign-in-client";
import { useAuth } from "@/components/providers/auth-provider";
import { hasCloudDataSync } from "@/lib/db/client";

/** After NextAuth OAuth redirect, bridge session cookie and hydrate app data. */
export function NextAuthBridge() {
  const { data: session, status } = useSession();
  const { user, setUser } = useAuth();
  const bridged = useRef(false);

  useEffect(() => {
    if (!hasCloudDataSync || status !== "authenticated" || !session?.user?.id || !session.user.email) {
      return;
    }
    if (user?.userId === session.user.id || bridged.current) return;

    void (async () => {
      const res = await fetch("/api/auth/bridge", { method: "POST", credentials: "include" });
      if (!res.ok) return;
      const body = (await res.json()) as {
        user?: { userId: string; email: string; name: string };
      };
      if (!body.user) return;

      bridged.current = true;
      setUser(body.user);
      await completeSignInClient(body.user);
    })();
  }, [session, status, user?.userId, setUser]);

  return null;
}
