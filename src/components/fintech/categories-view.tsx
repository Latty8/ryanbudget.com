"use client";

import { ShoppingCart } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { CategoryAddPanel } from "@/components/fintech/category-add-panel";
import { CategoryEditCard } from "@/components/fintech/category-edit-card";
import {
  EmptyState,
  PageFrame,
  SectionTitle,
  fintechLabel,
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

  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of demoTransactions) {
      if (tx.amount >= 0) continue;
      map.set(tx.category, (map.get(tx.category) ?? 0) + Math.abs(tx.amount));
    }
    return map;
  }, [demoTransactions]);

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
        <div className="mt-8 space-y-8 border-t border-[var(--border-subtle)] pt-8">
          <SectionTitle
            title="Your categories"
            description="Tap a card to edit details. Progress reflects spending this month."
          />
          {sections.map(({ kind, items }) => (
            <section key={kind}>
              <p className={cn("mb-4", fintechLabel)}>{CATEGORY_KIND_LABELS[kind]}</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {items.map((category) => (
                  <CategoryEditCard
                    key={category.id}
                    category={category}
                    spent={spentByCategory.get(category.name) ?? 0}
                    groupOptions={groupOptions}
                    iconOptions={iconOptionsForSelect}
                    onUpdate={(patch) => updateCategory(category.id, patch)}
                    onDelete={() => handleDelete(category.id, category.name)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </PageFrame>
  );
}
