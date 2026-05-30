"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { addDays, format } from "date-fns";
import { CalendarClock, CheckCircle2, ChevronRight, Sparkles, SkipForward } from "lucide-react";
import { nanoid } from "nanoid";
import { NumberField } from "@/components/fintech/number-field";
import {
  FieldLabel,
  GhostButton,
  PageFrame,
  PrimaryButton,
  ShellCard,
  ShellInput,
  ShellSelect,
  useShellTheme,
} from "@/components/fintech/ui";
import { useAuth } from "@/components/providers/auth-provider";
import {
  buildRecurringTemplates,
  ONBOARDING_STEP_LABELS,
  SUGGESTED_CATEGORIES,
  type RecurringTemplate,
} from "@/lib/onboarding/defaults";
import { CURRENCY_OPTIONS } from "@/lib/currency/exchange-rates";
import { useTranslations } from "@/components/providers/i18n-provider";
import { useAppDataStore } from "@/store/useAppDataStore";
import type { CurrencyCode } from "@/types/app-settings";
import { cn } from "@/lib/utils";

const STEP_COUNT = ONBOARDING_STEP_LABELS.length;

export function OnboardingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { isLight } = useShellTheme();
  const { t } = useTranslations();

  const onboardingProgress = useAppDataStore((s) => s.onboardingProgress);
  const restartOnboarding = useAppDataStore((s) => s.restartOnboarding);
  const setOnboardingProgress = useAppDataStore((s) => s.setOnboardingProgress);
  const setAccounts = useAppDataStore((s) => s.setAccounts);
  const setCategories = useAppDataStore((s) => s.setCategories);
  const setRecurring = useAppDataStore((s) => s.setRecurring);
  const loadDemoData = useAppDataStore((s) => s.loadDemoData);
  const completeOnboarding = useAppDataStore((s) => s.completeOnboarding);
  const setProfile = useAppDataStore((s) => s.setProfile);
  const preferences = useAppDataStore((s) => s.preferences);
  const setPreferences = useAppDataStore((s) => s.setPreferences);

  const step = onboardingProgress.step;
  const skippedSteps = onboardingProgress.skippedSteps;

  const [paycheckAmount, setPaycheckAmount] = useState(1825);
  const [paycheckDate, setPaycheckDate] = useState(format(addDays(new Date(), 14), "yyyy-MM-dd"));
  const [recurringTemplates, setRecurringTemplates] = useState<RecurringTemplate[]>([]);

  useEffect(() => {
    if (searchParams.get("setup") === "1") {
      restartOnboarding();
    }
  }, [searchParams, restartOnboarding]);

  useEffect(() => {
    setRecurringTemplates(buildRecurringTemplates(paycheckAmount, paycheckDate));
  }, [paycheckAmount, paycheckDate]);

  const progressPct = useMemo(() => ((step + 1) / STEP_COUNT) * 100, [step]);

  const goTo = (next: number) => {
    setOnboardingProgress({ step: next });
  };

  const skipStep = () => {
    const next = Math.min(step + 1, STEP_COUNT - 1);
    setOnboardingProgress({
      step: next,
      skippedSteps: skippedSteps.includes(step) ? skippedSteps : [...skippedSteps, step],
    });
  };

  const applyPaycheckStep = () => {
    setAccounts([
      {
        id: nanoid(),
        name: "Main Checking",
        kind: "checking",
        balance: 0,
        color: "#38bdf8",
        icon: "Wallet",
      },
    ]);
    setCategories(SUGGESTED_CATEGORIES.map((c) => ({ ...c, id: nanoid() })));
    setRecurring([
      {
        id: "rec-payroll",
        name: "Payroll",
        amount: paycheckAmount,
        cadence: "bi-weekly",
        nextDate: paycheckDate,
      },
    ]);
  };

  const applyBillsStep = () => {
    const enabled = recurringTemplates.filter((t) => t.enabled && t.id !== "payroll");
    const payroll = {
      id: "rec-payroll",
      name: "Payroll",
      amount: paycheckAmount,
      cadence: "bi-weekly" as const,
      nextDate: paycheckDate,
    };
    setRecurring([
      payroll,
      ...enabled.map((t) => ({
        id: `rec-${t.id}`,
        name: t.name,
        amount: t.amount,
        cadence: t.cadence as "bi-weekly" | "monthly" | "weekly",
        nextDate: format(addDays(new Date(), 7), "yyyy-MM-dd"),
      })),
    ]);
  };

  const finishOnboarding = async (withDemo: boolean) => {
    if (withDemo) {
      loadDemoData();
    } else {
      if (!skippedSteps.includes(1)) applyPaycheckStep();
      if (!skippedSteps.includes(2)) applyBillsStep();
      if (useAppDataStore.getState().accounts.length === 0) applyPaycheckStep();
      if (useAppDataStore.getState().categories.length === 0) {
        setCategories(SUGGESTED_CATEGORIES.map((c) => ({ ...c, id: nanoid() })));
      }
    }
    completeOnboarding();
    setOnboardingProgress({ step: 0, skippedSteps: [] });
    if (user) setProfile({ name: user.name, email: user.email });
    await fetch("/api/auth/session", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboarded: true }),
    });
    toast.success(withDemo ? "Demo loaded" : "You're ready — tap + to log spending");
    router.push("/dashboard");
  };

  return (
    <PageFrame title="Quick setup">
      <p className="mb-4 text-sm text-[var(--muted)]">About 2 minutes — paycheck, bills, done.</p>
      <ShellCard className="overflow-hidden p-6 md:p-8">
        <div className="mb-2 flex items-center justify-between text-xs text-[var(--muted)]">
          <span>
            Step {step + 1} of {STEP_COUNT} · {ONBOARDING_STEP_LABELS[step]}
          </span>
          <button type="button" className="inline-flex items-center gap-1 hover:text-sky-500" onClick={skipStep}>
            <SkipForward className="h-3 w-3" />
            Skip step
          </button>
        </div>
        <div className="mb-8 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700">
          <motion.div
            className="h-1.5 rounded-full bg-sky-500"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.35 }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {step === 0 ? (
              <>
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-sky-100 p-3 dark:bg-sky-500/20">
                    <CalendarClock className="h-7 w-7 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Plan around your paycheck</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      We&apos;ll learn your pay schedule and main bills so you always know what&apos;s safe to spend.
                    </p>
                  </div>
                </div>
                <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-600 dark:text-slate-300">
                  <li>Add your bi-weekly paycheck</li>
                  <li>Turn on the bills you pay every month</li>
                  <li>See &quot;safe to spend&quot; on your dashboard</li>
                </ol>
                <div className="max-w-xs">
                  <FieldLabel htmlFor="onboard-currency">Currency</FieldLabel>
                  <ShellSelect
                    id="onboard-currency"
                    value={preferences.currency}
                    onChange={(e) => setPreferences({ currency: e.target.value as CurrencyCode })}
                  >
                    {CURRENCY_OPTIONS.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </ShellSelect>
                </div>
                <PrimaryButton onClick={() => goTo(1)}>
                  Get started
                  <ChevronRight className="ml-1 inline h-4 w-4" />
                </PrimaryButton>
              </>
            ) : null}

            {step === 1 ? (
              <>
                <h2 className="text-lg font-semibold">Your paycheck</h2>
                <p className="text-sm text-slate-500">
                  Most people here are paid every two weeks. You can change this later.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1">
                    <FieldLabel>Amount per paycheck (after tax)</FieldLabel>
                    <NumberField value={paycheckAmount} onChange={setPaycheckAmount} aria-label="Paycheck amount" />
                  </label>
                  <label className="grid gap-1">
                    <FieldLabel>Next pay date</FieldLabel>
                    <ShellInput type="date" value={paycheckDate} onChange={(e) => setPaycheckDate(e.target.value)} />
                  </label>
                </div>
                <div className="flex gap-2">
                  <GhostButton onClick={() => goTo(0)}>Back</GhostButton>
                  <PrimaryButton
                    onClick={() => {
                      applyPaycheckStep();
                      goTo(2);
                    }}
                  >
                    Continue
                  </PrimaryButton>
                </div>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <h2 className="text-lg font-semibold">Main bills</h2>
                <p className="text-sm text-slate-500">Toggle what you pay regularly — we&apos;ll remind you before payday.</p>
                <ul className="space-y-2">
                  {recurringTemplates
                    .filter((t) => t.id !== "payroll")
                    .map((t) => (
                      <li
                        key={t.id}
                        className={cn(
                          "flex items-center justify-between rounded-xl border px-4 py-3 text-sm",
                          isLight ? "border-slate-200" : "border-slate-700",
                          t.enabled && "border-sky-300 bg-sky-50/50 dark:border-sky-700 dark:bg-sky-950/20"
                        )}
                      >
                        <div>
                          <p className="font-medium">{t.name}</p>
                          <p className="text-xs text-slate-500">{t.description}</p>
                        </div>
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={t.enabled}
                            onChange={(e) =>
                              setRecurringTemplates((prev) =>
                                prev.map((row) => (row.id === t.id ? { ...row, enabled: e.target.checked } : row))
                              )
                            }
                          />
                          ${t.amount}
                        </label>
                      </li>
                    ))}
                </ul>
                <div className="flex gap-2">
                  <GhostButton onClick={() => goTo(1)}>Back</GhostButton>
                  <PrimaryButton
                    onClick={() => {
                      applyBillsStep();
                      goTo(3);
                    }}
                  >
                    Continue
                  </PrimaryButton>
                </div>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                  <h2 className="text-lg font-semibold">You&apos;re set</h2>
                </div>
                <p className="text-sm text-slate-500">
                  Your dashboard shows safe-to-spend. Use the + button anytime to log a purchase.
                </p>
                <div className="flex flex-wrap gap-2">
                  <PrimaryButton onClick={() => void finishOnboarding(false)}>Open dashboard</PrimaryButton>
                  <GhostButton onClick={() => void finishOnboarding(true)}>
                    <Sparkles className="mr-1 inline h-4 w-4" />
                    Try demo data instead
                  </GhostButton>
                </div>
              </>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </ShellCard>
    </PageFrame>
  );
}
