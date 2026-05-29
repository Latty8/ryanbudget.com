"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, Link2, Shield, Users } from "lucide-react";
import { UpgradePrompt } from "@/components/billing/upgrade-prompt";
import {
  GhostButton,
  PageFrame,
  PrimaryButton,
  ShellCard,
  ShellInput,
  ShellSelect,
  useShellTheme,
} from "@/components/fintech/ui";
import { useConfirm } from "@/components/providers/confirm-dialog-provider";
import { useTranslations } from "@/components/providers/i18n-provider";
import { usePremium } from "@/hooks/use-premium";
import { useHouseholdAccess } from "@/hooks/use-household-access";
import {
  canChangeMemberRole,
  canPerformHouseholdAction,
  canRemoveMember,
} from "@/lib/household/permissions";
import { useAppDataStore } from "@/store/useAppDataStore";
import { useHouseholdStore } from "@/store/useHouseholdStore";
import { cn } from "@/lib/utils";
import type { HouseholdRole } from "@/types/household";

const ROLE_LABELS: Record<HouseholdRole, string> = {
  owner: "Owner — full control",
  editor: "Editor — edit budgets & transactions",
  viewer: "Viewer — read only",
};

export function HouseholdView() {
  const confirm = useConfirm();
  const { t } = useTranslations();
  const { isLight } = useShellTheme();
  const { canUse } = usePremium();
  const { role: myRole } = useHouseholdAccess();
  const profile = useAppDataStore((s) => s.profile);
  const household = useHouseholdStore((s) => s.household);
  const createHousehold = useHouseholdStore((s) => s.createHousehold);
  const inviteMember = useHouseholdStore((s) => s.inviteMember);
  const updateMemberRole = useHouseholdStore((s) => s.updateMemberRole);
  const removeMember = useHouseholdStore((s) => s.removeMember);
  const revokeInvite = useHouseholdStore((s) => s.revokeInvite);

  const [householdName, setHouseholdName] = useState("Our Household");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("editor");
  const [sending, setSending] = useState(false);

  if (!canUse("household_sharing")) {
    return (
      <PageFrame title={t("household.title")}>
        <UpgradePrompt
          title="Household sharing is Premium"
          description="Invite family members, assign roles (Owner, Editor, Viewer), and see a shared activity log."
          feature="household_sharing"
        />
      </PageFrame>
    );
  }

  if (!household) {
    return (
      <PageFrame title={t("household.title")}>
        <ShellCard>
          <p className="text-sm text-slate-400">Create a household to share budgets with family members.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
            <ShellInput
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              aria-label="Household name"
            />
            <PrimaryButton
              onClick={() => {
                createHousehold(householdName.trim() || "Our Household", profile.email, profile.name);
                toast.success("Household created");
              }}
            >
              {t("household.create")}
            </PrimaryButton>
          </div>
        </ShellCard>
      </PageFrame>
    );
  }

  const sendInvite = async () => {
    if (!inviteEmail.trim() || !household) return;
    if (myRole && !canPerformHouseholdAction(myRole, "invite_member")) {
      toast.error("You don't have permission to invite");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/household/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          householdId: household.id,
          householdName: household.name,
          inviteeEmail: inviteEmail.trim(),
          role: inviteRole,
        }),
      });
      const data = (await res.json()) as {
        invite?: { token: string; expiresAt: string };
        inviteUrl?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Invite failed");

      const ok = inviteMember(
        inviteEmail.trim(),
        inviteRole,
        profile.email,
        data.invite?.token,
        data.invite?.expiresAt
      );
      if (!ok) {
        toast.error("Already invited or a member");
        return;
      }
      toast.success("Invite created");
      if (data.inviteUrl) {
        await navigator.clipboard.writeText(data.inviteUrl);
        toast.message("Invite link copied to clipboard");
      }
      setInviteEmail("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Invite failed");
    } finally {
      setSending(false);
    }
  };

  const copyInviteLink = async (token: string) => {
    const url = `${window.location.origin}/household/join?token=${token}`;
    await navigator.clipboard.writeText(url);
    toast.success(t("household.copyLink"));
  };

  return (
    <PageFrame title={t("household.title")}>
      <ShellCard>
        <div className="flex items-center justify-between">
          <div>
            <p className="inline-flex items-center gap-2 font-medium">
              <Users className="h-4 w-4 text-sky-400" aria-hidden />
              {household.name}
            </p>
            <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>
              Owner: {household.ownerEmail}
            </p>
          </div>
        </div>
      </ShellCard>

      {myRole ? (
        <ShellCard>
          <p className="mb-2 inline-flex items-center gap-2 text-sm font-medium">
            <Shield className="h-4 w-4 text-sky-400" aria-hidden />
            {t("household.permissionsTitle")}
          </p>
          <p className="text-xs text-slate-400">{ROLE_LABELS[myRole]}</p>
          <ul className="mt-2 grid gap-1 text-xs text-slate-500 sm:grid-cols-2">
            <li>{canPerformHouseholdAction(myRole, "view_budget") ? "✓" : "—"} View dashboard</li>
            <li>{canPerformHouseholdAction(myRole, "edit_transactions") ? "✓" : "—"} Edit transactions</li>
            <li>{canPerformHouseholdAction(myRole, "edit_budget") ? "✓" : "—"} Edit budgets</li>
            <li>{canPerformHouseholdAction(myRole, "invite_member") ? "✓" : "—"} Invite members</li>
          </ul>
        </ShellCard>
      ) : null}

      <ShellCard>
        <p className="mb-3 text-sm font-medium">{t("household.members")}</p>
        <div className="space-y-2">
          {household.members.map((member) => (
            <div
              key={member.id}
              className={cn(
                "flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3",
                isLight ? "border-slate-200" : "border-slate-700"
              )}
            >
              <div>
                <p className="text-sm font-medium">{member.name}</p>
                <p className="text-xs text-slate-500">{member.email}</p>
              </div>
              {member.role === "owner" ? (
                <span className="text-xs uppercase text-slate-500">{member.role}</span>
              ) : (
                <div className="flex gap-2">
                  <ShellSelect
                    value={member.role}
                    disabled={!myRole || !canChangeMemberRole(myRole, member.role)}
                    onChange={(e) =>
                      updateMemberRole(member.id, e.target.value as HouseholdRole, profile.email)
                    }
                    aria-label={`Role for ${member.email}`}
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </ShellSelect>
                  <GhostButton
                    disabled={!myRole || !canRemoveMember(myRole, member.role)}
                    onClick={() => {
                      void confirm({
                        title: `Remove ${member.email}?`,
                        description: "They will lose access to this household budget.",
                        warning: "You can invite them again later.",
                        confirmLabel: "Remove member",
                        onConfirm: () => {
                          removeMember(member.id, profile.email);
                          toast.success("Member removed");
                        },
                      });
                    }}
                  >
                    Remove
                  </GhostButton>
                </div>
              )}
            </div>
          ))}
        </div>
      </ShellCard>

      <ShellCard className="border-sky-500/20 bg-sky-500/5">
        <p className="text-sm font-medium text-sky-200">Invite flow</p>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-xs text-slate-400">
          <li>Enter their email and choose Editor or Viewer</li>
          <li>We generate a secure link (expires in 7 days)</li>
          <li>They open the link, sign in, and join your household</li>
          <li>Editors can change budgets; Viewers see read-only dashboards</li>
        </ol>
      </ShellCard>

      <ShellCard>
        <p className="mb-3 text-sm font-medium">{t("household.invite")}</p>
        <div className="grid gap-2 sm:grid-cols-[1fr_140px_auto]">
          <ShellInput
            type="email"
            placeholder="partner@email.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            aria-label="Invite email"
          />
          <ShellSelect value={inviteRole} onChange={(e) => setInviteRole(e.target.value as "editor" | "viewer")}>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </ShellSelect>
          <PrimaryButton disabled={sending} onClick={() => void sendInvite()}>
            <Link2 className="mr-1 inline h-4 w-4" />
            {t("household.sendInvite")}
          </PrimaryButton>
        </div>
        {household.invites.filter((i) => i.status === "pending").length > 0 ? (
          <ul className="mt-4 space-y-2">
            {household.invites
              .filter((i) => i.status === "pending")
              .map((inv) => (
                <li
                  key={inv.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-700/50 px-3 py-2 text-xs"
                >
                  <span>
                    {inv.email} · {inv.role}
                    {inv.expiresAt ? ` · expires ${new Date(inv.expiresAt).toLocaleDateString()}` : ""}
                  </span>
                  <div className="flex gap-1">
                    {inv.token ? (
                      <GhostButton type="button" className="text-xs" onClick={() => void copyInviteLink(inv.token!)}>
                        <Copy className="mr-1 inline h-3 w-3" />
                        {t("household.copyLink")}
                      </GhostButton>
                    ) : null}
                    <GhostButton
                      type="button"
                      className="text-xs text-rose-300"
                      onClick={() => revokeInvite(inv.id, profile.email)}
                    >
                      Revoke
                    </GhostButton>
                  </div>
                </li>
              ))}
          </ul>
        ) : null}
      </ShellCard>

      <ShellCard>
        <p className="mb-3 text-sm font-medium">{t("household.activity")}</p>
        <div className="max-h-80 space-y-2 overflow-y-auto" role="log" aria-live="polite">
          {household.activity.length === 0 ? (
            <p className="text-xs text-slate-500">Changes will appear here.</p>
          ) : (
            household.activity.map((entry) => (
              <div key={entry.id} className="rounded-lg border border-slate-700/50 px-3 py-2 text-xs">
                <p className="text-slate-300">{entry.detail}</p>
                <p className="text-slate-500">
                  {entry.actorEmail} · {new Date(entry.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </ShellCard>
    </PageFrame>
  );
}
