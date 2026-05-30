"use client";

import {
  Car,
  Home,
  Music,
  PiggyBank,
  Plus,
  ShoppingCart,
  Trash2,
  Utensils,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { NumberField } from "@/components/fintech/number-field";
import {
  EmptyState,
  GhostButton,
  fintechForeground,
  fintechGlass,
  fintechLabel,
  fintechMuted,
  PageFrame,
  PrimaryButton,
  ShellCard,
  ShellInput,
  ShellSelect,
} from "@/components/fintech/ui";
import { useConfirm } from "@/components/providers/confirm-dialog-provider";
import { useAppDataStore } from "@/store/useAppDataStore";
import { cn } from "@/lib/utils";

const ICON_OPTIONS: { name: string; icon: LucideIcon }[] = [
  { name: "Wallet", icon: Wallet },
  { name: "Home", icon: Home },
  { name: "ShoppingCart", icon: ShoppingCart },
  { name: "Car", icon: Car },
  { name: "Utensils", icon: Utensils },
  { name: "Music", icon: Music },
  { name: "Zap", icon: Zap },
  { name: "PiggyBank", icon: PiggyBank },
];

const COLOR_OPTIONS = ["#38bdf8", "#22c55e", "#fbbf24", "#fb7185", "#a78bfa", "#2dd4bf", "#60a5fa", "#f97316"];
const GROUP_OPTIONS = ["Income", "Needs", "Wants", "Goals", "Custom"] as const;

function CategoryIcon({ name, color }: { name: string; color: string }) {
  const match = ICON_OPTIONS.find((option) => option.name === name);
  const Icon = match?.icon ?? Wallet;
  return (
    <span
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
      style={{ backgroundColor: `${color}22`, color }}
    >
      <Icon className="h-5 w-5" aria-hidden />
    </span>
  );
}

export function CategoriesView() {
  const confirm = useConfirm();
  const categories = useAppDataStore((s) => s.categories);
  const demoTransactions = useAppDataStore((s) => s.demoTransactions);
  const addCategory = useAppDataStore((s) => s.addCategory);
  const updateCategory = useAppDataStore((s) => s.updateCategory);
  const deleteCategory = useAppDataStore((s) => s.deleteCategory);

  const [draft, setDraft] = useState({
    name: "",
    group: "Needs" as (typeof GROUP_OPTIONS)[number],
    icon: "Wallet",
    color: COLOR_OPTIONS[0],
    budgeted: 0,
  });

  const grouped = useMemo(() => {
    const map = new Map<string, typeof categories>();
    for (const cat of categories) {
      const key = cat.group || "Custom";
      const list = map.get(key) ?? [];
      list.push(cat);
      map.set(key, list);
    }
    const known = GROUP_OPTIONS.filter((g) => map.has(g));
    const extra = [...map.keys()].filter(
      (g) => !GROUP_OPTIONS.includes(g as (typeof GROUP_OPTIONS)[number])
    );
    return [...known, ...extra].map((group) => ({ group, items: map.get(group) ?? [] }));
  }, [categories]);

  const handleAdd = () => {
    if (!draft.name.trim() || draft.budgeted < 0) {
      toast.error("Enter a category name and valid monthly budget");
      return;
    }
    addCategory(draft);
    setDraft({ name: "", group: "Needs", icon: "Wallet", color: COLOR_OPTIONS[0], budgeted: 0 });
    toast.success("Category added");
  };

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
      {categories.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="No categories yet"
          description="Add categories to track spending and set budget targets."
        />
      ) : (
        <div className="space-y-6">
          {grouped.map(({ group, items }) => (
            <section key={group}>
              <p className={cn("mb-3", fintechLabel)}>{group}</p>
              <div className="space-y-3">
                {items.map((category) => (
                  <ShellCard key={category.id} className="p-4">
                    <div className="grid gap-3 lg:grid-cols-[auto_1fr_120px_100px_110px_120px_auto] lg:items-center">
                      <CategoryIcon name={category.icon} color={category.color} />
                      <ShellInput
                        value={category.name}
                        onChange={(e) => updateCategory(category.id, { name: e.target.value })}
                        aria-label={`Category ${category.name}`}
                      />
                      <ShellSelect
                        value={category.group}
                        onChange={(e) => updateCategory(category.id, { group: e.target.value })}
                        aria-label={`Group for ${category.name}`}
                      >
                        {GROUP_OPTIONS.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </ShellSelect>
                      <ShellSelect
                        value={category.icon}
                        onChange={(e) => updateCategory(category.id, { icon: e.target.value })}
                        aria-label={`Icon for ${category.name}`}
                      >
                        {ICON_OPTIONS.map((option) => (
                          <option key={option.name} value={option.name}>
                            {option.name}
                          </option>
                        ))}
                      </ShellSelect>
                      <ShellInput
                        type="color"
                        value={category.color}
                        onChange={(e) => updateCategory(category.id, { color: e.target.value })}
                        aria-label={`Color for ${category.name}`}
                        className="h-10 cursor-pointer p-1"
                      />
                      <NumberField
                        value={category.budgeted}
                        onChange={(budgeted) => updateCategory(category.id, { budgeted })}
                        aria-label={`Budget for ${category.name}`}
                      />
                      <GhostButton
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(category.id, category.name);
                        }}
                        aria-label={`Delete ${category.name}`}
                        className="text-rose-400 hover:bg-rose-500/10"
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

      <div className={cn(fintechGlass, "mt-6 p-5")}>
        <p className={cn("text-sm font-semibold", fintechForeground)}>Add category</p>
        <p className={cn("mt-1 text-xs", fintechMuted)}>
          Groups like Needs and Wants help organize your budget. Monthly targets feed the Budgets page.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <ShellInput
            placeholder="Category name"
            value={draft.name}
            onChange={(e) => setDraft((s) => ({ ...s, name: e.target.value }))}
          />
          <ShellSelect
            value={draft.group}
            onChange={(e) => setDraft((s) => ({ ...s, group: e.target.value as typeof draft.group }))}
          >
            {GROUP_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </ShellSelect>
          <ShellSelect value={draft.icon} onChange={(e) => setDraft((s) => ({ ...s, icon: e.target.value }))}>
            {ICON_OPTIONS.map((option) => (
              <option key={option.name} value={option.name}>
                {option.name}
              </option>
            ))}
          </ShellSelect>
          <ShellInput
            type="color"
            value={draft.color}
            onChange={(e) => setDraft((s) => ({ ...s, color: e.target.value }))}
          />
          <NumberField
            placeholder="Monthly budget"
            value={draft.budgeted}
            onChange={(budgeted) => setDraft((s) => ({ ...s, budgeted }))}
          />
          <PrimaryButton onClick={handleAdd}>
            <Plus className="mr-1 inline h-4 w-4" />
            Add
          </PrimaryButton>
        </div>
      </div>
    </PageFrame>
  );
}
