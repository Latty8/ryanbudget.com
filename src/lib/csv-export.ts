import type { Transaction } from "@/lib/types";

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function transactionsToCsv(
  rows: Transaction[],
  categoryNames: Record<string, string>
): string {
  const header = ["Date", "Description", "Type", "Category", "Amount"];
  const lines = [
    header.join(","),
    ...rows.map((t) =>
      [
        escapeCsvCell(t.date),
        escapeCsvCell(t.description),
        escapeCsvCell(t.type),
        escapeCsvCell(
          t.categoryId ? categoryNames[t.categoryId] ?? "" : ""
        ),
        escapeCsvCell(t.amount.toFixed(2)),
      ].join(",")
    ),
  ];
  return lines.join("\r\n");
}

export function downloadTextFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
