/** Client-safe feature flags (override via NEXT_PUBLIC_FEATURE_* env vars). */
export type FeatureFlag =
  | "ai_nlp_transactions"
  | "ai_multi_what_if"
  | "referral_program"
  | "blog_resources"
  | "waitlist_signup";

const DEFAULT_FLAGS: Record<FeatureFlag, boolean> = {
  ai_nlp_transactions: true,
  ai_multi_what_if: true,
  referral_program: true,
  blog_resources: true,
  waitlist_signup: true,
};

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  const envKey = `NEXT_PUBLIC_FEATURE_${flag.toUpperCase()}`;
  const raw = process.env[envKey];
  if (raw === "0" || raw === "false") return false;
  if (raw === "1" || raw === "true") return true;
  return DEFAULT_FLAGS[flag];
}
