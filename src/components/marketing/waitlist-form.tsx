"use client";

import { useState } from "react";
import { toast } from "sonner";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        toast.error(data.error ?? "Could not join waitlist");
        return;
      }
      toast.success(data.message ?? "You're on the list!");
      setEmail("");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col gap-2 sm:flex-row">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        className="flex-1 rounded-xl border border-slate-600 bg-neutral-950 px-4 py-3 text-sm outline-none focus:border-sky-400"
        aria-label="Email for waitlist"
      />
      <button
        type="button"
        disabled={loading}
        onClick={() => void submit()}
        className="rounded-xl bg-sky-500 px-4 py-3 text-sm font-medium text-slate-950 disabled:opacity-60"
      >
        {loading ? "Joining…" : "Join waitlist"}
      </button>
    </div>
  );
}
