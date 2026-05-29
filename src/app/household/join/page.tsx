"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { toast } from "sonner";
import { Users, Loader2 } from "lucide-react";
import { PageFrame, PrimaryButton, ShellCard, Skeleton } from "@/components/fintech/ui";
import { useTranslations } from "@/components/providers/i18n-provider";
import { useAppDataStore } from "@/store/useAppDataStore";
import { nanoid } from "nanoid";
import { useHouseholdStore } from "@/store/useHouseholdStore";

function JoinHouseholdContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslations();
  const token = searchParams.get("token");
  const profile = useAppDataStore((s) => s.profile);
  const acceptInviteLocally = useHouseholdStore((s) => s.acceptInviteLocally);

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [preview, setPreview] = useState<{
    householdName: string;
    role: string;
    inviteeEmail: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Missing invite token");
      setLoading(false);
      return;
    }
    void fetch(`/api/household/invites?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Invalid invite");
        setPreview(data);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Invalid invite"))
      .finally(() => setLoading(false));
  }, [token]);

  const accept = async () => {
    if (!token) return;
    setAccepting(true);
    try {
      const res = await fetch("/api/household/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, acceptorName: profile.name }),
      });
      const data = (await res.json()) as {
        householdId: string;
        householdName: string;
        ownerEmail: string;
        member: { email: string; name: string; role: "editor" | "viewer" };
      };
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Could not accept");

      const existing = useHouseholdStore.getState().household;
      if (!existing) {
        useHouseholdStore.setState({
          household: {
            id: data.householdId,
            name: data.householdName,
            ownerEmail: data.ownerEmail,
            members: [
              {
                id: nanoid(),
                email: data.ownerEmail,
                name: "Household owner",
                role: "owner",
                joinedAt: new Date().toISOString(),
              },
            ],
            invites: [],
            activity: [],
          },
        });
      }
      acceptInviteLocally({
        email: data.member.email,
        name: data.member.name,
        role: data.member.role,
      });
      toast.success(`Joined ${data.householdName}`);
      router.push("/household");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not accept invite");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <PageFrame title={t("household.joinTitle")}>
        <Skeleton className="h-32" />
      </PageFrame>
    );
  }

  if (error || !preview) {
    return (
      <PageFrame title={t("household.joinTitle")}>
        <ShellCard>
          <p className="text-sm text-rose-300">{error ?? "Invite not found"}</p>
        </ShellCard>
      </PageFrame>
    );
  }

  return (
    <PageFrame title={t("household.joinTitle")}>
      <ShellCard>
        <div className="flex items-start gap-3">
          <Users className="h-8 w-8 text-sky-400" aria-hidden />
          <div>
            <p className="text-lg font-semibold">{preview.householdName}</p>
            <p className="mt-1 text-sm text-slate-400">
              You&apos;re invited as <span className="font-medium text-slate-200">{preview.role}</span>
            </p>
            <p className="mt-2 text-xs text-slate-500">For: {preview.inviteeEmail}</p>
          </div>
        </div>
        <PrimaryButton className="mt-4 w-full sm:w-auto" disabled={accepting} onClick={() => void accept()}>
          {accepting ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> : null}
          {t("household.joinAccept")}
        </PrimaryButton>
      </ShellCard>
    </PageFrame>
  );
}

export default function JoinHouseholdPage() {
  return (
    <Suspense
      fallback={
        <PageFrame title="Join household">
          <Skeleton className="h-32" />
        </PageFrame>
      }
    >
      <JoinHouseholdContent />
    </Suspense>
  );
}
