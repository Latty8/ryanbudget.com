import { Suspense } from "react";
import { SettingsView } from "@/components/fintech/settings-view";

function SettingsLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center p-6">
      <p className="text-sm text-[var(--muted)]">Loading settings…</p>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsView />
    </Suspense>
  );
}
