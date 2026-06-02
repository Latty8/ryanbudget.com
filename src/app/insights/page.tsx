import { Suspense } from "react";
import { InsightsHubView } from "@/components/fintech/insights-hub-view";

export default function InsightsPage() {
  return (
    <Suspense
      fallback={
        <div className="page-enter px-4 py-10 text-sm text-[var(--muted)]">Loading insights…</div>
      }
    >
      <InsightsHubView />
    </Suspense>
  );
}
