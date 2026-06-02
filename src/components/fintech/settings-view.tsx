"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Bell,
  Database,
  Download,
  Moon,
  Palette,
  Sparkles,
  Trash2,
  Upload,
  User,
  Wallet,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFintechTheme } from "@/components/fintech/theme";
import { useAuth } from "@/components/providers/auth-provider";
import { SetupOnboardingLink } from "@/components/fintech/setup-onboarding-link";
import { useConfirm } from "@/components/providers/confirm-dialog-provider";
import { useTranslations } from "@/components/providers/i18n-provider";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { usePremium } from "@/hooks/use-premium";
import {
  useBudgetPeriodPreference,
  useSetBudgetPeriodPreference,
} from "@/hooks/use-budget-view-period";
import { setClientDemoMode } from "@/lib/auth/demo-mode";
import { resetSignInClientState } from "@/lib/auth/complete-sign-in-client";
import { setPersistUserId } from "@/lib/storage/user-persist";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";
import { useReferralStore } from "@/store/useReferralStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useDeviceUiStore } from "@/store/useDeviceUiStore";
import { isFeatureEnabled } from "@/lib/feature-flags";
import {
  DangerButton,
  FieldLabel,
  GhostButton,
  fintechLink,
  fintechMuted,
  PageFrame,
  PrimaryButton,
  SectionTitle,
  ShellCard,
  ShellInput,
  ShellSelect,
} from "@/components/fintech/ui";
import {
  describeImportResult,
  downloadTextFile,
  parseJsonBundle,
  transactionsToCsv,
} from "@/lib/data/export-import";
import { pushLocalStateNow } from "@/lib/supabase/sync/client";
import { cn } from "@/lib/utils";
import { CsvImportModal } from "@/components/fintech/csv-import-modal";
import { formatMoney, useAppDataStore } from "@/store/useAppDataStore";
import { CURRENCY_OPTIONS } from "@/lib/currency/exchange-rates";
import type {
  BudgetPeriodPreference,
  BudgetViewDensity,
  CurrencyCode,
  DateFormatPreference,
  WeekStartPreference,
} from "@/types/app-settings";

type SettingsSection =
  | "profile"
  | "preferences"
  | "notifications"
  | "data"
  | "appearance"
  | "account";

