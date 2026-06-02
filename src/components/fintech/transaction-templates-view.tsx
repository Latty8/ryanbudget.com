"use client";

import { useState } from "react";
import { Bookmark, Plus, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";
import { NumberField } from "@/components/fintech/number-field";
import {
  EmptyState,
  FieldLabel,
  GhostButton,
  ModalOverlay,
  PageFrame,
  PrimaryButton,
  ShellInput,
  ShellSelect,
  fintechForeground,
  fintechMuted,
  fintechSurface,
} from "@/components/fintech/ui";
import { useTransactionTemplatesStore } from "@/store/useTransactionTemplatesStore";
import { formatMoney, useAppDataStore } from "@/store/useAppDataStore";
import { cn } from "@/lib/utils";

const empty = () => ({
  label: "",
  amount: 0,
  description: "",
  categoryId: "",
  accountId: "",
  tags: [],
});

export function TransactionTemplatesView({ embedded = false }: { embedded?: boolean }) {
  const templates = useTransactionTemplatesStore((s) => s.templates);
  const addTemplate = useTransactionTemplatesStore((s) => s.addTemplate);
  const deleteTemplate = useTransactionTemplatesStore((s) => s.deleteTemplate);
  const categories = useAppDataStore((s) => s.categories);
  const accounts = useAppDataStore((s) => s.accounts);
  const currency = useAppDataStore((s) => s.preferences.currency);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  const save = () => {
    if (!form.label.trim() || form.amount <= 0) {
      toast.error("Label and amount required");
      return;
    }
    addTemplate({
      ...form,
      categoryId: form.categoryId || categories[0]?.id || "",
      accountId: form.accountId || accounts[0]?.id || "",
      tags: [],
    });
    toast.success("Template saved");
    setOpen(false);
    setForm(empty());
  };

  const useTemplate = (id: string) => {
    const t = templates.find((row) => row.id === id);
    if (!t) return;
    const cat = categories.find((c) => c.id === t.categoryId);
    window.dispatchEvent(
      new CustomEvent("planner:new-transaction", {
        detail: {
          amount: t.amount,
          description: t.description || t.label,
          categoryId: cat?.name ?? t.categoryId,
          accountId: t.accountId,
        },
      })
    );
    toast.success("Template applied — review and save");
  };

  const body = (
    <>
      <div className="flex justify-end">
        <PrimaryButton type="button" onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 inline h-4 w-4" />
          New template
        </PrimaryButton>
      </div>

      {templates.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No templates yet"
          description='Create templates like "Weekly groceries" or "Gas" for faster logging.'
          action={
            <PrimaryButton type="button" onClick={() => setOpen(true)}>
              Add template
            </PrimaryButton>
          }
        />
      ) : (
        <ul className={cn(fintechSurface, "mt-6 divide-y divide-[var(--border-subtle)] overflow-hidden")}>
          {templates.map((t) => (
            <li key={t.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className={cn("font-medium", fintechForeground)}>{t.label}</p>
                <p className={cn("text-xs", fintechMuted)}>
                  {t.description || "—"} · {formatMoney(t.amount, currency)}
                </p>
              </div>
              <GhostButton type="button" className="!text-xs" onClick={() => useTemplate(t.id)}>
                <Zap className="mr-1 inline h-3.5 w-3.5" />
                Use
              </GhostButton>
              <button
                type="button"
                className="rounded-lg p-2 text-rose-400 hover:bg-rose-500/10"
                aria-label="Delete template"
                onClick={() => deleteTemplate(t.id)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ModalOverlay open={open} onClose={() => setOpen(false)} title="New template">
        <div className="grid gap-3">
          <label className="grid gap-1">
            <FieldLabel>Label</FieldLabel>
            <ShellInput
              value={form.label}
              onChange={(e) => setForm((s) => ({ ...s, label: e.target.value }))}
              placeholder="Weekly groceries"
            />
          </label>
          <label className="grid gap-1">
            <FieldLabel>Amount</FieldLabel>
            <NumberField value={form.amount} onChange={(amount) => setForm((s) => ({ ...s, amount }))} />
          </label>
          <label className="grid gap-1">
            <FieldLabel>Description</FieldLabel>
            <ShellInput
              value={form.description}
              onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
            />
          </label>
          <label className="grid gap-1">
            <FieldLabel>Category</FieldLabel>
            <ShellSelect
              value={form.categoryId}
              onChange={(e) => setForm((s) => ({ ...s, categoryId: e.target.value }))}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </ShellSelect>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <GhostButton type="button" onClick={() => setOpen(false)}>
              Cancel
            </GhostButton>
            <PrimaryButton type="button" onClick={save}>
              Save
            </PrimaryButton>
          </div>
        </div>
      </ModalOverlay>
    </>
  );

  if (embedded) return body;

  return (
    <PageFrame
      title="Quick templates"
      description="Save frequent transactions for one-tap entry."
    >
      {body}
    </PageFrame>
  );
}
