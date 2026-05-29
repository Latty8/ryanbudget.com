"use client";

import { Copy, Share2, TrendingUp } from "lucide-react";
import type { PublicBudgetTemplate } from "@/types/budget-template";
import { cn } from "@/lib/utils";

type TemplateCardProps = {
  template: PublicBudgetTemplate;
  highlighted?: boolean;
  onDuplicate: () => void;
  onShare: () => void;
  duplicateLabel?: string;
};

export function TemplateCard({
  template,
  highlighted,
  onDuplicate,
  onShare,
  duplicateLabel = "Duplicate to my account",
}: TemplateCardProps) {
  const totalBudget = template.categories
    .filter((c) => c.group !== "Income")
    .reduce((s, c) => s + c.budgeted, 0);

  return (
    <article
      className={cn(
        "flex flex-col rounded-2xl border bg-neutral-900/60 p-5 transition",
        highlighted ? "border-sky-500/60 ring-1 ring-sky-500/30" : "border-slate-800 hover:border-slate-600"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-white">{template.name}</h3>
          <p className="mt-1 text-xs text-slate-500">
            by {template.author} · {template.payCadence}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sky-500/15 px-2 py-0.5 text-xs text-sky-300">
          <TrendingUp className="h-3 w-3" aria-hidden />
          {template.popularity.toLocaleString()}
        </span>
      </div>

      <p className="mt-3 text-sm text-slate-400">{template.description}</p>

      <div className="mt-3 flex flex-wrap gap-1">
        {template.tags.map((tag) => (
          <span key={tag} className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase text-slate-400">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-4 grid gap-3 rounded-xl border border-slate-800 bg-neutral-950/80 p-3 text-xs">
        <div>
          <p className="font-medium text-slate-300">Categories preview</p>
          <ul className="mt-1 space-y-0.5 text-slate-500">
            {template.categories.slice(0, 5).map((c) => (
              <li key={c.name} className="flex justify-between gap-2">
                <span>{c.name}</span>
                <span>${c.budgeted}</span>
              </li>
            ))}
            {template.categories.length > 5 ? (
              <li className="text-slate-600">+{template.categories.length - 5} more</li>
            ) : null}
          </ul>
          <p className="mt-2 text-slate-600">~${totalBudget.toLocaleString()}/mo budgeted (excl. income)</p>
        </div>
        <div>
          <p className="font-medium text-slate-300">Recurring</p>
          <ul className="mt-1 space-y-0.5 text-slate-500">
            {template.recurring.slice(0, 4).map((r) => (
              <li key={r.name}>
                {r.name}: ${Math.abs(r.amount)} · {r.cadence}
              </li>
            ))}
          </ul>
        </div>
        {template.goals && template.goals.length > 0 ? (
          <div>
            <p className="font-medium text-slate-300">Goals</p>
            <ul className="mt-1 text-slate-500">
              {template.goals.map((g) => (
                <li key={g.name}>
                  {g.name} — ${g.target.toLocaleString()} target
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-sky-500 px-3 py-2.5 text-sm font-medium text-slate-950 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          onClick={onDuplicate}
        >
          <Copy className="h-4 w-4" />
          {duplicateLabel}
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-600 px-3 py-2.5 text-sm text-slate-300 hover:bg-neutral-800"
          onClick={onShare}
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
      </div>
    </article>
  );
}
