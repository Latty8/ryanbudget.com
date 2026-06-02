"use client";

import { Plus, ShoppingCart } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CategoryAddPanel } from "@/components/fintech/category-add-panel";
import { CategoryRow } from "@/components/fintech/category-row";
import {
  EmptyState,
  PageFrame,
  PrimaryButton,
  ShellCard,
  fintechLabel,
  fintechMuted,
} from "@/components/fintech/ui";
import { usePageCloudSync } from "@/hooks/use-page-cloud-sync";
import { useConfirm } from "@/components/providers/confirm-dialog-provider";
import {
  CATEGORY_KIND_LABELS,
  expenseSubgroupsForSelect,
  getCategoryKind,
  partitionCategoriesByKind,
} from "@/lib/categories/category-kind";
import {
  isHiddenSystemCategory,
  sanitizeCategoryList,
  SYSTEM_UNCATEGORIZED_NAME,
} from "@/lib/categories/system-category";
import { useAppDataStore } from "@/store/useAppDataStore";
import { cn } from "@/lib/utils";
import type { AppCategory } from "@/types/app-settings";

function CategorySection({
  kind,
  items,
  spentByCategory,
  editingId,
  groupOptions,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: {
  kind: "income" | "expense";
  items: AppCategory[];
  spentByCategory: Map<string, number>;
  editingId: string | null;
  groupOptions: string[];
  onStartEdit: (id: string) => void;
  onCancelEdit: () => void;
  onSave: (id: string, patch: Partial<AppCategory>) => void;
  onDelete: (id: string, name: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3">
      <p className={cn(fintechLabel)}>{CATEGORY_KIND_LABELS[kind]}</p>

      <ShellCard className="hidden overflow-hidden p-0 lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-elevated)]">
                <th className="py-2.5 pl-4 pr-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Category
                </th>
                <th className="hidden px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] xl:table-cell">
                  Group
                </th>
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Spending / Budget
                </th>
                <th className="py-2.5 pl-3 pr-4 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((category) => (
                <CategoryRow
                  key={category.id}
                  variant="table"
                  category={category}
                  kind={kind}
                  spent={spentByCategory.get(category.name) ?? 0}
                  isSystem={isHiddenSystemCategory(category)}
                  isEditing={editingId === category.id}
                  groupOptions={groupOptions}
                  onStartEdit={() => onStartEdit(category.id)}
                  onCancelEdit={onCancelEdit}
                  onSave={(patch) => onSave(category.id, patch)}
                  onDelete={() => onDelete(category.id, category.name)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </ShellCard>

      <div className="grid grid-cols-1 gap-3 lg:hidden">
        {items.map((category) => (
          <CategoryRow
            key={category.id}
            variant="card"
            category={category}
            kind={kind}
            spent={spentByCategory.get(category.name) ?? 0}
            isSystem={isHiddenSystemCategory(category)}
            isEditing={editingId === category.id}
            groupOptions={groupOptions}
            onStartEdit={() => onStartEdit(category.id)}
            onCancelEdit={onCancelEdit}
            onSave={(patch) => onSave(category.id, patch)}
            onDelete={() => onDelete(category.id, category.name)}
          />
        ))}
      </div>
    </section>
  );
}

export function CategoriesView() {
  usePageCloudSync();
  const confirm = useConfirm();
  const categories = useAppDataStore((s) => s.categories);
  const demoTransactions = useAppDataStore((s) => s.demoTransactions);
  const addCategory = useAppDataStore((s) => s.addCategory);
  const updateCategory = useAppDataStore((s) => s.updateCategory);
  const deleteCategory = useAppDataStore((s) => s.deleteCategory);

  const [showAddPanel, setShowAddPanel] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const existingNames = useMemo(() => categories.map((c) => c.name), [categories]);
  const existingGroups = useMemo(() => categories.map((c) => c.group), [categories]);

  const groupOptions = useMemo(() => {
    const subgroups = expenseSubgroupsForSelect(existingGroups);
    return ["Income", ...subgroups.filter((g) => g !== "Income")];
  }, [existingGroups]);

  const visibleCategories = useMemo(
    () => sanitizeCategoryList(categories),
    [categories]
  );

  const { income, expense } = useMemo(
    () => partitionCategoriesByKind(visibleCategories),
    [visibleCategories]
  );

  const sortedExpense = useMemo(() => [...expense], [expense]);

  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of demoTransactions) {
      if (tx.amount >= 0) continue;
      map.set(tx.category, (map.get(tx.category) ?? 0) + Math.abs(tx.amount));
    }
    return map;
  }, [demoTransactions]);

  const userCategories = visibleCategories;

  const handleDelete = (id: string, name: string) => {
    const category = categories.find((c) => c.id === id);
    if (!category || isHiddenSystemCategory(category)) return;

    const linked = demoTransactions.filter((t) => t.category === name).length;
    void confirm({
      title: "Delete category?",
      description: `"${name}" will be removed from your budget plan.`,
      warning:
        linked > 0
          ? `${linked} transaction${linked === 1 ? "" : "s"} will be labeled "${SYSTEM_UNCATEGORIZED_NAME}" (not shown as a budget category).`
          : "This action cannot be undone.",
      confirmLabel: "Delete",
      variant: "destructive",
      onConfirm: () => {
        deleteCategory(id);
        if (editingId === id) setEditingId(null);
        toast.success("Category deleted");
      },
    });
  };

  const handleSave = (id: string, patch: Partial<AppCategory>) => {
    updateCategory(id, patch);
    setEditingId(null);
    toast.success("Category updated");
  };

  const openAddPanel = () => {
    setShowAddPanel(true);
    setEditingId(null);
    requestAnimationFrame(() => {
      document.getElementById("add-category")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const sectionProps = {
    editingId,
    groupOptions,
    spentByCategory,
    onStartEdit: (id: string) => setEditingId((current) => (current === id ? null : id)),
    onCancelEdit: () => setEditingId(null),
    onSave: handleSave,
    onDelete: handleDelete,
  };

  return (
    <PageFrame
      title="Categories"
      description="Organize income and spending with groups, icons, and monthly targets."
      action={
        <PrimaryButton type="button" onClick={openAddPanel} className="w-full shadow-sm sm:w-auto">
          <Plus className="mr-1.5 h-4 w-4" aria-hidden />
          Add category
        </PrimaryButton>
      }
    >
      {showAddPanel ? (
        <CategoryAddPanel
          existingCategoryNames={existingNames}
          existingGroups={existingGroups}
          onAdd={(category) => {
            addCategory(category);
            toast.success(`Added ${category.name}`);
          }}
          onClose={() => setShowAddPanel(false)}
        />
      ) : null}

      {userCategories.length === 0 ? (
        <div className="mt-2">
          <EmptyState
            icon={ShoppingCart}
            title="No categories yet"
            description="Add your first category to start organizing spending and income."
            action={
              <PrimaryButton type="button" onClick={openAddPanel} className="shadow-sm">
                <Plus className="mr-1.5 h-4 w-4" aria-hidden />
                Add category
              </PrimaryButton>
            }
          />
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className={cn("text-sm", fintechMuted)}>
              {userCategories.length} categor{userCategories.length === 1 ? "y" : "ies"}
              {income.length > 0 && expense.length > 0
                ? ` · ${income.length} income · ${expense.length} expense`
                : null}
            </p>
            {!showAddPanel ? (
              <button
                type="button"
                onClick={openAddPanel}
                className="text-left text-sm font-medium text-[var(--accent)] hover:underline sm:hidden"
              >
                Add another category
              </button>
            ) : null}
          </div>

          <CategorySection kind="income" items={income} {...sectionProps} />
          <CategorySection kind="expense" items={sortedExpense} {...sectionProps} />
        </div>
      )}
    </PageFrame>
  );
}
