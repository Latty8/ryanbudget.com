/** Resend transactional email configuration (server-only). */

export const hasResend = Boolean(process.env.RESEND_API_KEY?.trim());

/** Verified sender in Resend — e.g. Paycheck Planner <noreply@ryanbudget.me> */
export function getResendFromAddress(): string {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Paycheck Planner <onboarding@resend.dev>"
  );
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
}
