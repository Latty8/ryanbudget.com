"use client";

import { addDays, format, parseISO } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarClock,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { NumberField } from "@/components/fintech/number-field";
import { SetupOnboardingLink } from "@/components/fintech/setup-onboarding-link";
import {
  CADENCE_META,
  isIncomeRecurring,
} from "@/lib/recurring/cadence-display";
import { useConfirm } from "@/components/providers/confirm-dialog-provider";
import {
  EmptyState,
  FieldLabel,
  fintechDivide,
  fintechForeground,
  fintechLabel,
  fintechLink,
  fintechMuted,
  fintechSurface,
  GhostButton,
  ModalOverlay,
  MotionSection,
  PageFrame,
  PrimaryButton,
  ShellInput,
  ShellSelect,
} from "@/components/fintech/ui";
import { cn } from "@/lib/utils";
import { formatMoney, useAppDataStore } from "@/store/useAppDataStore";
import type { AppRecurringRule } from "@/types/app-settings";
import type { RecurringFrequency } from "@/types/finance";

function CadenceBadge({ cadence }: { cadence: RecurringFrequency }) {
  const meta = CADENCE_META[cadence];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        meta.biweekly
          ? "bg-[var(--accent-muted)] text-[var(--accent-deep)] ring-1 ring-[var(--accent)]/25"
          : "bg-[var(--surface-elevated)] text-[var(--muted)]"
      )}
    >
      {meta.biweekly ? <RefreshCw className="h-3 w-3" strokeWidth={2} /> : null}
      {meta.label}
    </span>
  );
}

const emptyForm = (): Omit<AppRecurringRule, "id"> => ({
  name: "",
  amount: 0,
  cadence: "bi-weekly",
  nextDate: format(addDays(new Date(), 7), "yyyy-MM-dd"),
  paused: false,
});

