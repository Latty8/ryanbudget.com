"use client";

import { useRef, useState } from "react";
import { FormField, PageHeader } from "@/components/planner/ui";
import { fromCents } from "@/lib/planner/format";
import { useConfirm } from "@/components/providers/confirm-dialog-provider";
import { usePlannerStore } from "@/store/usePlannerStore";

export function SettingsPage() {
  const confirm = useConfirm();
  const {
    user,
    currency,
    payFrequency,
    defaultPaycheckAmount,
    darkMode,
    setDarkMode,
    setPayFrequency,
    setCurrency,
    resetDemoData,
    exportData,
    importData,
  } = usePlannerStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" description="Profile, budgeting defaults, and appearance." />
      <div className="planner-card grid gap-3 p-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span>Name</span>
          <input className="planner-input" value={user.name} readOnly />
        </label>
        <label className="grid gap-1 text-sm">
          <span>Email</span>
          <input className="planner-input" value={user.email} readOnly />
        </label>
        <FormField label="Currency">
          <select className="planner-input" value={currency} onChange={(e) => setCurrency(e.target.value as "USD" | "CAD" | "EUR" | "GBP")}>
            <option value="USD">USD - US Dollar</option>
            <option value="CAD">CAD - Canadian Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
          </select>
        </FormField>
        <FormField label="Pay frequency">
          <select className="planner-input" value={payFrequency} onChange={(e) => setPayFrequency(e.target.value as "weekly" | "biweekly" | "semi-monthly" | "monthly")}>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
            <option value="semi-monthly">Semi-monthly</option>
            <option value="monthly">Monthly</option>
          </select>
        </FormField>
        <label className="grid gap-1 text-sm">
          <span>Default paycheck amount</span>
          <input className="planner-input" value={fromCents(defaultPaycheckAmount)} readOnly />
        </label>
        <label className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] p-3 text-sm">
          <input type="checkbox" checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />
          Dark mode
        </label>
      </div>

      <div className="planner-card grid gap-3 p-4 text-sm">
        <p className="font-medium">Data export</p>
        <p className="text-[var(--muted)]">Download your local demo data as JSON.</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              const json = exportData();
              if (!json) {
                setMessage("Could not export local data.");
                return;
              }
              const blob = new Blob([json], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `paycheck-planner-backup-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(url);
              setMessage("Backup exported.");
            }}
          >
            Export JSON
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            Import JSON
          </button>
          <button
            type="button"
            className="btn-secondary border-red-400/60 text-red-600 hover:bg-red-500/10"
            onClick={() => {
              void confirm({
                title: "Reset demo data?",
                description: "All local planner data will be replaced with the default demo dataset.",
                warning: "This action cannot be undone.",
                confirmLabel: "Reset data",
                onConfirm: () => {
                  resetDemoData();
                  setMessage("Demo data reset.");
                },
              });
            }}
          >
            Reset Demo Data
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const text = await file.text();
            const result = importData(text);
            setMessage(result.message);
            e.currentTarget.value = "";
          }}
        />
        <p className="font-medium mt-3">Account deletion</p>
        <p className="text-[var(--muted)]">Placeholder for Phase 2 account lifecycle flows.</p>
        {message ? <p className="text-xs text-[var(--muted)]">{message}</p> : null}
      </div>
    </div>
  );
}
