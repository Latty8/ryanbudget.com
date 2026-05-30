import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Auth (Google sign-in) — enabled when URL + anon key are set. */
export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Cloud data sync (transactions table, etc.) — opt-in after running DB migrations.
 * Without this, all budget data saves to per-user localStorage (works with Google auth).
 */
export const hasSupabaseDataSync =
  hasSupabaseEnv && process.env.NEXT_PUBLIC_SUPABASE_ENABLE_DATA === "true";

export const supabase = hasSupabaseEnv
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;
