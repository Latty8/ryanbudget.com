"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutTemplate, Search, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import {
  FilterChip,
  PageFrame,
  PrimaryButton,
  ShellCard,
  ShellInput,
  fintechForeground,
  fintechMuted,
  fintechSurface,
} from "@/components/fintech/ui";
import { applyPublicTemplate } from "@/lib/templates/apply-public-template";
import {
  filterTemplates,
  publicBudgetTemplates,
  TEMPLATE_FILTERS,
} from "@/lib/templates/public-templates";
import type { TemplateFilterCategory } from "@/types/budget-template";
import { cn } from "@/lib/utils";

export function AppTemplatesGallery({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TemplateFilterCategory>("popular");

  const filtered = useMemo(() => filterTemplates(query, filter), [query, filter]);

  const importTemplate = (templateId: string) => {
    const template = publicBudgetTemplates.find((t) => t.id === templateId);
    if (!template) return;
    applyPublicTemplate(template);
    toast.success(`"${template.name}" imported`, {
      description: "Categories, accounts, and recurring items were added to your plan.",
    });
    router.push("/budgets");
  };

  const body = (
    <>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
        <ShellInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search templates…"
          className="pl-10"
        />
      </div>

      <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1">
        {TEMPLATE_FILTERS.map((f) => (
          <FilterChip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </FilterChip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <ShellCard className="mt-6 p-8 text-center">
          <p className={cn("text-sm", fintechMuted)}>No templates match your search.</p>
        </ShellCard>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {filtered.map((template) => {
            const budgetTotal = template.categories
              .filter((c) => c.group !== "Income")
              .reduce((s, c) => s + c.budgeted, 0);
            return (
              <li key={template.id}>
                <ShellCard className="flex h-full flex-col p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={cn("font-semibold", fintechForeground)}>{template.name}</p>
                      <p className={cn("mt-0.5 text-xs capitalize", fintechMuted)}>
                        {template.payCadence.replace("-", " ")} · {template.categories.length} categories
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--accent)]">
                      <TrendingUp className="h-3 w-3" />
                      {template.popularity.toLocaleString()}
                    </span>
                  </div>
                  <p className={cn("mt-3 flex-1 text-sm leading-relaxed", fintechMuted)}>
                    {template.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {template.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-[var(--border-subtle)] px-2 py-0.5 text-[10px] text-[var(--muted)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className={cn("mt-3 text-xs tabular-nums", fintechMuted)}>
                    ~{budgetTotal.toLocaleString()} / period budgeted (excl. income)
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <PrimaryButton type="button" className="flex-1 sm:flex-none" onClick={() => importTemplate(template.id)}>
                      <LayoutTemplate className="mr-1.5 inline h-4 w-4" />
                      Import
                    </PrimaryButton>
                  </div>
                </ShellCard>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );

  if (embedded) return body;

  return (
    <PageFrame
      title="Template gallery"
      description="Browse proven budgets and import one into your planner — bi-weekly, 50/30/20, debt snowball, and more."
    >
      {body}
    </PageFrame>
  );
}
