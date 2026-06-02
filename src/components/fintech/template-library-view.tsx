"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppTemplatesGallery } from "@/components/fintech/app-templates-gallery";
import { TransactionTemplatesView } from "@/components/fintech/transaction-templates-view";
import { PageFrame } from "@/components/fintech/ui";
import { cn } from "@/lib/utils";

type TemplateTab = "budget" | "transactions";

const TABS: { id: TemplateTab; label: string; description: string }[] = [
  { id: "budget", label: "Budget plans", description: "Bi-weekly, 50/30/20, snowball & more" },
  { id: "transactions", label: "Quick transactions", description: "One-tap frequent entries" },
];

function parseTab(raw: string | null): TemplateTab {
  return raw === "transactions" ? "transactions" : "budget";
}

export function TemplateLibraryView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = useMemo(() => parseTab(searchParams.get("tab")), [searchParams]);

  const setTab = useCallback(
    (next: TemplateTab) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "budget") params.delete("tab");
      else params.set("tab", next);
      const q = params.toString();
      router.replace(q ? `/template-library?${q}` : "/template-library", { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <PageFrame
      title="Templates"
      description="Import starter budget plans or save quick transaction shortcuts."
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        {TABS.map(({ id, label, description }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "flex-1 rounded-xl border px-4 py-3 text-left transition",
              tab === id
                ? "border-[var(--accent)] bg-[var(--accent-muted)]"
                : "border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
            )}
          >
            <span className="block text-sm font-medium text-[var(--foreground)]">{label}</span>
            <span className="mt-0.5 block text-xs text-[var(--muted)]">{description}</span>
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "budget" ? <AppTemplatesGallery embedded /> : <TransactionTemplatesView embedded />}
      </div>
    </PageFrame>
  );
}
