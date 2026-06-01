"use client";

import { fintechForeground, fintechLabel, fintechMuted } from "@/components/fintech/ui";
import type { WhatIfProjection } from "@/lib/ai/what-if-projection";
import { formatMoney } from "@/store/useAppDataStore";
import type { CurrencyCode } from "@/types/app-settings";
import { cn } from "@/lib/utils";

type Props = {
  projection: WhatIfProjection;
  currency: CurrencyCode;
};

export function WhatIfProjectionCard({ projection, currency }: Props) {
  const stats = [
    { label: "Per paycheck", value: projection.perPaycheck },
    { label: "Per month", value: projection.monthlySavings },
    { label: "Per year", value: projection.annualSavings },
    { label: "Buffer after", value: projection.bufferAfter },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-[var(--radius-inner)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2.5"
          >
            <p className={fintechLabel}>{s.label}</p>
            <p className={cn("mt-1 text-sm font-semibold tabular-nums", fintechForeground)}>
              {formatMoney(s.value, currency)}
            </p>
          </div>
        ))}
      </div>
      <p className={cn("text-sm leading-relaxed", fintechMuted)}>{projection.summary}</p>
    </div>
  );
}
