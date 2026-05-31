import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { AppShell } from "@/components/fintech/app-shell";
import { ChangelogModal } from "@/components/fintech/lazy-overlays";
import { FintechErrorBoundary } from "@/components/fintech/error-boundary";
import { FintechThemeProvider } from "@/components/fintech/theme";
import { AuthDataSync } from "@/components/providers/auth-data-sync";
import { CloudSyncProvider } from "@/components/providers/cloud-sync-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ConfirmDialogProvider } from "@/components/providers/confirm-dialog-provider";
import { DemoModeProvider } from "@/components/providers/demo-mode-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { SyncQueryBridge } from "@/components/providers/sync-query-bridge";
import { ToastProvider } from "@/components/providers/toast-provider";
import { FeedbackButton } from "@/components/fintech/feedback-button";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { PwaProvider } from "@/components/pwa/pwa-provider";
import { AnalyticsProvider } from "@/components/providers/analytics-provider";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { SubscriptionProvider } from "@/components/providers/subscription-provider";
import { readSession } from "@/lib/auth/read-session";
import { cn } from "@/lib/utils";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://paycheckplanner.app";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Paycheck Planner",
    template: "%s | Paycheck Planner",
  },
  description:
    "Calm paycheck-first budgeting for bi-weekly pay. Plan bills, categories, and safe-to-spend in minutes.",
  applicationName: "Paycheck Planner",
  appleWebApp: {
    capable: true,
    title: "Paycheck Planner",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Paycheck Planner",
    title: "Paycheck Planner",
    description: "Bi-weekly paycheck budgeting made calm and simple.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Paycheck Planner",
    description: "Bi-weekly paycheck budgeting made calm and simple.",
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await readSession();

  return (
    <html lang="en" className={cn("h-full", dmSans.variable)} data-theme="light" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0d9488" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className="min-h-full touch-manipulation bg-[var(--background)] text-[var(--foreground)] antialiased">
        <FintechThemeProvider>
          <AuthProvider initialUser={session}>
            <AuthDataSync />
            <CloudSyncProvider />
            <DemoModeProvider>
              <ConfirmDialogProvider>
              <QueryProvider>
                <SyncQueryBridge />
                <I18nProvider>
                <AnalyticsProvider>
                <SubscriptionProvider>
                  <FintechErrorBoundary>
                    <AppShell>{children}</AppShell>
                  </FintechErrorBoundary>
                </SubscriptionProvider>
                </AnalyticsProvider>
                </I18nProvider>
                <ToastProvider />
                <OfflineBanner />
                <PwaProvider />
                <ChangelogModal />
                <FeedbackButton />
              </QueryProvider>
              </ConfirmDialogProvider>
            </DemoModeProvider>
          </AuthProvider>
        </FintechThemeProvider>
        <div id="modal-root" aria-hidden="true" />
      </body>
    </html>
  );
}
