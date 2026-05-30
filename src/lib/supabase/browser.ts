"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Browser Supabase client — PKCE verifier stored in cookies via @supabase/ssr. */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  return createBrowserClient(url, key, {
    auth: {
      // We exchange the OAuth code manually on /auth/callback — auto-detect would run twice.
      detectSessionInUrl: false,
      flowType: "pkce",
    },
    cookieOptions: {
      path: "/",
      sameSite: "lax",
      secure: typeof window !== "undefined" && window.location.protocol === "https:",
    },
  });
}

export function hasSupabaseBrowserEnv(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/** Clear stale PKCE/session state from failed or interrupted OAuth attempts. */
export async function resetSupabaseOAuthState(supabase: SupabaseClient): Promise<void> {
  await supabase.auth.signOut({ scope: "local" });

  if (typeof window === "undefined") return;

  for (const key of Object.keys(localStorage)) {
    if (key.startsWith("sb-")) localStorage.removeItem(key);
  }

  for (const part of document.cookie.split(";")) {
    const name = part.split("=")[0]?.trim();
    if (!name?.startsWith("sb-")) continue;
    document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
    if (window.location.protocol === "https:") {
      document.cookie = `${name}=; path=/; max-age=0; samesite=lax; secure`;
    }
  }
}
