import type { AppExportBundle } from "@/types/app-settings";
import type { DemoTransaction } from "@/lib/demo/sample-data";

function escapeCsvCell(value: string) {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function transactionsToCsv(rows: DemoTransaction[]) {
  const header = ["Date", "Description", "Category", "Account", "Amount", "Recurring"];
  const lines = [
    header.join(","),
    ...rows.map((row) =>
      [
        escapeCsvCell(row.date),
        escapeCsvCell(row.merchant),
        escapeCsvCell(row.category),
        escapeCsvCell(row.account),
        escapeCsvCell(row.amount.toFixed(2)),
        escapeCsvCell(row.recurring ? "yes" : "no"),
      ].join(",")
    ),
  ];
  return lines.join("\r\n");
}

export function downloadTextFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function parseCsvTransactions(csv: string): DemoTransaction[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const rows: DemoTransaction[] = [];
  for (const line of lines.slice(1)) {
    const cells = line.split(",").map((cell) => cell.replace(/^"|"$/g, "").trim());
    if (cells.length < 5) continue;
    const [date, merchant, category, account, amountRaw, recurringRaw] = cells;
    const amount = Number(amountRaw);
    if (!date || !merchant || Number.isNaN(amount)) continue;
    rows.push({
      id: `import-${Date.now()}-${rows.length}`,
      date,
      merchant,
      category: category || "Uncategorized",
      account: account || "Manual",
      amount,
      recurring: (recurringRaw ?? "").toLowerCase() === "yes",
    });
  }
  return rows;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseJsonBundle(raw: string): AppExportBundle | null {
  try {
    const parsed = JSON.parse(raw) as AppExportBundle;
    if (parsed.version !== 1 || !isRecord(parsed.profile) || !Array.isArray(parsed.accounts) || !Array.isArray(parsed.categories)) {
      return null;
    }
    if (!parsed.preferences || typeof parsed.preferences !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function describeImportResult(bundle: AppExportBundle) {
  const parts = ["profile", "accounts", "categories"];
  if (bundle.transactions?.length) parts.push(`${bundle.transactions.length} transactions`);
  if (bundle.recurring?.length) parts.push(`${bundle.recurring.length} recurring`);
  if (bundle.goals?.length) parts.push(`${bundle.goals.length} goals`);
  return parts.join(", ");
}
