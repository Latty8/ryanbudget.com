import { useAppDataStore } from "@/store/useAppDataStore";
import { bootstrapUserSession } from "@/lib/supabase/sync/client";

/** Decide whether to send the user to onboarding or their intended destination. */
export async function resolvePostLoginPath(fallback = "/dashboard"): Promise<string> {
  const bootstrap = await bootstrapUserSession();
  const storeComplete = useAppDataStore.getState().onboardingComplete;
  if (bootstrap.onboardingCompleted || storeComplete) return fallback;
  return "/onboarding";
}
