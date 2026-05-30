"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { consumeOAuthReturnPath } from "@/lib/auth/oauth-return-path";
import { getSupabaseBrowserClient, hasSupabaseBrowserEnv, resetSupabaseOAuthState } from "@/lib/supabase/browser";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void (async () => {
      const errorDesc = searchParams.get("error_description") ?? searchParams.get("error");
      if (errorDesc) {
        router.replace(`/login?error=${encodeURIComponent(errorDesc)}`);
        return;
      }

      if (!hasSupabaseBrowserEnv()) {
        router.replace("/login?error=supabase_not_configured");
        return;
      }

      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        router.replace("/login?error=supabase_not_configured");
        return;
      }

      const code = searchParams.get("code");
      if (!code) {
        router.replace("/login?error=missing_oauth_code");
        return;
      }

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        if (error.message.toLowerCase().includes("code challenge")) {
          await resetSupabaseOAuthState(supabase);
          router.replace(
            "/login?error=" +
              encodeURIComponent("Sign-in expired. Clear cookies and try Google again.")
          );
          return;
        }
        router.replace(`/login?error=${encodeURIComponent(error.message)}`);
        return;
      }

      const accessToken = data.session?.access_token;
      if (!accessToken) {
        router.replace("/login?error=no_session");
        return;
      }

      const res = await fetch("/api/auth/oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ access_token: accessToken }),
      });

      const result = (await res.json()) as {
        ok?: boolean;
        message?: string;
        user?: { userId: string; email: string; name: string };
      };

      if (!res.ok || !result.ok || !result.user) {
        router.replace(
          `/login?error=${encodeURIComponent(result.message ?? "Could not create session")}`
        );
        return;
      }

      const next = consumeOAuthReturnPath(searchParams.get("next") ?? "/dashboard");
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
