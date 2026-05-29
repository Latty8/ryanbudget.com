"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { consumeOAuthReturnPath } from "@/lib/auth/oauth-return-path";
import { getSupabaseBrowserClient, hasSupabaseBrowserEnv } from "@/lib/supabase/browser";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void (async () => {
      const next = consumeOAuthReturnPath(searchParams.get("next") ?? "/dashboard");

      const errorDesc = searchParams.get("error_description") ?? searchParams.get("error");
      if (errorDesc) {
        router.replace(`/login?error=${encodeURIComponent(errorDesc)}`);
        return;
      }

      if (!hasSupabaseBrowserEnv()) {
        router.replace("/login?error=supabase_not_configured");
        return;
      }

      const supabase = getSupabaseBrowserClient(true);
      if (!supabase) {
        router.replace("/login?error=supabase_not_configured");
        return;
      }

      const code = searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          router.replace(`/login?error=${encodeURIComponent(error.message)}`);
          return;
        }
      } else if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
        const { error } = await supabase.auth.getSession();
        if (error) {
          router.replace(`/login?error=${encodeURIComponent(error.message)}`);
          return;
        }
      } else {
        router.replace(
          "/login?error=" +
            encodeURIComponent(
              "No sign-in code returned. Add https://ryanbudget.me/auth/callback to Supabase Redirect URLs (exact path, no extra query)."
            )
        );
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user?.email) {
        router.replace(`/login?error=${encodeURIComponent(userError?.message ?? "no_user")}`);
        return;
      }

      const res = await fetch("/api/auth/oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          name:
            (user.user_metadata?.full_name as string | undefined) ??
            (user.user_metadata?.name as string | undefined) ??
            user.email.split("@")[0],
        }),
      });

      const result = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !result.ok) {
        router.replace(
          `/login?error=${encodeURIComponent(result.message ?? "Could not create session")}`
        );
        return;
      }

      const onboarded = document.cookie.includes("planner-onboarded=true");
      router.replace(onboarded ? next : "/onboarding");
    })();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b1220] text-slate-300">
      <Loader2 className="h-8 w-8 animate-spin text-sky-400" aria-hidden />
      <span className="sr-only">Completing sign-in</span>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0b1220]">
          <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
