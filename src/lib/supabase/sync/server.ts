import { toSyncedPreferences } from "@/lib/preferences/sync-preferences";
import { createSupabaseAdmin, hasSupabaseAdmin } from "@/lib/supabase/admin";
import {
  mapAccountToRow,
  mapCategoryToRow,
  mapGoalToRow,
  mapRecurringToRow,
  mapRemoteState,
  mapTransactionToRow,
} from "@/lib/supabase/sync/mappers";
import type { RemoteAppState } from "@/lib/supabase/sync/types";
import type {
  AccountRow,
  CategoryRow,
  GoalRow,
  ProfileRow,
  RecurringRow,
  TransactionRow,
} from "@/lib/supabase/sync/types";

export function isSyncAvailable() {
  return hasSupabaseAdmin;
}

export async function ensureUserProfile(
  userId: string,
  email: string,
  name: string
): Promise<ProfileRow | null> {
  const admin = createSupabaseAdmin();
  if (!admin) return null;

  const { data, error } = await admin
    .from("profiles")
    .upsert(
      {
        id: userId,
        email,
        full_name: name,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select("id,email,full_name,onboarding_completed,preferences")
    .single();

  if (error) {
    console.error("[sync] ensureUserProfile", error.message);
    return null;
  }
  return data as ProfileRow;
}

export async function pullRemoteState(
  userId: string,
  fallbackProfile?: { email: string; name: string }
): Promise<RemoteAppState | null> {
  const admin = createSupabaseAdmin();
  if (!admin) return null;

  const profileId = userId;

  const [profileRes, accountsRes, categoriesRes, transactionsRes, recurringRes, goalsRes] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id,email,full_name,onboarding_completed,preferences")
        .eq("id", profileId)
        .maybeSingle(),
      admin.from("accounts").select("*").eq("profile_id", profileId),
      admin.from("categories").select("*").eq("profile_id", profileId),
      admin
        .from("transactions")
        .select("*")
        .eq("profile_id", profileId)
        .order("transaction_date", { ascending: false }),
      admin.from("recurring_rules").select("*").eq("profile_id", profileId),
      admin.from("goals").select("*").eq("profile_id", profileId),
    ]);

  if (profileRes.error) console.error("[sync] pull profile", profileRes.error.message);

  return mapRemoteState({
    profile: (profileRes.data as ProfileRow | null) ?? null,
    accounts: (accountsRes.data ?? []) as AccountRow[],
    categories: (categoriesRes.data ?? []) as CategoryRow[],
    transactions: (transactionsRes.data ?? []) as TransactionRow[],
    recurring: (recurringRes.data ?? []) as RecurringRow[],
    goals: (goalsRes.data ?? []) as GoalRow[],
    fallbackProfile,
  });
}

export async function pushRemoteState(userId: string, state: RemoteAppState): Promise<boolean> {
  const admin = createSupabaseAdmin();
  if (!admin) return false;

  const profileId = userId;
  const accountRows = state.accounts.map((a) => mapAccountToRow(profileId, a));
  const categoryRows = state.categories.map((c) => mapCategoryToRow(profileId, c));
  const transactionRows = state.transactions.map((t) => mapTransactionToRow(profileId, t));
  const recurringRows = state.recurring.map((r) => mapRecurringToRow(profileId, r));
  const goalRows = state.goals.map((g) => mapGoalToRow(profileId, g));

  const profileUpdate = await admin
    .from("profiles")
    .upsert(
      {
        id: profileId,
        email: state.profile.email,
        full_name: state.profile.name,
        preferences: toSyncedPreferences(state.preferences),
        onboarding_completed: state.onboardingCompleted,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

  if (profileUpdate.error) {
    console.error("[sync] push profile", profileUpdate.error.message);
    return false;
  }

  const tables: { name: string; rows: { id: string; profile_id: string }[] }[] = [
    { name: "accounts", rows: accountRows },
    { name: "categories", rows: categoryRows },
    { name: "transactions", rows: transactionRows },
    { name: "recurring_rules", rows: recurringRows },
    { name: "goals", rows: goalRows },
  ];

  for (const table of tables) {
    const existing = await admin.from(table.name).select("id").eq("profile_id", profileId);
    if (existing.error) {
      console.error(`[sync] push list ${table.name}`, existing.error.message);
      return false;
    }

    const remoteIds = new Set((existing.data ?? []).map((r) => r.id as string));
    const localIds = new Set(table.rows.map((r) => r.id));
    const toDelete = [...remoteIds].filter((id) => !localIds.has(id));

    if (toDelete.length > 0) {
      const del = await admin.from(table.name).delete().in("id", toDelete);
      if (del.error) {
        console.error(`[sync] push delete ${table.name}`, del.error.message);
        return false;
      }
    }

    if (table.rows.length > 0) {
      const upsert = await admin.from(table.name).upsert(table.rows, { onConflict: "id" });
      if (upsert.error) {
        console.error(`[sync] push upsert ${table.name}`, upsert.error.message);
        return false;
      }
    }
  }

  return true;
}

export async function setOnboardingCompleted(userId: string, completed: boolean): Promise<boolean> {
  const admin = createSupabaseAdmin();
  if (!admin) return false;

  const { error } = await admin
    .from("profiles")
    .upsert(
      {
        id: userId,
        onboarding_completed: completed,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

  if (error) {
    console.error("[sync] setOnboardingCompleted", error.message);
    return false;
  }

  const { error: metaError } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: { onboarding_completed: completed },
  });
  if (metaError) {
    console.error("[sync] setOnboardingCompleted metadata", metaError.message);
  }

  return true;
}

export async function getOnboardingCompleted(userId: string): Promise<boolean | null> {
  const admin = createSupabaseAdmin();
  if (!admin) return null;

  const { data: userData } = await admin.auth.admin.getUserById(userId);
  const fromMeta = userData?.user?.user_metadata?.onboarding_completed;
  if (fromMeta === true) return true;

  const { data, error } = await admin
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[sync] getOnboardingCompleted", error.message);
    return null;
  }
  return data?.onboarding_completed ?? false;
}
