import { Suspense } from "react";
import { OnboardingFlow } from "@/components/fintech/onboarding-flow";

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[var(--muted)]">Loading setup…</div>}>
      <OnboardingFlow />
    </Suspense>
  );
}
