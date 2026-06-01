export type TransactionRule = {
  id: string;
  name: string;
  enabled: boolean;
  /** Case-insensitive substring matches on merchant/description */
  merchantContains: string[];
  categoryName: string;
  priority: number;
};
