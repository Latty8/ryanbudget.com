"use client";

import { Users } from "lucide-react";
import { ShellCard } from "@/components/fintech/ui";
import { useTranslations } from "@/components/providers/i18n-provider";
import { useHouseholdAccess } from "@/hooks/use-household-access";
import { cn } from "@/lib/utils";

export function HouseholdSharedBanner() {
  const { t } = useTranslations();
  const { isShared, role, isViewer } = useHouseholdAccess();

  if (!isShared || !role) return null;

  return (
    <ShellCard
      className={cn(
        "border-sky-500/30 bg-sky-500/5",
        isViewer && "border-amber-500/30 bg-amber-500/5"
      )}
    >
      <p className="inline-flex items-center gap-2 text-sm font-medium">
        <Users className="h-4 w-4 text-sky-400" aria-hidden />
        {t("household.sharedBanner")}
      </p>
      <p className="mt-1 text-xs text-slate-400">
        Your role: <span className="capitalize text-slate-300">{role}</span>
        {isViewer ? ` — ${t("household.viewerReadOnly")}` : null}
      </p>
    </ShellCard>
  );
}
