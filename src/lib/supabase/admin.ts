import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const hasSupabaseAdmin = Boolean(url && serviceKey);

export function createSupabaseAdmin() {
  if (!hasSupabaseAdmin) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const RECEIPTS_BUCKET = "receipts";
