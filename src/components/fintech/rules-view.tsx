"use client";

import { useState } from "react";
import { Plus, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import {
  EmptyState,
  FieldLabel,
  GhostButton,
  ModalOverlay,
  PageFrame,
  PrimaryButton,
  ShellCard,
  ShellInput,
  ShellSelect,
  fintechForeground,
  fintechMuted,
  fintechSurface,
} from "@/components/fintech/ui";
import { useConfirm } from "@/components/providers/confirm-dialog-provider";
import { logActivity } from "@/store/useActivityLogStore";
import { useTransactionRulesStore } from "@/store/useTransactionRulesStore";
import { useAppDataStore } from "@/store/useAppDataStore";
import type { TransactionRule } from "@/types/transaction-rules";
import { cn } from "@/lib/utils";

const emptyRule = (): Omit<TransactionRule, "id" | "priority"> => ({
  name: "",
  enabled: true,
  merchantContains: [],
  categoryName: "",
});

export function RulesView() {
  const confirm = useConfirm();
  const categories = useAppDataStore((s) => s.categories);
  const rules = useTransactionRulesStore((s) => s.rules);
  const addRule = useTransactionRulesStore((s) => s.addRule);
  const updateRule = useTransactionRulesStore((s) => s.updateRule);
  const deleteRule = useTransactionRulesStore((s) => s.deleteRule);
  const toggleRule = useTransactionRulesStore((s) => s.toggleRule);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyRule);
  const [termsText, setTermsText] = useState("");

  const sorted = [...rules].sort((a, b) => a.priority - b.priority);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyRule());
    setTermsText("");
    setOpen(true);
  };

  const openEdit = (rule: TransactionRule) => {
    setEditingId(rule.id);
    setForm({
      name: rule.name,
      enabled: rule.enabled,
      merchantContains: rule.merchantContains,
      categoryName: rule.categoryName,
    });
    setTermsText(rule.merchantContains.join(", "));
    setOpen(true);
  };

  const save = () => {
    const merchantContains = termsText
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!merchantContains.length || !form.categoryName) {
      toast.error("Add at least one keyword and a category");
      return;
    }
    const name = form.name.trim() || `Rule → ${form.categoryName}`;
    const payload = { ...form, name, merchantContains };
    if (editingId) {
      updateRule(editingId, payload);
      logActivity("updated", "rule", name);
      toast.success("Rule updated");
    } else {
      addRule(payload);
      logActivity("created", "rule", name);
      toast.success("Rule created");
    }
    setOpen(false);
  };

  return (
    <PageFrame
      title="Rules"
      description="Auto-categorize new transactions when the description matches your keywords."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={cn("text-sm", fintechMuted)}>
          Rules run automatically when you add transactions (first match wins).
        </p>
        <PrimaryButton onClick={openCreate}>
          <Plus className="mr-1 inline h-4 w-4" />
          New rule
        </PrimaryButton>
      </div>

      {sorted.length === 0 ? (
        <ShellCard className="mt-4 p-0">
          <EmptyState
            icon={Wand2}
            title="No rules yet"
            description='Example: if description contains "Starbucks" or "Coffee" → Dining Out.'
            action={<PrimaryButton onClick={openCreate}>Create your first rule</PrimaryButton>}
          />
        </ShellCard>
      ) : (
        <ul className={cn(fintechSurface, "mt-4 divide-y overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-subtle)]")}>
          {sorted.map((rule) => (
            <li key={rule.id} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className={cn("font-medium", fintechForeground)}>{rule.name}</p>
                <p className={cn("mt-1 text-sm", fintechMuted)}>
                  If contains{" "}
                  <span className="text-[var(--foreground)]">
                    {rule.merchantContains.map((t) => `"${t}"`).join(" or ")}
                  </span>{" "}
                  → {rule.categoryName}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition",
                    rule.enabled
                      ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                      : "bg-[var(--surface-elevated)] text-[var(--muted)]"
                  )}
                  onClick={() => toggleRule(rule.id)}
                >
                  {rule.enabled ? "On" : "Off"}
                </button>
                <GhostButton onClick={() => openEdit(rule)}>Edit</GhostButton>
                <GhostButton
                  onClick={() => {
                    void confirm({
                      title: `Delete "${rule.name}"?`,
                      description: "New transactions will no longer use this auto-categorization rule.",
                      confirmLabel: "Delete",
                      onConfirm: () => {
                        deleteRule(rule.id);
                        logActivity("deleted", "rule", rule.name);
                        toast.success("Rule deleted");
                      },
                    });
                  }}
                >
                  <Trash2 className="h-4 w-4 text-rose-400" />
                </GhostButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ModalOverlay open={open} onClose={() => setOpen(false)} title={editingId ? "Edit rule" : "New rule"}>
        <div className="grid gap-3">
          <label className="grid gap-1">
            <FieldLabel>Rule name (optional)</FieldLabel>
            <ShellInput value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
          </label>
          <label className="grid gap-1">
            <FieldLabel>If description contains</FieldLabel>
            <ShellInput
              value={termsText}
              onChange={(e) => setTermsText(e.target.value)}
              placeholder="Starbucks, Coffee, SBUX"
            />
            <span className={cn("text-xs", fintechMuted)}>Separate keywords with commas</span>
          </label>
          <label className="grid gap-1">
            <FieldLabel>Then categorize as</FieldLabel>
            <ShellSelect
              value={form.categoryName}
              onChange={(e) => setForm((s) => ({ ...s, categoryName: e.target.value }))}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </ShellSelect>
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <GhostButton onClick={() => setOpen(false)}>Cancel</GhostButton>
          <PrimaryButton onClick={save}>{editingId ? "Save" : "Create"}</PrimaryButton>
        </div>
      </ModalOverlay>
    </PageFrame>
  );
}
