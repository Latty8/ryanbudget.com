"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  AuthField,
  AuthInput,
  AuthShell,
  AuthSubmitButton,
} from "@/components/auth/auth-shell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok) {
        throw new Error(body.message ?? "Request failed");
      }
      setSent(true);
      toast.success(body.message ?? "Check your email");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email a reset link if an account exists for that address"
      footer={
        <p className="mt-6 text-center text-xs text-slate-500">
          <Link href="/login" className="text-sky-400 hover:underline">
            ← Back to sign in
          </Link>
        </p>
      }
    >
      {sent ? (
        <p className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 text-sm text-sky-200">
          If <strong>{email}</strong> is registered, a reset link was sent. Check your inbox (and server logs in
          development). Still stuck?{" "}
          <a href="mailto:support@paycheckplanner.app" className="underline">
            Contact support
          </a>
          .
        </p>
      ) : (
        <form className="grid gap-4" onSubmit={(e) => void submit(e)}>
          <AuthField label="Email">
            <AuthInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              required
            />
          </AuthField>
          <AuthSubmitButton loading={loading}>Send reset link</AuthSubmitButton>
        </form>
      )}
    </AuthShell>
  );
}
