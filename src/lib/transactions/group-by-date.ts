import { format, isToday, isYesterday, parseISO } from "date-fns";
import type { TransactionRecord } from "@/types/finance";

export type TransactionDateGroup = {
  key: string;
  label: string;
  rows: TransactionRecord[];
};

export function formatTransactionGroupLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  const now = new Date();
  if (date.getFullYear() === now.getFullYear()) {
    return format(date, "EEEE, MMM d");
  }
  return format(date, "MMM d, yyyy");
}

export function groupTransactionsByDate(rows: TransactionRecord[]): TransactionDateGroup[] {
  const sorted = [...rows].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const map = new Map<string, TransactionRecord[]>();

  for (const row of sorted) {
    const label = formatTransactionGroupLabel(row.date);
    const key = row.date.slice(0, 10);
    const existing = map.get(key);
    if (existing) existing.push(row);
    else map.set(key, [row]);
  }

  return [...map.entries()].map(([key, groupRows]) => ({
    key,
    label: formatTransactionGroupLabel(groupRows[0]!.date),
    rows: groupRows,
  }));
}
