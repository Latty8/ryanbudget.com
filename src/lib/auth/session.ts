export const SESSION_COOKIE = "planner-session";
export const ONBOARDED_COOKIE = "planner-onboarded";
export const DEMO_MODE_COOKIE = "planner-demo-mode";

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  /** Demo sessions unlock premium and sample data flows. */
  isDemo?: boolean;
};
