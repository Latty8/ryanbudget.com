"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  AuthField,
  AuthInput,
  AuthShell,
  AuthSubmitButton,
} from "@/components/auth/auth-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { completeSignInClient, resetSignInDedupe } from "@/lib/auth/complete-sign-in-client";
import { resolvePostLoginPath } from "@/lib/auth/resolve-post-login-path";
import { setClientDemoMode } from "@/lib/auth/demo-mode";
import { startDemoSession } from "@/lib/auth/start-demo";
import { jsonResponseError, parseJsonResponse } from "@/lib/http/parse-json-response";
import { useAppDataStore } from "@/store/useAppDataStore";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";

export function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const setProfile = useAppDataStore((s) => s.setProfile);
  const loadDemoData = useAppDataStore((s) => s.loadDemoData);
  const setPremium = useSubscriptionStore((s) => s.setPremium);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const nextPath = searchParams.get("next") ?? "/dashboard";
  const wantsDemo = searchParams.get("demo") === "1" || searchParams.get("demo") === "true";
  const autoDemoStarted = useRef(false);

  const finishSignIn = async (user: { userId: string; email: string; name: string; isDemo?: boolean }) => {
    resetSignInDedupe();
    setUser(user);
    setProfile({ email: user.email, name: user.name });
    await completeSignInClient(user);
    const destination = await resolvePostLoginPath(nextPath);
    router.push(destination);
  };

  const signIn = async () => {
    if (!email.trim() || !password) {
      toast.error("Enter your email and password");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await parseJsonResponse<{
        ok: boolean;
        message?: string;
        user?: { userId: string; email: string; name: string; isDemo?: boolean };
      }>(response);
      if (!result) {
        throw new Error(jsonResponseError(response, "Sign in failed"));
      }
      if (!response.ok || !result.ok || !result.user) {
        throw new Error(result.message ?? jsonResponseError(response, "Sign in failed"));
      }
      await finishSignIn(result.user);
      toast.success("Welcome back");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  };

  const enterDemo = async () => {
    setDemoLoading(true);
    try {
      const user = await startDemoSession();
      setUser(user);
      setProfile({ email: user.email, name: user.name });
      setPremium(true);
      setClientDemoMode(true);
      loadDemoData();
      useAppDataStore.getState().completeOnboarding();
      toast.success("Demo mode — Premium unlocked");
      router.push("/dashboard");
    } catch {
      toast.error("Could not start demo");
    } finally {
      setDemoLoading(false);
    }
  };

  useEffect(() => {
    if (wantsDemo && !autoDemoStarted.current) {
      autoDemoStarted.current = true;
      void enterDemo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantsDemo]);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) toast.error(decodeURIComponent(error));
    if (searchParams.get("registered") === "1") {
      toast.success("Account created — sign in to continue");
    }
    if (searchParams.get("reset") === "1") {
      toast.success("Password updated — sign in with your new password");
    }
  }, [searchParams]);

  return (
    <AuthShell
      title="Paycheck Planner"
      subtitle="Sign in to sync your budget across devices"
      footer={
        <p className="mt-6 text-center text-xs text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href={`/login/signup${nextPath !== "/dashboard" ? `?next=${encodeURIComponent(nextPath)}` : ""}`} className="text-sky-400 hover:underline">
            Create one
          </Link>
        </p>
      }
    >
      <button
        type="button"
        disabled={demoLoading}
        onClick={() => void enterDemo()}
        className="mb-6 flex w-full flex-col items-center gap-1 rounded-2xl border-2 border-emerald-400/50 bg-gradient-to-r from-emerald-500/20 to-sky-500/20 px-4 py-4 text-center shadow-lg shadow-emerald-900/30 transition hover:border-emerald-400 hover:brightness-110 disabled:opacity-60"
      >
        {demoLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-emerald-300" />
        ) : (
          <Sparkles className="h-5 w-5 text-emerald-300" />
        )}
        <span className="text-base font-semibold text-white">Try demo — no account needed</span>
        <span className="text-xs text-emerald-200/90">Premium unlocked · sample data on this device only</span>
      </button>

      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void signIn();
        }}
      >
        <AuthField label="Email">
          <AuthInput
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            required
          />
        </AuthField>

        <AuthField
          label="Password"
          hint={
            <Link href="/login/forgot-password" className="text-xs text-sky-400 hover:text-sky-300">
              Forgot password?
            </Link>
          }
        >
          <AuthInput
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            required
          />
        </AuthField>

        <AuthSubmitButton loading={loading} disabled={!email.trim()}>
          Sign in
        </AuthSubmitButton>
      </form>
    </AuthShell>
  );
}
