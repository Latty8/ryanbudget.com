"use client";

import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { startDemoSession } from "@/lib/auth/start-demo";
import { useAppDataStore } from "@/store/useAppDataStore";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";
import { cn } from "@/lib/utils";

type DemoLaunchButtonProps = {
  className?: string;
  size?: "default" | "large";
};

export function DemoLaunchButton({ className, size = "default" }: DemoLaunchButtonProps) {
  const router = useRouter();
  const { setUser } = useAuth();
  const loadDemoData = useAppDataStore((s) => s.loadDemoData);
  const completeOnboarding = useAppDataStore((s) => s.completeOnboarding);
  const setProfile = useAppDataStore((s) => s.setProfile);
  const setPremium = useSubscriptionStore((s) => s.setPremium);
  const [loading, setLoading] = useState(false);

  const launch = async () => {
    setLoading(true);
    try {
      const user = await startDemoSession();
      setUser(user);
      setProfile({ email: user.email, name: user.name });
      setPremium(true);
      loadDemoData();
      completeOnboarding();
      toast.success("Demo mode — Premium unlocked");
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start demo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => void launch()}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 font-medium text-slate-950 shadow-lg shadow-sky-900/30 transition hover:brightness-110 disabled:opacity-60",
        size === "large" ? "px-6 py-3.5 text-base" : "px-5 py-3 text-sm",
        className
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      Try demo — no sign-in
      {!loading ? <ArrowRight className="h-4 w-4" /> : null}
    </button>
  );
}
