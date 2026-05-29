"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { addDays, format } from "date-fns";
import { CalendarClock, CheckCircle2, ChevronRight, Sparkles, SkipForward } from "lucide-react";
import { nanoid } from "nanoid";
import { AccountWalletList } from "@/components/fintech/account-wallet-list";
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
  SUGGESTED_ACCOUNTS,
  SUGGESTED_CATEGORIES,
  SUGGESTED_GOALS,
  type RecurringTemplate,
} from "@/lib/onboarding/defaults";
import { CURRENCY_OPTIONS } from "@/lib/currency/exchange-rates";
import { useTranslations } from "@/components/providers/i18n-provider";
import { useAppDataStore } from "@/store/useAppDataStore";
import type { AppAccount, AppCategory, AppGoal, CurrencyCode } from "@/types/app-settings";
import { cn } from "@/lib/utils";

const STEP_COUNT = ONBOARDING_STEP_LABELS.length;

export function OnboardingFlow() {
  const router = useRouter();
  const { user } = useAuth();
  const { isLight } = useShellTheme();
  const { t } = useTranslations();

  const onboardingProgress = useAppDataStore((s) => s.onboardingProgress);
  const setOnboardingProgress = useAppDataStore((s) => s.setOnboardingProgress);
  const setAccounts = useAppDataStore((s) => s.setAccounts);
  const setCategories = useAppDataStore((s) => s.setCategories);
  const setRecurring = useAppDataStore((s) => s.setRecurring);
  const addGoal = useAppDataStore((s) => s.addGoal);
  const addCategory = useAppDataStore((s) => s.addCategory);
  const loadDemoData = useAppDataStore((s) => s.loadDemoData);
  const completeOnboarding = useAppDataStore((s) => s.completeOnboarding);
  const setProfile = useAppDataStore((s) => s.setProfile);
  const preferences = useAppDataStore((s) => s.preferences);
  const setPreferences = useAppDataStore((s) => s.setPreferences);

  const step = onboardingProgress.step;
  const skippedSteps = onboardingProgress.skippedSteps;

  const [draftAccounts, setDraftAccounts] = useState<AppAccount[]>([]);
  const [draftCategories, setDraftCategories] = useState<AppCategory[]>([]);
  const [recurringTemplates, setRecurringTemplates] = useState<RecurringTemplate[]>([]);
  const [draftGoals, setDraftGoals] = useState<Omit<AppGoal, "id">[]>([]);
  const [paycheckAmount, setPaycheckAmount] = useState(1825);
  const [paycheckDate, setPaycheckDate] = useState(format(addDays(new Date(), 14), "yyyy-MM-dd"));

  useEffect(() => {
    if (draftAccounts.length === 0) {
      setDraftAccounts(
        SUGGESTED_ACCOUNTS.filter((a) => !a.hidden).map((a) => ({ ...a, id: nanoid() }))
      );
    }
  }, [draftAccounts.length]);

  useEffect(() => {
    setRecurringTemplates(buildRecurringTemplates(paycheckAmount, paycheckDate));
  }, [paycheckAmount, paycheckDate]);

  const progressPct = useMemo(() => ((step + 1) / STEP_COUNT) * 100, [step]);

  const goTo = (next: number) => {
    setOnboardingProgress({ step: next });
    toast.message("Progress saved — pick up anytime", { duration: 2000 });
  };

  const skipStep = () => {
    const next = Math.min(step + 1, STEP_COUNT - 1);
    setOnboardingProgress({
      step: next,
      skippedSteps: skippedSteps.includes(step) ? skippedSteps : [...skippedSteps, step],
    });
  };

  const applyAccounts = () => {
    const visible = draftAccounts.filter((a) => !a.hidden);
    if (visible.length === 0) {
      toast.error("Add at least one wallet to continue");
      return false;
    }
    setAccounts(visible);
    return true;
  };

  const applyCategories = () => {
    if (draftCategories.length === 0) {
      for (const c of SUGGESTED_CATEGORIES) {
        addCategory(c);
      }
    } else {
      setCategories(draftCategories);
    }
    return true;
  };

  const applyRecurring = () => {
    const enabled = recurringTemplates.filter((t) => t.enabled);
    setRecurring(
      enabled.map((t) => ({
        id: `rec-${t.id}`,
        name: t.name,
        amount: t.amount,
        cadence: t.cadence as "bi-weekly" | "monthly" | "weekly",
        nextDate: t.id === "payroll" ? paycheckDate : format(addDays(new Date(), 7), "yyyy-MM-dd"),
      }))
    );
  };

  const applyGoals = () => {
    for (const g of draftGoals) {
      addGoal(g);
    }
  };

  const finishOnboarding = async (withDemo: boolean) => {
    if (withDemo) {
      loadDemoData();
    } else {
      if (!skippedSteps.includes(1)) {
        applyAccounts();
      } else if (useAppDataStore.getState().accounts.length === 0) {
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
      }
      if (!skippedSteps.includes(2)) {
        if (draftCategories.length > 0) setCategories(draftCategories);
        else applyCategories();
      }
      if (!skippedSteps.includes(3)) applyRecurring();
      if (!skippedSteps.includes(4)) applyGoals();
    }
    completeOnboarding();
    setOnboardingProgress({ step: 0, skippedSteps: [] });
    if (user) setProfile({ name: user.name, email: user.email });
    await fetch("/api/auth/session", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboarded: true }),
    });
    toast.success(withDemo ? "Demo loaded — explore freely" : "You're ready to plan");
    router.push("/dashboard");
  };

  const addSuggestedCategory = () => {
    const template = SUGGESTED_CATEGORIES.find(
      (c) => !draftCategories.some((d) => d.name === c.name)
    );
    if (!template) return;
    setDraftCategories((prev) => [...prev, { ...template, id: nanoid() }]);
  };

  return (
    <PageFrame title="Set up Paycheck Planner">
      <ShellCard className="overflow-hidden">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
          <span>
            Step {step + 1} of {STEP_COUNT} · {ONBOARDING_STEP_LABELS[step]}
          </span>
          <button type="button" className="inline-flex items-center gap-1 hover:text-sky-300" onClick={skipStep}>
            <SkipForward className="h-3 w-3" />
            {t("common.skip")}
          </button>
        </div>
        <div className="mb-6 h-2 rounded-full bg-slate-700/40">
          <motion.div
            className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-emerald-400"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.35 }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25 }}
          >
            {step === 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-sky-500/20 p-3">
                    <CalendarClock className="h-6 w-6 text-sky-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{t("onboarding.welcomeTitle")}</h2>
                    <p className="text-sm text-slate-400">{t("onboarding.welcomeSubtitle")}</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>· Wallets you actually use (remove our suggestions freely)</li>
                  <li>· Budget categories you care about</li>
                  <li>· Bi-weekly paycheck + bill templates</li>
                  <li>· Optional savings goals</li>
                </ul>
                <div className="grid max-w-xs gap-1 text-left">
                  <FieldLabel htmlFor="onboard-currency">{t("onboarding.primaryCurrency")}</FieldLabel>
                  <ShellSelect
                    id="onboard-currency"
                    value={preferences.currency}
                    onChange={(e) => {
                      setPreferences({ currency: e.target.value as CurrencyCode });
                      toast.success("Primary currency set");
                    }}
                  >
                    {CURRENCY_OPTIONS.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </ShellSelect>
                </div>
                <PrimaryButton onClick={() => goTo(1)}>
                  {t("onboarding.startSetup")}
                  <ChevronRight className="ml-1 inline h-4 w-4" />
                </PrimaryButton>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="space-y-4">
                <p className="text-sm font-medium text-slate-200">{t("onboarding.walletsTitle")}</p>
                <p className="text-sm text-slate-400">{t("onboarding.walletsHint")}</p>
                <AccountWalletList
                  accounts={draftAccounts}
                  onChange={setDraftAccounts}
                  showHidden
                  allowReorder
                  compact
                />
                <div className="flex flex-wrap gap-2">
                  <GhostButton onClick={() => goTo(0)}>{t("common.back")}</GhostButton>
                  <PrimaryButton
                    onClick={() => {
                      if (applyAccounts()) goTo(2);
                    }}
                  >
                    {t("common.continue")}
                  </PrimaryButton>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-400">
                  Starter categories for needs and wants — edit amounts or skip to use defaults later.
                </p>
                <div className="flex flex-wrap gap-2">
                  {draftCategories.length === 0
                    ? SUGGESTED_CATEGORIES.map((c) => (
                        <span key={c.name} className="rounded-full border border-slate-600 px-3 py-1 text-xs">
                          {c.name} · ${c.budgeted}
                        </span>
                      ))
                    : draftCategories.map((c) => (
                        <span
                          key={c.id}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-600 px-3 py-1 text-xs"
                        >
                          {c.name}
                          <button
                            type="button"
                            className="text-slate-500 hover:text-rose-400"
                            onClick={() => setDraftCategories((prev) => prev.filter((x) => x.id !== c.id))}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                </div>
                <GhostButton onClick={addSuggestedCategory}>Add suggested category</GhostButton>
                <PrimaryButton
                  className="ml-2"
                  onClick={() => {
                    if (draftCategories.length === 0) {
                      setDraftCategories(SUGGESTED_CATEGORIES.map((c) => ({ ...c, id: nanoid() })));
                    }
                  }}
                >
                  Use all suggested
                </PrimaryButton>
                <div className="flex flex-wrap gap-2 pt-2">
                  <GhostButton onClick={() => goTo(1)}>Back</GhostButton>
                  <PrimaryButton
                    onClick={() => {
                      if (draftCategories.length === 0) {
                        setCategories(SUGGESTED_CATEGORIES.map((c) => ({ ...c, id: nanoid() })));
                      } else {
                        setCategories(draftCategories);
                      }
                      goTo(3);
                    }}
                  >
                    Continue
                  </PrimaryButton>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-400">Toggle templates that match your life — bi-weekly pay is on by default.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1">
                    <FieldLabel>Bi-weekly paycheck</FieldLabel>
                    <NumberField value={paycheckAmount} onChange={setPaycheckAmount} aria-label="Paycheck amount" />
                  </label>
                  <label className="grid gap-1">
                    <FieldLabel>Next pay date</FieldLabel>
                    <ShellInput type="date" value={paycheckDate} onChange={(e) => setPaycheckDate(e.target.value)} />
                  </label>
                </div>
                <ul className="space-y-2">
                  {recurringTemplates.map((t) => (
                    <li
                      key={t.id}
                      className={cn(
                        "flex items-center justify-between rounded-xl border px-3 py-2 text-sm",
                        isLight ? "border-slate-200" : "border-slate-700",
                        t.enabled && "border-sky-500/40 bg-sky-500/5"
                      )}
                    >
                      <div>
                        <p className="font-medium">{t.name}</p>
                        <p className="text-xs text-slate-400">{t.description}</p>
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
                        ${t.amount} · {t.cadence}
                      </label>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2">
                  <GhostButton onClick={() => goTo(2)}>Back</GhostButton>
                  <PrimaryButton onClick={() => goTo(4)}>Continue</PrimaryButton>
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-400">Optional — add a savings goal or skip to finish.</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_GOALS.map((g) => (
                    <button
                      key={g.name}
                      type="button"
                      className="rounded-xl border border-slate-600 px-3 py-2 text-left text-sm hover:border-sky-500/50"
                      onClick={() =>
                        setDraftGoals((prev) =>
                          prev.some((x) => x.name === g.name) ? prev : [...prev, { ...g, current: 0 }]
                        )
                      }
                    >
                      <p className="font-medium">{g.name}</p>
                      <p className="text-xs text-slate-400">Target ${g.target}</p>
                    </button>
                  ))}
                </div>
                {draftGoals.length > 0 ? (
                  <p className="text-xs text-emerald-400">{draftGoals.length} goal(s) selected</p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <GhostButton onClick={() => goTo(3)}>Back</GhostButton>
                  <GhostButton onClick={() => goTo(5)}>Skip goals</GhostButton>
                  <PrimaryButton onClick={() => goTo(5)}>Continue</PrimaryButton>
                </div>
              </div>
            ) : null}

            {step === 5 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="text-lg font-semibold">{t("onboarding.finishTitle")}</p>
                </div>
                <p className="text-sm text-slate-400">
                  Open your dashboard or load our realistic bi-weekly demo (Premium unlocked in demo).
                </p>
                <div className="flex flex-wrap gap-2">
                  <PrimaryButton onClick={() => void finishOnboarding(false)}>{t("common.continue")}</PrimaryButton>
                  <GhostButton onClick={() => void finishOnboarding(true)}>
                    <Sparkles className="mr-1 inline h-4 w-4" />
                    {t("onboarding.finishDemo")}
                  </GhostButton>
                </div>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </ShellCard>
    </PageFrame>
  );
}
