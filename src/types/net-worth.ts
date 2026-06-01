export type NetWorthItemKind = "asset" | "liability";

export type NetWorthItem = {
  id: string;
  name: string;
  kind: NetWorthItemKind;
  balance: number;
  /** Link to wallet id when synced from accounts */
  accountId?: string;
  includeInChart: boolean;
};

export type NetWorthSnapshot = {
  id: string;
  date: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
};
