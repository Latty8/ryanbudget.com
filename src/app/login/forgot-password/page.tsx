"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    setSent(true);
    toast.success("If an account exists, you'll receive reset instructions.");
  };

  return (
    <div className="relative min-h-screen bg-[#0b1220] px-4 py-12 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(56,189,248,0.1),_transparent_50%)]" />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mx-auto max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl"
      >
        <Link href="/login" className="inline-flex items-center gap-1 text-sm text-sky-400 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
        <h1 className="mt-4 text-xl font-semibold">Reset your password</h1>
        <p className="mt-2 text-sm text-slate-400">
          Enter the email on your account. We&apos;ll send a reset link when password recovery is enabled for your
          workspace.
        </p>

        {sent ? (
          <p className="mt-6 rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 text-sm text-sky-200">
            Check your inbox for <strong>{email}</strong>. Still stuck?{" "}
            <a href="mailto:support@paycheckplanner.app" className="underline">
              Contact support
            </a>
            .
          </p>
        ) : (
          <form className="mt-6 grid gap-4" onSubmit={submit}>
            <label className="grid gap-1.5">
              <span className="text-xs text-slate-400">Email</span>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-3 pl-10 pr-4 text-sm outline-none focus:border-sky-400/60"
                  placeholder="you@email.com"
                />
              </div>
            </label>
            <button
              type="submit"
              className="rounded-xl bg-sky-500 py-3 text-sm font-semibold text-slate-950 hover:brightness-110"
            >
              Send reset link
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
