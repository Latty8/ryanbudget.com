"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
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
import { useAppDataStore } from "@/store/useAppDataStore";

export function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const setProfile = useAppDataStore((s) => s.setProfile);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const nextPath = searchParams.get("next") ?? "/dashboard";

  const signUp = async () => {
    if (!email.trim() || !password) {
      toast.error("Email and password are required");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, confirmPassword, name: name.trim() || undefined }),
      });
      const result = (await response.json()) as {
        ok: boolean;
        message?: string;
        user?: { userId: string; email: string; name: string };
      };

      if (!response.ok || !result.ok || !result.user) {
        throw new Error(result.message ?? "Could not create account");
      }

      resetSignInDedupe();
      setUser(result.user);
      setProfile({ email: result.user.email, name: result.user.name });
      await completeSignInClient(result.user);

      toast.success("Account created — syncing your data");
      const destination = await resolvePostLoginPath(nextPath);
      router.push(destination);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="One account syncs wallets, budgets, and transactions across devices"
      footer={
        <p className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="text-sky-400 hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void signUp();
        }}
      >
        <AuthField label="Full name (optional)">
          <AuthInput
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex"
          />
        </AuthField>

        <AuthField label="Email">
          <AuthInput
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            required
          />
        </AuthField>

        <AuthField label="Password">
          <AuthInput
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            minLength={8}
          />
        </AuthField>

        <AuthField label="Confirm password">
          <AuthInput
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat password"
            required
            minLength={8}
          />
        </AuthField>

        <p className="text-[11px] leading-relaxed text-slate-500">
          Use at least 8 characters with letters and numbers. Your budget syncs automatically across devices when
          you&apos;re signed in.
        </p>

        <AuthSubmitButton loading={loading} disabled={!email.trim() || !password}>
          Create account
        </AuthSubmitButton>
      </form>
    </AuthShell>
  );
}
