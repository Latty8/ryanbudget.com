export type NotificationKind =
  | "bill_due"
  | "budget_alert"
  | "budget_win"
  | "goal_milestone"
  | "paycheck_reminder"
  | "system";

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href?: string;
  createdAt: string;
  read: boolean;
  priority: "low" | "normal" | "high";
};
