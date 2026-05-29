"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageChrome";
import { useMounted } from "@/components/use-mounted";
import {
  buildCategoryTreeRows,
  categoryHasChildren,
  parentGroupOptions,
} from "@/lib/categories";
import { useBudgetStore } from "@/store/useBudgetStore";
import type { CategoryKind } from "@/lib/types";

const presetColors = [
  "#22c55e",
  "#6366f1",
  "#f97316",
  "#0ea5e9",
  "#eab308",
  "#a855f7",
  "#ec4899",
  "#ef4444",
  "#64748b",
];

export function CategoriesClient() {
  const mounted = useMounted();
  const categories = useBudgetStore((s) => s.categories);
  const addCategory = useBudgetStore((s) => s.addCategory);
  const updateCategory = useBudgetStore((s) => s.updateCategory);
  const deleteCategory = useBudgetStore((s) => s.deleteCategory);
  const moveCategory = useBudgetStore((s) => s.moveCategory);

  const [name, setName] = useState("");
  const [color, setColor] = useState(presetColors[0]);
  const [kind, setKind] = useState<CategoryKind>("expense");
  const [parentId, setParentId] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const treeRows = useMemo(
    () => buildCategoryTreeRows(categories),
    [categories]
  );

  const parentOptions = useMemo(
    () => parentGroupOptions(categories, kind, editingId),
    [categories, kind, editingId]
  );

  const editingHasChildren = editingId
    ? categoryHasChildren(categories, editingId)
    : false;

  function resetForm() {
    setName("");
    setColor(presetColors[0]);
    setKind("expense");
    setParentId("");
    setEditingId(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const resolvedParent = parentId || null;
    if (editingId) {
      updateCategory(
        editingId,
        name.trim(),
        color,
        kind,
        editingHasChildren ? undefined : resolvedParent
      );
    } else {
      addCategory(name.trim(), color, kind, resolvedParent);
    }
    resetForm();
  }

  if (!mounted) {
    return (
      <div className="surface-card animate-pulse p-12 text-center text-[var(--muted)]">
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader
        eyebrow="Organization"
        title="Categories"
        description="Create top-level groups (e.g. Apartment) and sub-categories under them (Rent, Utilities). Transactions and budget envelopes use sub-categories; groups organize and roll up totals."
      />

      <form onSubmit={submit} className="surface-card p-6 sm:p-8">
        <h2 className="mb-6 type-form-title">
          {editingId ? "Edit category" : "New category"}
        </h2>
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[var(--muted)]">Name</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                parentId ? "e.g. Rent" : "e.g. Apartment or Groceries"
              }
              className="field min-w-[200px]"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[var(--muted)]">For</span>
            <select
              value={kind}
              onChange={(e) => {
                setKind(e.target.value as CategoryKind);
                setParentId("");
              }}
              className="field min-w-[140px]"
              disabled={!!parentId && !editingId}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[var(--muted)]">Under</span>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="field min-w-[180px]"
              disabled={editingHasChildren}
            >
              <option value="">
                {editingHasChildren
                  ? "Top-level (has sub-categories)"
                  : "Top-level — group or standalone"}
              </option>
              {parentOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[var(--muted)]">Color</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="field h-10 w-14 cursor-pointer overflow-hidden p-1"
              />
              <select
                value={presetColors.includes(color) ? color : ""}
                onChange={(e) => {
                  if (e.target.value) setColor(e.target.value);
                }}
                className="field text-sm"
              >
                <option value="">Presets…</option>
                {presetColors.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </label>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">
              {editingId ? "Save" : parentId ? "Add sub-category" : "Add"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </form>

      <ul className="surface-card divide-y divide-[var(--border-subtle)] overflow-hidden p-0">
        {treeRows.length === 0 ? (
          <li className="px-5 py-12 text-center text-[var(--muted)] sm:px-6">
            No categories yet.
          </li>
        ) : (
          treeRows.map((row, index) => {
            const c = row.category;
            const isGroup = row.type === "group";
            const canMoveUp = index > 0;
            const canMoveDown = index < treeRows.length - 1;

            return (
              <li
                key={c.id}
                className={`flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_4%,var(--surface-hover))] sm:px-6 ${
                  row.type === "item" && row.indent ? "bg-[var(--surface-elevated)]/40" : ""
                }`}
              >
                <span
                  className={`inline-flex items-center gap-2 font-semibold sm:gap-3 ${
                    row.type === "item" && row.indent ? "pl-6" : ""
                  }`}
                >
                  <span className="inline-flex shrink-0 flex-col gap-0.5 border-r border-[var(--border-subtle)] pr-2">
                    <button
                      type="button"
                      disabled={!canMoveUp}
                      aria-label={`Move ${c.name} up`}
                      title="Move up"
                      onClick={() => moveCategory(c.id, "up")}
                      className="rounded px-1 py-0.5 text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] disabled:pointer-events-none disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={!canMoveDown}
                      aria-label={`Move ${c.name} down`}
                      title="Move down"
                      onClick={() => moveCategory(c.id, "down")}
                      className="rounded px-1 py-0.5 text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] disabled:pointer-events-none disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </span>
                  <span
                    className="inline-block h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  {isGroup ? (
                    <span className="text-[var(--foreground)]">{c.name}</span>
                  ) : (
                    c.name
                  )}
                  {isGroup ? (
                    <span className="rounded bg-[var(--surface-hover)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                      Group
                    </span>
                  ) : null}
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      c.kind === "income"
                        ? "bg-[color-mix(in_srgb,var(--positive)_18%,transparent)] text-positive"
                        : "bg-[var(--surface-hover)] text-[var(--muted)]"
                    }`}
                  >
                    {c.kind}
                  </span>
                </span>
                <div className="flex gap-3 text-sm">
                  {isGroup ? (
                    <button
                      type="button"
                      className="text-[var(--accent)] hover:underline"
                      onClick={() => {
                        setEditingId(null);
                        setName("");
                        setColor(c.color);
                        setKind(c.kind);
                        setParentId(c.id);
                      }}
                    >
                      Add sub
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="text-[var(--accent)] hover:underline"
                    onClick={() => {
                      setEditingId(c.id);
                      setName(c.name);
                      setColor(c.color);
                      setKind(c.kind);
                      setParentId(c.parentId ?? "");
                    }}
                  >
                    {isGroup ? "Edit group" : "Edit"}
                  </button>
                  <button
                    type="button"
                    className="text-negative hover:underline"
                    onClick={() => deleteCategory(c.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
