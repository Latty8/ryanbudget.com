import { Suspense } from "react";
import { LoginPage } from "@/components/auth/login-page";

export const metadata = {
  title: "Sign in",
  description: "Sign in to Paycheck Planner — calm bi-weekly budgeting.",
};

export default function LoginRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0b1220] text-slate-400">
          Loading…
        </div>
      }
    >
      <LoginPage />
    </Suspense>
  );
}
