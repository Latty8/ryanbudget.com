"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutTemplate, Upload } from "lucide-react";
import { toast } from "sonner";
import { addDays, format } from "date-fns";
import { nanoid } from "nanoid";
import { TemplateCard } from "@/components/marketing/template-card";
import { DemoLaunchButton } from "@/components/marketing/demo-launch-button";
import { useAuth } from "@/components/providers/auth-provider";
import { filterTemplates, TEMPLATE_FILTERS } from "@/lib/templates/public-templates";
import { publicBudgetTemplates } from "@/lib/templates/public-templates";
import { useAppDataStore } from "@/store/useAppDataStore";
import type { TemplateFilterCategory } from "@/types/budget-template";
import { cn } from "@/lib/utils";

export function PublicTemplatesGallery() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlight = searchParams.get("highlight");
  const { user } = useAuth();
  const loadFromTemplate = useAppDataStore((s) => s.loadFromPublicTemplate);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TemplateFilterCategory>("all");
  const [publishOpen, setPublishOpen] = useState(false);

  const filtered = useMemo(() => filterTemplates(query, filter), [query, filter]);

  const duplicateTemplate = (templateId: string) => {
    if (!user) {
      toast.message("Sign in to duplicate", {
        description: "Create a free account or try the demo first.",
        action: {
          label: "Sign in",
          onClick: () => router.push(`/login?next=/templates`),
        },
      });
      return;
    }

    const template = publicBudgetTemplates.find((t) => t.id === templateId);
    if (!template) return;

    loadFromTemplate({
      accounts: template.accounts.map((a) => ({
        ...a,
        id: nanoid(),
        balance: 0,
        color: "#38bdf8",
        icon: "Wallet",
      })),
      categories: template.categories.map((c) => ({ ...c, id: nanoid() })),
      recurring: template.recurring.map((r) => ({
        id: nanoid(),
        name: r.name,
        amount: r.amount,
        cadence: r.cadence as "weekly" | "bi-weekly" | "monthly",
        nextDate: format(addDays(new Date(), 7), "yyyy-MM-dd"),
      })),
      goals: (template.goals ?? []).map((g) => ({
        id: nanoid(),
        name: g.name,
        target: g.target,
        current: 0,
        targetDate: format(addDays(new Date(), 180), "yyyy-MM-dd"),
        icon: g.icon ?? "Target",
        color: g.color ?? "#22c55e",
      })),
    });
    toast.success(`"${template.name}" added to your account`);
    router.push("/budgets");
  };

  const shareTemplate = async (slug: string, name: string) => {
    const url = `${window.location.origin}/templates?highlight=${slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: name, text: `Budget template: ${name}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Template link copied");
      }
    } catch {
      toast.message("Share cancelled");
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <p className="inline-flex items-center gap-2 text-sm font-medium text-sky-400">
          <LayoutTemplate className="h-4 w-4" />
          Public template gallery
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          Start from a proven budget
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-400">
          Duplicate bi-weekly paycheck plans, debt snowballs, and household budgets — then customize in minutes.
          No login required to browse.
        </p>
        {!user ? (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <DemoLaunchButton />
            <Link
              href="/login?next=/templates"
              className="rounded-xl border border-slate-600 px-5 py-3 text-sm font-medium text-slate-200 hover:bg-neutral-900"
            >
              Sign in to duplicate
            </Link>
          </div>
        ) : (
          <p className="mt-4 text-sm text-emerald-400/90">Signed in — duplicate any template to your account.</p>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search templates…"
          className="min-h-11 flex-1 rounded-xl border border-slate-700 bg-neutral-900 px-4 py-2 text-sm outline-none focus-visible:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-500/30"
          aria-label="Search templates"
        />
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter templates">
          {TEMPLATE_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                filter === f.id
                  ? "border-sky-500/50 bg-sky-500/15 text-sky-200"
                  : "border-slate-700 text-slate-400 hover:border-slate-500"
              )}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 py-16 text-center">
          <p className="text-sm font-medium text-slate-300">No templates match</p>
          <p className="mt-1 text-xs text-slate-500">Try another filter or search term.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {filtered.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              highlighted={highlight === template.slug}
              onDuplicate={() => duplicateTemplate(template.id)}
              onShare={() => void shareTemplate(template.slug, template.name)}
              duplicateLabel={user ? "Duplicate to my account" : "Sign in to duplicate"}
            />
          ))}
        </div>
      )}

      {user ? (
        <div className="rounded-2xl border border-violet-500/30 bg-violet-500/5 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-2 font-medium text-violet-200">
                <Upload className="h-4 w-4" />
                Publish your template
              </p>
              <p className="mt-1 max-w-lg text-sm text-slate-400">
                Share your budget setup with the community. Submissions are reviewed before appearing publicly (coming
                soon).
              </p>
            </div>
            <button
              type="button"
              className="rounded-xl border border-violet-500/40 px-4 py-2 text-sm text-violet-200 hover:bg-violet-500/10"
              onClick={() => setPublishOpen(true)}
            >
              Submit for review
            </button>
          </div>
        </div>
      ) : null}

      {publishOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-neutral-900 p-5">
            <p className="text-lg font-semibold">Submit template</p>
            <p className="mt-2 text-sm text-slate-400">
              Thanks for contributing! Community publishing with moderation is on the roadmap. For now, export your
              budget from Settings and email support@paycheckplanner.app.
            </p>
            <button
              type="button"
              className="mt-4 w-full rounded-xl bg-violet-600 py-2.5 text-sm font-medium text-white"
              onClick={() => {
                setPublishOpen(false);
                toast.success("We'll notify you when publishing opens");
              }}
            >
              Got it
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
