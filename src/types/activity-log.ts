export type ActivityAction = "created" | "updated" | "deleted";

export type ActivityEntity =
  | "transaction"
  | "account"
  | "category"
  | "goal"
  | "recurring"
  | "rule"
  | "net-worth"
  | "import";

export type ActivityLogEntry = {
  id: string;
  at: string;
  action: ActivityAction;
  entity: ActivityEntity;
  title: string;
  detail?: string;
};
