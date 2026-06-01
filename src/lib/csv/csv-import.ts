import type { DemoTransaction } from "@/lib/demo/sample-data";
import { suggestCategoryFromRules } from "@/lib/rules/apply-transaction-rules";
import type { TransactionRule } from "@/types/transaction-rules";

export type CsvColumnKey = "date" | "description" | "category" | "account" | "amount" | "recurring";

export const CSV_COLUMN_LABELS: Record<CsvColumnKey, string> = {
  date: "Date",
  description: "Description / Merchant",
  category: "Category",
  account: "Account",
  amount: "Amount",
  recurring: "Recurring",
};

export type CsvColumnMapping = Partial<Record<CsvColumnKey, number>>;

export type ParsedCsvRow = {
  lineIndex: number;
  cells: string[];
};

export type CsvImportPreviewRow = {
  row: DemoTransaction;
  duplicate: boolean;
  suggestedCategory?: string;
};

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

export function parseCsvRaw(csv: string): { headers: string[]; rows: ParsedCsvRow[] } {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return { headers: [], rows: [] };
  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map((line, idx) => ({
    lineIndex: idx + 2,
    cells: parseCsvLine(line),
  }));
  return { headers, rows };
}

export function guessColumnMapping(headers: string[]): CsvColumnMapping {
  const lower = headers.map((h) => h.toLowerCase());
  const find = (...terms: string[]) =>
    lower.findIndex((h) => terms.some((t) => h.includes(t)));

  const mapping: CsvColumnMapping = {};
  const dateIdx = find("date", "posted", "transaction date");
  const descIdx = find("description", "merchant", "payee", "memo", "name");
  const catIdx = find("category", "type");
  const accIdx = find("account", "wallet");
  const amtIdx = find("amount", "value", "debit", "credit");
  const recIdx = find("recurring", "repeat");

  if (dateIdx >= 0) mapping.date = dateIdx;
  if (descIdx >= 0) mapping.description = descIdx;
  if (catIdx >= 0) mapping.category = catIdx;
  if (accIdx >= 0) mapping.account = accIdx;
  if (amtIdx >= 0) mapping.amount = amtIdx;
  if (recIdx >= 0) mapping.recurring = recIdx;
  return mapping;
}

function cellAt(cells: string[], index: number | undefined) {
  if (index == null || index < 0) return "";
  return cells[index] ?? "";
}

export function buildTransactionsFromCsv(
  rows: ParsedCsvRow[],
  mapping: CsvColumnMapping,
  existing: DemoTransaction[],
  rules: TransactionRule[]
): CsvImportPreviewRow[] {
  const dupKeys = new Set(
    existing.map((t) => `${t.date}|${t.merchant.toLowerCase()}|${t.amount.toFixed(2)}`)
  );
  const out: CsvImportPreviewRow[] = [];

  for (const { cells, lineIndex } of rows) {
    const date = cellAt(cells, mapping.date);
    const merchant = cellAt(cells, mapping.description);
    const amountRaw = cellAt(cells, mapping.amount).replace(/[$,]/g, "");
    const amount = Number(amountRaw);
    if (!date || !merchant || Number.isNaN(amount)) continue;

    const categoryRaw = cellAt(cells, mapping.category);
    const suggested =
      categoryRaw ||
      suggestCategoryFromRules(merchant, rules) ||
      "Uncategorized";

    const row: DemoTransaction = {
      id: `import-${lineIndex}-${out.length}`,
      date,
      merchant,
      category: suggested,
      account: cellAt(cells, mapping.account) || "Manual",
      amount,
      recurring: cellAt(cells, mapping.recurring).toLowerCase() === "yes",
    };

    const dupKey = `${row.date}|${row.merchant.toLowerCase()}|${row.amount.toFixed(2)}`;
    const duplicate = dupKeys.has(dupKey);
    if (!duplicate) dupKeys.add(dupKey);

    out.push({ row, duplicate, suggestedCategory: suggested });
  }

  return out;
}
