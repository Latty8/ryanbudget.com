"use client";

import { ShoppingCart, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { CategoryAddPanel } from "@/components/fintech/category-add-panel";
import { CategoryIconBadge } from "@/components/fintech/category-icon";
import { NumberField } from "@/components/fintech/number-field";
import {
  EmptyState,
  GhostButton,
  fintechLabel,
  PageFrame,
  SectionTitle,
  ShellCard,
  ShellInput,
  ShellSelect,
} from "@/components/fintech/ui";
import { usePageCloudSync } from "@/hooks/use-page-cloud-sync";
import { useConfirm } from "@/components/providers/confirm-dialog-provider";
import {
  CATEGORY_KIND_LABELS,
  expenseSubgroupsForSelect,
  partitionCategoriesByKind,
} from "@/lib/categories/category-kind";
import { useAppDataStore } from "@/store/useAppDataStore";
import { cn } from "@/lib/utils";

const ICON_OPTIONS = [
  "Wallet",
  "Home",
  "ShoppingCart",
  "Car",
  "Utensils",
  "Music",
  "Zap",
  "PiggyBank",
] as const;

export function CategoriesView() {
  usePageCloudSync();
  const confirm = useConfirm();
  const categories = useAppDataStore((s) => s.categories);
  const demoTransactions = useAppDataStore((s) => s.demoTransactions);
  const addCategory = useAppDataStore((s) => s.addCategory);
  const updateCategory = useAppDataStore((s) => s.updateCategory);
  const deleteCategory = useAppDataStore((s) => s.deleteCategory);

  const existingNames = useMemo(() => categories.map((c) => c.name), [categories]);
  const existingGroups = useMemo(() => categories.map((c) => c.group), [categories]);

  const groupOptions = useMemo(() => {
    const subgroups = expenseSubgroupsForSelect(existingGroups);
    return ["Income", ...subgroups.filter((g) => g !== "Income")];
  }, [existingGroups]);

  const { income, expense } = useMemo(() => partitionCategoriesByKind(categories), [categories]);

  const sections = useMemo(
    () =>
      (
        [
          { kind: "income" as const, items: income },
          { kind: "expense" as const, items: expense },
        ] as const
      ).filter((section) => section.items.length > 0),
    [income, expense]
  );

  const iconOptionsForSelect = useMemo(() => {
    const names = new Set<string>(ICON_OPTIONS);
    for (const cat of categories) {
      if (cat.icon) names.add(cat.icon);
    }
    return [...names].sort();
  }, [categories]);

  const handleDelete = (id: string, name: string) => {
    const linked = demoTransactions.filter((t) => t.category === name).length;
    void confirm({
      title: "Delete Category?",
      description: `"${name}" will be removed from your budget plan.`,
      warning:
        linked > 0
          ? `${linked} transaction${linked === 1 ? "" : "s"} use this category. They will be reassigned to Uncategorized.`
          : "This action cannot be undone.",
      confirmLabel: "Delete",
      variant: "destructive",
      onConfirm: () => {
        deleteCategory(id);
        toast.success("Category deleted");
      },
    });
  };

  return (
    <PageFrame
      title="Categories"
      description="Organize spending with groups, icons, colors, and monthly targets."
    >
      <CategoryAddPanel
        existingCategoryNames={existingNames}
        existingGroups={existingGroups}
        onAdd={addCategory}
      />

      {categories.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={ShoppingCart}
            title="No categories yet"
            description="Choose a preset above or switch to Custom to create your first category."
          />
        </div>
      ) : (
        <div className="mt-8 space-y-6 border-t border-[var(--border-subtle)] pt-8">
          <SectionTitle
            title="Your categories"
            description="Grouped by Income and Expenses. Edit details inline below."
          />
          {sections.map(({ kind, items }) => (
            <section key={kind}>
              <p className={cn("mb-3", fintechLabel)}>{CATEGORY_KIND_LABELS[kind]}</p>
              <div className="space-y-3">
                {items.map((category) => (
                  <ShellCard key={category.id} className="overflow-hidden p-0">
                    <div className="border-b border-[var(--border-subtle)] bg-[var(--surface)]/60 px-4 py-3 lg:hidden">
                      <div className="flex items-center gap-3">
                        <CategoryIconBadge name={category.icon} color={category.color} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-semibold">{category.name}</p>
                          <p className="text-xs text-[var(--muted)]">{category.group}</p>
                        </div>
                        <GhostButton
                          type="button"
                          onClick={() => handleDelete(category.id, category.name)}
                          aria-label={`Delete ${category.name}`}
                          className="shrink-0 text-rose-400 hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </GhostButton>
                      </div>
                    </div>

                    <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-[auto_1fr_120px_100px_110px_120px_auto] lg:items-center lg:p-4">
                      <div className="hidden lg:block">
                        <CategoryIconBadge name={category.icon} color={category.color} />
                      </div>
                      <label className="grid gap-1.5 lg:contents">
                        <span className="text-xs font-medium text-[var(--muted)]">Name</span>
                        <ShellInput
                          value={category.name}
                          onChange={(e) => updateCategory(category.id, { name: e.target.value })}
                          aria-label={`Category ${category.name}`}
                        />
                      </label>
                      <label className="grid gap-1 lg:contents">
                        <span className="text-xs font-medium text-[var(--muted)]">Group</span>
                        <ShellSelect
                          value={category.group}
                          onChange={(e) => updateCategory(category.id, { group: e.target.value })}
                          aria-label={`Group for ${category.name}`}
                        >
                          {groupOptions.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </ShellSelect>
                      </label>
                      <label className="grid gap-1 lg:contents">
                        <span className="text-xs font-medium text-[var(--muted)]">Icon</span>
                        <ShellSelect
                          value={category.icon}
                          onChange={(e) => updateCategory(category.id, { icon: e.target.value })}
                          aria-label={`Icon for ${category.name}`}
                        >
                          {iconOptionsForSelect.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </ShellSelect>
                      </label>
                      <label className="grid gap-1 lg:contents">
                        <span className="text-xs font-medium text-[var(--muted)]">Color</span>
                        <ShellInput
                          type="color"
                          value={category.color}
                          onChange={(e) => updateCategory(category.id, { color: e.target.value })}
                          aria-label={`Color for ${category.name}`}
                          className="h-10 cursor-pointer p-1"
                        />
                      </label>
                      <label className="grid gap-1 lg:contents">
                        <span className="text-xs font-medium text-[var(--muted)]">Budget</span>
                        <NumberField
                          value={category.budgeted}
                          onChange={(budgeted) => updateCategory(category.id, { budgeted })}
                          aria-label={`Budget for ${category.name}`}
                        />
                      </label>
                      <GhostButton
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(category.id, category.name);
                        }}
                        aria-label={`Delete ${category.name}`}
                        className="hidden text-rose-400 hover:bg-rose-500/10 lg:inline-flex"
                      >
                        <Trash2 className="h-4 w-4" />
                      </GhostButton>
                    </div>
                  </ShellCard>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </PageFrame>
  );
}
