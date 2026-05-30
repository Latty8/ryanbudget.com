"use client";

import { useEffect, useRef } from "react";
import { completeSignInClient } from "@/lib/auth/complete-sign-in-client";
import { useAuth } from "@/components/providers/auth-provider";

/** Keeps Zustand data scoped to the signed-in user after Google OAuth or refresh. */
export function AuthDataSync() {
  const { user } = useAuth();
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.userId || user.userId === lastUserId.current) return;
    lastUserId.current = user.userId;
    void completeSignInClient(user);
  }, [user]);

  return null;
}