export function RecurringMinimalView() {
  const confirm = useConfirm();
  const recurring = useAppDataStore((s) => s.demoRecurring);
  const addRecurring = useAppDataStore((s) => s.addRecurring);
  const updateRecurring = useAppDataStore((s) => s.updateRecurring);
  const deleteRecurring = useAppDataStore((s) => s.deleteRecurring);
  const toggleRecurringPaused = useAppDataStore((s) => s.toggleRecurringPaused);
  const currency = useAppDataStore((s) => s.preferences.currency);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const sorted = useMemo(
    () =>
      [...recurring].sort((a, b) => {
        if (a.paused !== b.paused) return a.paused ? 1 : -1;
        return a.nextDate.localeCompare(b.nextDate);
      }),
    [recurring]
  );

  const activeCount = recurring.filter((r) => !r.paused).length;

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (rule: AppRecurringRule) => {
    setEditingId(rule.id);
    setForm({
      name: rule.name,
      amount: rule.amount,
      cadence: rule.cadence,
      nextDate: rule.nextDate,
      paused: rule.paused,
    });
    setModalOpen(true);
  };

  const saveRule = () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (form.amount <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }
    if (editingId) {
      updateRecurring(editingId, form);
      toast.success("Recurring item updated");
    } else {
      addRecurring(form);
      toast.success("Recurring item added");
    }
    setModalOpen(false);
  };

  const handleDelete = (rule: AppRecurringRule) => {
    void confirm({
      title: `Delete "${rule.name}"?`,
      description: "This recurring rule will be removed. Past transactions are not affected.",
      warning: "This cannot be undone.",
      confirmLabel: "Delete",
      variant: "destructive",
      onConfirm: () => {
        deleteRecurring(rule.id);
        toast.success("Deleted");
      },
    });
  };

  const handlePause = (rule: AppRecurringRule) => {
    if (rule.paused) {
      toggleRecurringPaused(rule.id);
      toast.success("Resumed");
      return;
    }
    void confirm({
      title: `Pause "${rule.name}"?`,
      description: "It will stay in your list but won't appear in upcoming paycheck planning.",
      confirmLabel: "Pause",
      onConfirm: () => {
        toggleRecurringPaused(rule.id);
        toast.success("Paused");
      },
    });
  };

  if (recurring.length === 0) {
    return (
      <PageFrame
        title="Recurring"
        description="Paycheck, rent, and bills — set once, track every cycle."
      >
        <EmptyState
          icon={CalendarClock}
          title="No recurring items yet"
          description="Start with your bi-weekly paycheck, then add rent and subscriptions."
          action={
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <PrimaryButton type="button" onClick={openCreate}>
                <Plus className="mr-1.5 inline h-4 w-4" />
                Add recurring
              </PrimaryButton>
              <SetupOnboardingLink className={cn("text-sm font-medium", fintechLink)}>
                Or use quick setup
              </SetupOnboardingLink>
            </div>
          }
        />
        <ModalOverlay open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit recurring" : "New recurring"}>
          <RecurringForm form={form} setForm={setForm} onSave={saveRule} onCancel={() => setModalOpen(false)} />
        </ModalOverlay>
      </PageFrame>
    );
  }

  return (
    <PageFrame
      title="Recurring"
      description="Paycheck, rent, and bills — set once, track every cycle."
    >
      <MotionSection className="flex flex-wrap items-center justify-between gap-4">
        <p className={cn("text-sm", fintechMuted)}>
          <span className="font-semibold text-[var(--foreground)]">{activeCount}</span> active
          {recurring.length > activeCount ? ` · ${recurring.length - activeCount} paused` : null}
        </p>
        <PrimaryButton type="button" onClick={openCreate}>
          <Plus className="mr-1.5 inline h-4 w-4" />
          Add
        </PrimaryButton>
      </MotionSection>

      <MotionSection delay={0.05} className="mt-6">
        <ul className={cn(fintechSurface, fintechDivide, "divide-y overflow-hidden")}>
          <AnimatePresence initial={false}>
            {sorted.map((rule) => {
              const income = isIncomeRecurring(rule.name);
              return (
                <motion.li
                  key={rule.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    "group px-5 py-4 transition-colors duration-200 hover:bg-[var(--surface-hover)]",
                    rule.paused && "opacity-60"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={cn("font-semibold", fintechForeground)}>{rule.name}</p>
                        <CadenceBadge cadence={rule.cadence} />
                        {rule.paused ? (
                          <span className="rounded-full bg-[var(--surface-elevated)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted)]">
                            Paused
                          </span>
                        ) : null}
                      </div>
                      <p className={cn("mt-1.5 text-xs", fintechMuted)}>
                        Next{" "}
                        <span className="font-medium text-[var(--foreground)]">
                          {format(parseISO(rule.nextDate), "EEEE, MMM d")}
                        </span>
                      </p>
                    </div>
                    <p
                      className={cn(
                        "shrink-0 text-base font-semibold tabular-nums",
                        income ? "text-[var(--positive)]" : fintechForeground
                      )}
                    >
                      {income ? "+" : "−"}
                      {formatMoney(Math.abs(rule.amount), currency)}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                    <GhostButton
                      type="button"
                      className="!min-h-0 !px-3 !py-2 !text-xs"
                      onClick={() => openEdit(rule)}
                      aria-label={`Edit ${rule.name}`}
                    >
                      <Pencil className="mr-1 inline h-3.5 w-3.5" />
                      Edit
                    </GhostButton>
                    <GhostButton
                      type="button"
                      className="!min-h-0 !px-3 !py-2 !text-xs"
                      onClick={() => handlePause(rule)}
                    >
                      {rule.paused ? (
                        <>
                          <Play className="mr-1 inline h-3.5 w-3.5" />
                          Resume
                        </>
                      ) : (
                        <>
                          <Pause className="mr-1 inline h-3.5 w-3.5" />
                          Pause
                        </>
                      )}
                    </GhostButton>
                    <GhostButton
                      type="button"
                      className="!min-h-0 !px-3 !py-2 !text-xs text-rose-400 hover:border-rose-500/30 hover:text-rose-400"
                      onClick={() => handleDelete(rule)}
                    >
                      <Trash2 className="mr-1 inline h-3.5 w-3.5" />
                      Delete
                    </GhostButton>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      </MotionSection>

      <ModalOverlay
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit recurring" : "New recurring"}
      >
        <RecurringForm form={form} setForm={setForm} onSave={saveRule} onCancel={() => setModalOpen(false)} />
      </ModalOverlay>
    </PageFrame>
  );
}

function RecurringForm({
  form,
  setForm,
  onSave,
  onCancel,
}: {
  form: Omit<AppRecurringRule, "id">;
  setForm: React.Dispatch<React.SetStateAction<Omit<AppRecurringRule, "id">>>;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="grid gap-4">
      <label className="grid gap-1.5">
        <FieldLabel>Name</FieldLabel>
        <ShellInput
          placeholder="e.g. Bi-weekly paycheck"
          value={form.name}
          onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
        />
      </label>
      <label className="grid gap-1.5">
        <FieldLabel>Amount</FieldLabel>
        <NumberField
          value={form.amount}
          onChange={(amount) => setForm((s) => ({ ...s, amount }))}
          aria-label="Recurring amount"
        />
      </label>
      <label className="grid gap-1.5">
        <FieldLabel>Frequency</FieldLabel>
        <ShellSelect
          value={form.cadence}
          onChange={(e) => setForm((s) => ({ ...s, cadence: e.target.value as RecurringFrequency }))}
        >
          <option value="bi-weekly">Every 2 weeks (bi-weekly)</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </ShellSelect>
        {form.cadence === "bi-weekly" ? (
          <p className={cn(fintechLabel, "normal-case tracking-normal")}>
            Perfect for most U.S. paychecks
          </p>
        ) : null}
      </label>
      <label className="grid gap-1.5">
        <FieldLabel>Next occurrence</FieldLabel>
        <ShellInput
          type="date"
          value={form.nextDate}
          onChange={(e) => setForm((s) => ({ ...s, nextDate: e.target.value }))}
        />
      </label>
      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <GhostButton type="button" onClick={onCancel}>
          Cancel
        </GhostButton>
        <PrimaryButton type="button" onClick={onSave}>
          Save
        </PrimaryButton>
      </div>
    </div>
  );
}
