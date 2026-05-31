"use client";

import { useRef } from "react";
import { toast } from "sonner";
import {
  Download,
  Sparkles,
  Upload,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useFintechTheme } from "@/components/fintech/theme";
import { useAuth } from "@/components/providers/auth-provider";
import { SetupOnboardingLink } from "@/components/fintech/setup-onboarding-link";
import { useConfirm } from "@/components/providers/confirm-dialog-provider";
import { useTranslations } from "@/components/providers/i18n-provider";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { usePremium } from "@/hooks/use-premium";
import { setClientDemoMode } from "@/lib/auth/demo-mode";
import { resetSignInClientState } from "@/lib/auth/complete-sign-in-client";
import { setPersistUserId } from "@/lib/storage/user-persist";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";
import { useReferralStore } from "@/store/useReferralStore";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { NumberField } from "@/components/fintech/number-field";
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
  useShellTheme,
} from "@/components/fintech/ui";
import { downloadTextFile, parseCsvTransactions, parseJsonBundle, transactionsToCsv } from "@/lib/data/export-import";
import { cn } from "@/lib/utils";
import { formatMoney, useAppDataStore } from "@/store/useAppDataStore";
import { CURRENCY_OPTIONS } from "@/lib/currency/exchange-rates";
import type { CurrencyCode, DateFormatPreference, WeekStartPreference } from "@/types/app-settings";

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
  const { isLight } = useShellTheme();
  const importRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);

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
    toast.success("JSON export downloaded");
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
    const text = await file.text();
    const bundle = parseJsonBundle(text);
    if (!bundle) {
      toast.error("Invalid JSON file");
      return;
    }
    importBundle(bundle);
    toast.success("Data imported from JSON");
  };

  const handleImportCsv = async (file: File) => {
    const text = await file.text();
    const rows = parseCsvTransactions(text);
    if (rows.length === 0) {
      toast.error("No valid rows found in CSV");
      return;
    }
    useAppDataStore.setState({ demoTransactions: [...demoTransactions, ...rows] });
    toast.success(`Imported ${rows.length} transactions`);
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

  return (
    <PageFrame title="Settings">
      <ShellCard>
        <SectionTitle title="Subscription" description={premium ? "You're on Premium." : "Free plan — upgrade anytime."} />
        <p className={cn("text-sm", fintechMuted)}>
          {premium ? "Unlimited accounts, goals, household sharing, and advanced AI." : "2 accounts, 1 goal, basic AI insights."}
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
            description="Premium is unlocked. Connect a real account when you're ready — your budgets stay on this device until then."
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
            description="Share your link — earn 1 free Premium month for every 2 successful invites."
          />
          <p className="font-mono text-sm text-[var(--accent)]">{referralCode}</p>
          <p className={cn("mt-2 text-xs", fintechMuted)}>
            {successfulInvites} invite{successfulInvites === 1 ? "" : "s"} · {premiumMonthsEarned} Premium month
            {premiumMonthsEarned === 1 ? "" : "s"} earned
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
        <div className="mt-3">
          <PrimaryButton onClick={saveProfile}>Save profile</PrimaryButton>
        </div>
      </ShellCard>

      <ShellCard>
        <SectionTitle
          title="Setup"
          description="Re-run the initial setup wizard. Onboarding only runs once per account across devices."
        />
        <SetupOnboardingLink className="inline-flex rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]">
          Run setup again
        </SetupOnboardingLink>
      </ShellCard>

      <ShellCard>
        <SectionTitle title={t("settings.preferences")} description={t("settings.preferencesDesc")} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
        </div>
        <p className={cn("mt-3 text-xs", fintechMuted)}>
          Sample balance preview: {formatMoney(1234.56, preferences.currency)}
        </p>
        <div className="mt-4">
          <FieldLabel>Appearance</FieldLabel>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              className={cn(
                "rounded-xl border px-3 py-2 text-left text-sm",
                theme === "dark"
                  ? "border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--foreground)]"
                  : "border-[var(--border)]"
              )}
              onClick={() => setTheme("dark")}
            >
              Dark mode
            </button>
            <button
              type="button"
              className={cn(
                "rounded-xl border px-3 py-2 text-left text-sm",
                theme === "light"
                  ? "border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--foreground)]"
                  : "border-[var(--border)]"
              )}
              onClick={() => setTheme("light")}
            >
              Light mode
            </button>
          </div>
        </div>
      </ShellCard>

      <ShellCard>
        <SectionTitle title="Data" description="Export, import, or load realistic demo data." />
        <div className="flex flex-wrap gap-2">
          <GhostButton onClick={handleExportJson}>
            <Download className="mr-1 inline h-4 w-4" />
            Export JSON
          </GhostButton>
          <GhostButton onClick={handleExportCsv}>
            <Download className="mr-1 inline h-4 w-4" />
            Export CSV
          </GhostButton>
          <GhostButton onClick={() => importRef.current?.click()}>
            <Upload className="mr-1 inline h-4 w-4" />
            Import JSON
          </GhostButton>
          <GhostButton onClick={() => csvRef.current?.click()}>
            <Upload className="mr-1 inline h-4 w-4" />
            Import CSV
          </GhostButton>
          <PrimaryButton
            onClick={() => {
              loadDemoData();
              toast.success("Demo data loaded — bi-weekly paychecks, bills, and weekly expenses");
            }}
          >
            <Sparkles className="mr-1 inline h-4 w-4" />
            Load demo data
          </PrimaryButton>
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
        <input
          ref={csvRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleImportCsv(file);
            e.target.value = "";
          }}
        />
      </ShellCard>

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
        <SectionTitle title="Danger zone" description="Permanently delete all local app data on this device." />
        <DangerButton onClick={() => void handleDeleteAll()}>Delete all data</DangerButton>
      </ShellCard>
    </PageFrame>
  );
}
