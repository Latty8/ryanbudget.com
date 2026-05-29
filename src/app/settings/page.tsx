import { Suspense } from "react";
import { SettingsView } from "@/components/fintech/settings-view";

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-400">Loading settings...</div>}>
      <SettingsView />
    </Suspense>
  );
}
