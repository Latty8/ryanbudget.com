import { isMongoDBConfigured } from "@/lib/db/config";
import {
  ensureMongoUserProfile,
  getMongoOnboardingCompleted,
  pullMongoState,
  pushMongoState,
  setMongoOnboardingCompleted,
} from "@/lib/mongodb/sync";
import {
  ensureUserProfile as ensureSupabaseUserProfile,
  getOnboardingCompleted as getSupabaseOnboardingCompleted,
  pullRemoteState as pullSupabaseState,
  pushRemoteState as pushSupabaseState,
  setOnboardingCompleted as setSupabaseOnboardingCompleted,
  isSyncAvailable as isSupabaseSyncAvailable,
} from "@/lib/supabase/sync/server";
import type { RemoteAppState } from "@/lib/supabase/sync/types";

export function isSyncAvailable() {
  return isMongoDBConfigured() || isSupabaseSyncAvailable();
}

export async function pullRemoteState(
  userId: string,
  fallbackProfile?: { email: string; name: string }
): Promise<RemoteAppState | null> {
  if (isMongoDBConfigured()) {
    return pullMongoState(userId, fallbackProfile);
  }
  return pullSupabaseState(userId, fallbackProfile);
}

export async function pushRemoteState(userId: string, state: RemoteAppState): Promise<boolean> {
  if (isMongoDBConfigured()) {
    return pushMongoState(userId, state);
  }
  return pushSupabaseState(userId, state);
}

export async function ensureUserProfile(
  userId: string,
  email: string,
  name: string
): Promise<boolean> {
  if (isMongoDBConfigured()) {
    return ensureMongoUserProfile(userId, email, name);
  }
  const row = await ensureSupabaseUserProfile(userId, email, name);
  return row !== null;
}

export async function setOnboardingCompleted(userId: string, completed: boolean): Promise<boolean> {
  if (isMongoDBConfigured()) {
    return setMongoOnboardingCompleted(userId, completed);
  }
  return setSupabaseOnboardingCompleted(userId, completed);
}

export async function getOnboardingCompleted(userId: string): Promise<boolean | null> {
  if (isMongoDBConfigured()) {
    return getMongoOnboardingCompleted(userId);
  }
  return getSupabaseOnboardingCompleted(userId);
}