const SECTIONS: {
  id: SettingsSection;
  label: string;
  icon: typeof User;
  description: string;
}[] = [
  { id: "profile", label: "Profile", icon: User, description: "Name & email" },
  { id: "preferences", label: "Preferences", icon: Wallet, description: "Currency & budget views" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Alerts & reminders" },
  { id: "data", label: "Data & export", icon: Database, description: "Backup & import" },
  { id: "appearance", label: "Appearance", icon: Palette, description: "Theme" },
  { id: "account", label: "Account", icon: Trash2, description: "Plan & session" },
];

export function SettingsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const { premium, demoMode } = usePremium();
  const confirm = useConfirm();
  const { exitDemoMode } = useDemoMode();
  const syncFromServer = useSubscriptionStore((s) => s.syncFromServer);
  const referralCode = useReferralStore((s) => s.referralCode);
  const premiumMonthsEarned = useReferralStore((s) => s.premiumMonthsEarned);
  const successfulInvites = useReferralStore((s) => s.successfulInvites);
  const { theme, setTheme } = useFintechTheme();
  const importRef = useRef<HTMLInputElement>(null);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");

  const profile = useAppDataStore((s) => s.profile);
  const { t, locale, setLocale } = useTranslations();
  const preferences = useAppDataStore((s) => s.preferences);
  const demoTransactions = useAppDataStore((s) => s.demoTransactions);
  const setProfile = useAppDataStore((s) => s.setProfile);
  const setPreferences = useAppDataStore((s) => s.setPreferences);
  const loadDemoData = useAppDataStore((s) => s.loadDemoData);
  const exportBundle = useAppDataStore((s) => s.exportBundle);
  const importBundle = useAppDataStore((s) => s.importBundle);
  const deleteAllData = useAppDataStore((s) => s.deleteAllData);

  const budgetPeriod = useBudgetPeriodPreference();
  const setBudgetPeriod = useSetBudgetPeriodPreference();
  const budgetViewDensity = useDeviceUiStore((s) => s.budgetViewDensity);
  const setBudgetViewDensity = useDeviceUiStore((s) => s.setBudgetViewDensity);

  const pushEnabled = useNotificationStore((s) => s.pushEnabled);
  const setPushEnabled = useNotificationStore((s) => s.setPushEnabled);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const saveProfile = () => {
    if (!profile.name.trim()) {
      toast.error("Name is required");
      return;
    }
    toast.success("Profile updated");
  };

  useEffect(() => {
    if (searchParams.get("upgraded") === "1") {
      void syncFromServer();
      toast.success("Welcome to Premium!");
    }
  }, [searchParams, syncFromServer]);

  const handleExportJson = () => {
    const bundle = exportBundle();
    downloadTextFile(
      `paycheck-planner-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(bundle, null, 2),
      "application/json"
    );
    toast.success("Full backup downloaded");
  };

  const handleExportCsv = () => {
    downloadTextFile(
      `transactions-${new Date().toISOString().slice(0, 10)}.csv`,
      transactionsToCsv(demoTransactions),
      "text/csv"
    );
    toast.success("CSV export downloaded");
  };

  const handleImportJson = async (file: File) => {
    try {
      const text = await file.text();
      const bundle = parseJsonBundle(text);
      if (!bundle) {
        toast.error("Could not import", {
          description: "File is missing required fields or is not a valid Paycheck Planner export.",
        });
        return;
      }
      importBundle(bundle);
      const synced = await pushLocalStateNow();
      toast.success("Import complete", {
        description: `${describeImportResult(bundle)}${synced ? " · Synced to cloud" : ""}`,
      });
    } catch {
      toast.error("Import failed", { description: "Please try again with a valid JSON export." });
    }
  };

  const handleDeleteAll = async () => {
    await confirm({
      title: "Delete all local data?",
      description: "This removes wallets, categories, goals, and transactions stored on this device.",
      warning: "This action cannot be undone. Your subscription is not affected.",
      confirmLabel: "Delete everything",
      onConfirm: () => {
        deleteAllData();
        toast.success("All local data cleared");
      },
    });
  };

  const openPortal = async () => {
    const response = await fetch("/api/stripe/portal", { method: "POST" });
    const data = (await response.json()) as { url?: string };
    if (data.url) window.location.href = data.url;
  };

  const togglePush = async () => {
    if (pushEnabled) {
      setPushEnabled(false);
      toast.success("Browser notifications disabled");
      return;
    }
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      setPushEnabled(true);
      toast.success("Browser notifications enabled");
      return;
    }
    if (typeof Notification !== "undefined" && Notification.permission !== "denied") {
      const result = await Notification.requestPermission();
      setPushEnabled(result === "granted");
      toast[result === "granted" ? "success" : "info"](
        result === "granted" ? "Browser notifications enabled" : "Notifications blocked in browser settings"
      );
      return;
    }
    toast.info("Enable notifications in your browser settings to receive alerts");
  };

  return (
    <PageFrame
      title="Settings"
      description="Profile, preferences, backups, and account controls."
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <nav
          className="flex gap-2 overflow-x-auto pb-1 lg:w-52 lg:shrink-0 lg:flex-col lg:overflow-visible lg:pb-0"
          aria-label="Settings sections"
        >
          {SECTIONS.map(({ id, label, icon: Icon, description }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveSection(id)}
              className={cn(
                "flex min-w-[9.5rem] shrink-0 items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition lg:min-w-0 lg:w-full",
                activeSection === id
                  ? "border-[var(--accent)] bg-[var(--accent-muted)]"
                  : "border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
              )}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden />
              <span>
                <span className="block text-sm font-medium text-[var(--foreground)]">{label}</span>
                <span className={cn("hidden text-xs lg:block", fintechMuted)}>{description}</span>
              </span>
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1 space-y-4">
          {activeSection === "profile" ? (
            <ShellCard>
              <SectionTitle title="Profile" description="Your display name and email for exports and reports." />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1">
                  <FieldLabel htmlFor="profile-name">Name</FieldLabel>
                  <ShellInput
                    id="profile-name"
                    value={profile.name}
                    onChange={(e) => setProfile({ name: e.target.value })}
                    aria-label="Profile name"
                  />
                </div>
                <div className="grid gap-1">
                  <FieldLabel htmlFor="profile-email">Email</FieldLabel>
                  <ShellInput
                    id="profile-email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ email: e.target.value })}
                    aria-label="Profile email"
                  />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <PrimaryButton onClick={saveProfile}>Save profile</PrimaryButton>
                <SetupOnboardingLink className="inline-flex items-center rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]">
                  Reset onboarding
                </SetupOnboardingLink>
              </div>
            </ShellCard>
          ) : null}

          {activeSection === "preferences" ? (
            <ShellCard>
              <SectionTitle title={t("settings.preferences")} description={t("settings.preferencesDesc")} />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1">
                  <FieldLabel htmlFor="language">{t("settings.languageLabel")}</FieldLabel>
                  <ShellSelect
                    id="language"
                    value={locale}
                    onChange={(e) => {
                      setLocale(e.target.value as "en" | "es");
                      toast.success("Language updated");
                    }}
                  >
                    <option value="en">{t("common.english")}</option>
                    <option value="es">{t("common.spanish")}</option>
                  </ShellSelect>
                </div>
                <div className="grid gap-1">
                  <FieldLabel htmlFor="currency">{t("settings.currencyLabel")}</FieldLabel>
                  <ShellSelect
                    id="currency"
                    value={preferences.currency}
                    onChange={(e) => {
                      setPreferences({ currency: e.target.value as CurrencyCode });
                      toast.success("Currency updated");
                    }}
                  >
                    {CURRENCY_OPTIONS.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label} ({c.code})
                      </option>
                    ))}
                  </ShellSelect>
                </div>
                <div className="grid gap-1">
                  <FieldLabel htmlFor="date-format">{t("settings.dateFormat")}</FieldLabel>
                  <ShellSelect
                    id="date-format"
                    value={preferences.dateFormat}
                    onChange={(e) => {
                      setPreferences({ dateFormat: e.target.value as DateFormatPreference });
                      toast.success("Date format updated");
                    }}
                  >
                    <option value="MDY">MM/DD/YYYY</option>
                    <option value="DMY">DD/MM/YYYY</option>
                    <option value="YMD">YYYY-MM-DD</option>
                  </ShellSelect>
                </div>
                <div className="grid gap-1">
                  <FieldLabel htmlFor="week-start">{t("settings.weekStart")}</FieldLabel>
                  <ShellSelect
                    id="week-start"
                    value={preferences.weekStart}
                    onChange={(e) => {
                      setPreferences({ weekStart: e.target.value as WeekStartPreference });
                      toast.success("Week start updated");
                    }}
                  >
                    <option value="sunday">Sunday</option>
                    <option value="monday">Monday</option>
                  </ShellSelect>
                </div>
                <div className="grid gap-1 sm:col-span-2">
                  <FieldLabel htmlFor="budget-period">Default budget period</FieldLabel>
                  <ShellSelect
                    id="budget-period"
                    value={budgetPeriod}
                    onChange={(e) => {
                      setBudgetPeriod(e.target.value as BudgetPeriodPreference);
                      toast.success("Budget period updated");
                    }}
                  >
                    <option value="bi-weekly">Bi-weekly (paycheck-aligned)</option>
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                  </ShellSelect>
                  <p className={cn("text-xs", fintechMuted)}>
                    Aligns dashboards, budgets, and insights with how you get paid.
                  </p>
                </div>
                <div className="grid gap-1 sm:col-span-2">
                  <FieldLabel htmlFor="budget-density">Budget table density</FieldLabel>
                  <ShellSelect
                    id="budget-density"
                    value={budgetViewDensity}
                    onChange={(e) => {
                      setBudgetViewDensity(e.target.value as BudgetViewDensity);
                      toast.success("Budget view updated");
                    }}
                  >
                    <option value="comfortable">Comfortable</option>
                    <option value="compact">Compact</option>
                  </ShellSelect>
                </div>
              </div>
              <p className={cn("mt-4 text-xs", fintechMuted)}>
                Preview: {formatMoney(1234.56, preferences.currency)}
              </p>
            </ShellCard>
          ) : null}

          {activeSection === "notifications" ? (
            <>
              <ShellCard>
                <SectionTitle
                  title="Smart notifications"
                  description="Bill due dates, budget alerts, goal milestones, and paycheck reminders."
                />
                <p className={cn("text-sm", fintechMuted)}>
                  {unreadCount() > 0
                    ? `${unreadCount()} unread in your notification center.`
                    : "You're caught up — open the bell icon in the header to review alerts."}
                </p>
                <ul className={cn("mt-3 space-y-1.5 text-sm", fintechMuted)}>
                  <li>· Upcoming bills & recurring paychecks</li>
                  <li>· Category budget warnings & wins</li>
                  <li>· Sinking fund milestones</li>
                </ul>
              </ShellCard>
              <ShellCard>
                <SectionTitle
                  title="Browser push"
                  description="Optional alerts when the app is in the background."
                />
                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-[var(--border)] px-4 py-3">
                  <span className="text-sm font-medium">Enable push notifications</span>
                  <input
                    type="checkbox"
                    checked={pushEnabled}
                    onChange={() => void togglePush()}
                    className="h-4 w-4 rounded border-[var(--border)] accent-[var(--accent)]"
                  />
                </label>
              </ShellCard>
            </>
          ) : null}

          {activeSection === "data" ? (
            <ShellCard>
              <SectionTitle
                title="Data & export"
                description="Download a full backup or import from a previous export."
              />
              <div className="flex flex-wrap gap-2">
                <PrimaryButton onClick={handleExportJson}>
                  <Download className="mr-1.5 inline h-4 w-4" />
                  Export all data
                </PrimaryButton>
                <GhostButton onClick={handleExportCsv}>
                  <Download className="mr-1.5 inline h-4 w-4" />
                  Export transactions (CSV)
                </GhostButton>
                <GhostButton onClick={() => importRef.current?.click()}>
                  <Upload className="mr-1.5 inline h-4 w-4" />
                  Import backup
                </GhostButton>
                <GhostButton onClick={() => setCsvModalOpen(true)}>
                  <Upload className="mr-1.5 inline h-4 w-4" />
                  Import CSV
                </GhostButton>
                <GhostButton
                  onClick={() => {
                    loadDemoData();
                    toast.success("Demo data loaded — bi-weekly paychecks, bills, and weekly expenses");
                  }}
                >
                  <Sparkles className="mr-1.5 inline h-4 w-4" />
                  Load demo data
                </GhostButton>
              </div>
              <input
                ref={importRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleImportJson(file);
                  e.target.value = "";
                }}
              />
              <p className={cn("mt-3 text-xs", fintechMuted)}>
                JSON backups include accounts, categories, transactions, goals, and preferences.
              </p>
            </ShellCard>
          ) : null}

          {activeSection === "appearance" ? (
            <ShellCard>
              <SectionTitle title="Appearance" description="Light, dark, or match your device." />
              <div className="grid gap-2 sm:grid-cols-3">
                {(
                  [
                    ["light", "Light"],
                    ["dark", "Dark"],
                    ["system", "System"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm transition",
                      theme === value
                        ? "border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--foreground)]"
                        : "border-[var(--border)] hover:border-[var(--border-strong)]"
                    )}
                    onClick={() => setTheme(value)}
                  >
                    {value === "dark" ? (
                      <Moon className="h-4 w-4 shrink-0" aria-hidden />
                    ) : (
                      <Palette className="h-4 w-4 shrink-0" aria-hidden />
                    )}
                    {label}
                  </button>
                ))}
              </div>
            </ShellCard>
          ) : null}

          {activeSection === "account" ? (
            <>
              <ShellCard>
                <SectionTitle
                  title="Subscription"
                  description={premium ? "You're on Premium." : "Free plan — upgrade anytime."}
                />
                <p className={cn("text-sm", fintechMuted)}>
                  {premium
                    ? "Unlimited accounts, goals, household sharing, and advanced AI."
                    : "2 accounts, 1 goal, basic AI insights."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {premium ? (
                    <GhostButton onClick={() => void openPortal()}>Manage billing</GhostButton>
                  ) : (
                    <PrimaryButton onClick={() => router.push("/pricing")}>Upgrade to Premium</PrimaryButton>
                  )}
                </div>
              </ShellCard>

              {demoMode ? (
                <ShellCard className="border-emerald-500/30">
                  <SectionTitle
                    title="Demo mode"
                    description="Premium is unlocked. Connect a real account when you're ready."
                  />
                  <div className="flex flex-wrap gap-2">
                    <PrimaryButton
                      onClick={() => {
                        loadDemoData();
                        toast.success("Bi-weekly demo data loaded");
                      }}
                    >
                      Reload demo data
                    </PrimaryButton>
                    <GhostButton
                      onClick={() => {
                        exitDemoMode();
                        toast.info("Sign in with your real email to leave demo mode");
                        router.push("/login");
                      }}
                    >
                      Use real account
                    </GhostButton>
                  </div>
                </ShellCard>
              ) : null}

              {isFeatureEnabled("referral_program") ? (
                <ShellCard>
                  <SectionTitle
                    title="Refer friends"
                    description="Earn 1 free Premium month for every 2 successful invites."
                  />
                  <p className="font-mono text-sm text-[var(--accent)]">{referralCode}</p>
                  <p className={cn("mt-2 text-xs", fintechMuted)}>
                    {successfulInvites} invite{successfulInvites === 1 ? "" : "s"} · {premiumMonthsEarned} Premium
                    month{premiumMonthsEarned === 1 ? "" : "s"} earned
                  </p>
                  <GhostButton
                    className="mt-3"
                    onClick={() => {
                      void navigator.clipboard.writeText(`${window.location.origin}/login?ref=${referralCode}`);
                      toast.success("Referral link copied");
                    }}
                  >
                    Copy invite link
                  </GhostButton>
                </ShellCard>
              ) : null}

              <ShellCard>
                <SectionTitle title="Help" description="Guides for bi-weekly pay and recurring rules." />
                <a href="/help" className={cn("text-sm", fintechLink)}>
                  Open help & documentation
                </a>
              </ShellCard>

              <ShellCard>
                <SectionTitle title="Session" description="Sign out of this device." />
                <GhostButton
                  onClick={async () => {
                    await fetch("/api/auth/session", { method: "DELETE" });
                    resetSignInClientState();
                    setPersistUserId(null);
                    setClientDemoMode(false);
                    exitDemoMode();
                    setUser(null);
                    toast.success("Signed out");
                    router.push("/login");
                  }}
                >
                  Sign out
                </GhostButton>
              </ShellCard>

              <ShellCard className="border-rose-500/30">
                <SectionTitle
                  title="Account management"
                  description="Permanently remove all budgets, transactions, and goals stored on this device."
                />
                <DangerButton onClick={() => void handleDeleteAll()}>Delete all local data</DangerButton>
              </ShellCard>
            </>
          ) : null}
        </div>
      </div>

      <CsvImportModal open={csvModalOpen} onClose={() => setCsvModalOpen(false)} />
    </PageFrame>
  );
}
