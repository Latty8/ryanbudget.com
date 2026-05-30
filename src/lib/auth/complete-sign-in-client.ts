import { setClientDemoMode } from "@/lib/auth/demo-mode";
import type { SessionPayload } from "@/lib/auth/session";
import { setPersistUserId } from "@/lib/storage/user-persist";
import { useAppDataStore } from "@/store/useAppDataStore";

/** After OAuth or email login — sync auth user to persisted app data. */
export async function completeSignInClient(user: SessionPayload) {
  setClientDemoMode(user.isDemo === true);
  setPersistUserId(user.userId);
  await useAppDataStore.persist.rehydrate();
  useAppDataStore.getState().setProfile({ name: user.name, email: user.email });
  // Zustand persist middleware auto-saves transactions, recurring, accounts on every store update.
}
