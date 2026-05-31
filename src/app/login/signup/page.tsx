import { Suspense } from "react";
import { SignUpPage } from "@/components/auth/signup-page";

export const metadata = {
  title: "Sign up",
  description: "Create your Paycheck Planner account.",
};

export default function SignUpRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0b1220] text-slate-400">
          Loading…
        </div>
      }
    >
      <SignUpPage />
    </Suspense>
  );
}
