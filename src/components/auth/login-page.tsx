"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CalendarClock, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { setClientDemoMode } from "@/lib/auth/demo-mode";
import { startDemoSession } from "@/lib/auth/start-demo";
import { setOAuthReturnPath } from "@/lib/auth/oauth-return-path";
import { getSupabaseBrowserClient, hasSupabaseBrowserEnv, resetSupabaseOAuthState } from "@/lib/supabase/browser";
import { useAppDataStore } from "@/store/useAppDataStore";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05 1.7-3.4 1.7-1.34 0-1.75-.79-3.26-.79-1.5 0-1.96.77-3.25.82-1.31.05-2.3-1.32-3.14-2.27C2.79 17.25 1.94 13.94 3.5 10.7c.78-1.57 2.17-2.56 3.7-2.58 1.3-.03 2.52.87 3.26.87.74 0 2.12-1.07 3.58-.91.61.03 2.33.25 3.43 1.87-2.9 1.77-2.43 5.38.48 6.58-.6 1.54-1.38 3.06-2.36 4.15zM14.02 4.2c.57-.69.96-1.65.85-2.6-.82.03-1.81.55-2.4 1.24-.53.61-1 1.6-.87 2.55.92.07 1.87-.47 2.42-1.19z" />
    </svg>
  );
}

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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const nextPath = searchParams.get("next") ?? "/dashboard";
  const wantsDemo = searchParams.get("demo") === "1" || searchParams.get("demo") === "true";
  const autoDemoStarted = useRef(false);

  const completeSignIn = async (options: {
    email: string;
    password: string;
    demo?: boolean;
    loadSampleData?: boolean;
  }) => {
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: options.email,
        password: options.password,
        demo: options.demo,
      }),
    });
    const result = (await response.json()) as {
      ok: boolean;
      message?: string;
      user?: { userId: string; email: string; name: string; isDemo?: boolean };
      mode?: string;
    };
    if (!response.ok || !result.ok || !result.user) {
      throw new Error(result.message ?? "Sign in failed");
    }

    setUser(result.user);
    setProfile({ email: result.user.email, name: result.user.name });

    if (result.user.isDemo || result.mode === "demo") {
      setClientDemoMode(true);
      setPremium(true);
      if (options.loadSampleData) loadDemoData();
    }

    const onboarded = document.cookie.includes("planner-onboarded=true");
    router.push(onboarded ? nextPath : "/onboarding");
  };

  const signIn = async () => {
    if (!email.trim() || !password) {
      toast.error("Enter your email and password");
      return;
    }
    setLoading(true);
    try {
      await completeSignIn({ email, password });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when ?demo= is present
  }, [wantsDemo]);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) toast.error(decodeURIComponent(error));
  }, [searchParams]);

  const googleOAuthStarted = useRef(false);

  const signInWithGoogle = async () => {
    if (googleOAuthStarted.current || googleLoading) return;
    if (!hasSupabaseBrowserEnv()) {
      toast.error("Google sign-in requires Supabase. Add NEXT_PUBLIC_SUPABASE_URL and keys on the server.");
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    googleOAuthStarted.current = true;
    setGoogleLoading(true);
    try {
      await resetSupabaseOAuthState(supabase);
      setOAuthReturnPath(nextPath);
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });
      if (error) throw error;
    } catch (error) {
      googleOAuthStarted.current = false;
      toast.error(error instanceof Error ? error.message : "Google sign-in failed");
      setGoogleLoading(false);
    }
  };

  const socialSoon = (provider: string) => {
    toast.info(`${provider} sign-in is coming soon. Use email, Google, or try the demo.`);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b1220] text-slate-100">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-[28rem] w-[28rem] rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(56,189,248,0.08),_transparent_55%)]" />
        <svg className="absolute bottom-0 left-0 right-0 opacity-[0.07]" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path
            fill="currentColor"
            d="M0,192L48,197.3C96,203,192,213,288,218.7C384,224,480,224,576,208C672,192,768,160,864,154.7C960,149,1056,171,1152,181.3C1248,192,1344,192,1392,192L1440,192L1440,320L0,320Z"
          />
        </svg>
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-sky-950/40 backdrop-blur-xl"
        >
          <div className="mb-8 text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-emerald-400 text-slate-950 shadow-lg shadow-sky-500/30"
            >
              <CalendarClock className="h-7 w-7" aria-hidden />
            </motion.div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Paycheck Planner</h1>
            <p className="mt-2 text-sm text-slate-400">Calm budgeting for real-life bi-weekly pay</p>
          </div>

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
            <span className="text-base font-semibold text-white">Try demo — no sign-in needed</span>
            <span className="text-xs text-emerald-200/90">Premium unlocked · bi-weekly sample data</span>
          </button>

          <div className="grid gap-3">
            <button
              type="button"
              disabled={googleLoading || demoLoading}
              onClick={() => void signInWithGoogle()}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition hover:bg-white/10 disabled:opacity-60"
            >
              {googleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => socialSoon("Apple")}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition hover:bg-white/10"
            >
              <AppleIcon />
              Continue with Apple
            </button>
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs uppercase tracking-wider text-slate-500">or sign in with email</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void signIn();
            }}
          >
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-slate-400">Email</span>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-sky-400/60 focus:ring-2 focus:ring-sky-500/20"
              />
            </label>
            <label className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Password</span>
                <Link href="/login/forgot-password" className="text-xs text-sky-400 hover:text-sky-300">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-sky-400/60 focus:ring-2 focus:ring-sky-500/20"
              />
            </label>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/25 transition hover:brightness-110 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Sign in
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Need an account?{" "}
            <a href="mailto:support@paycheckplanner.app" className="text-sky-400 hover:underline">
              Contact support
            </a>
            {" · "}
            <Link href="/resources" className="text-sky-400 hover:underline">
              Join the waitlist
            </Link>
          </p>
        </motion.div>

        <p className="mt-6 text-center text-xs text-slate-600">
          <Link href="/" className="hover:text-slate-400">
            ← Back to homepage
          </Link>
        </p>
      </div>
    </div>
  );
}
