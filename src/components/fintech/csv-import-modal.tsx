"use client";

import { useMemo, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import {
  CSV_COLUMN_LABELS,
  buildTransactionsFromCsv,
  guessColumnMapping,
  parseCsvRaw,
  type CsvColumnKey,
  type CsvColumnMapping,
} from "@/lib/csv/csv-import";
import {
  FieldLabel,
  GhostButton,
  ModalOverlay,
  PrimaryButton,
  ShellSelect,
  fintechForeground,
  fintechMuted,
} from "@/components/fintech/ui";
import { logActivity } from "@/store/useActivityLogStore";
import { useTransactionRulesStore } from "@/store/useTransactionRulesStore";
import { useAppDataStore } from "@/store/useAppDataStore";
import { cn } from "@/lib/utils";

const COLUMN_KEYS: CsvColumnKey[] = ["date", "description", "category", "account", "amount", "recurring"];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function CsvImportModal({ open, onClose }: Props) {
  const transactions = useAppDataStore((s) => s.demoTransactions);
  const rules = useTransactionRulesStore((s) => s.rules);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<ReturnType<typeof parseCsvRaw>["rows"]>([]);
  const [mapping, setMapping] = useState<CsvColumnMapping>({});
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  const preview = useMemo(
    () => buildTransactionsFromCsv(rawRows, mapping, transactions, rules),
    [rawRows, mapping, transactions, rules]
  );

  const importable = preview.filter((p) => !skipDuplicates || !p.duplicate);

  const onFile = async (file: File) => {
    const text = await file.text();
    const parsed = parseCsvRaw(text);
    setHeaders(parsed.headers);
    setRawRows(parsed.rows);
    setMapping(guessColumnMapping(parsed.headers));
  };

  const importRows = () => {
    if (!importable.length) {
      toast.error("No rows to import");
      return;
    }
    useAppDataStore.setState((state) => ({
      demoTransactions: [...importable.map((p) => p.row), ...state.demoTransactions],
    }));
    logActivity("created", "import", `${importable.length} transactions`, "CSV import");
    toast.success(`Imported ${importable.length} transactions`);
    onClose();
    setHeaders([]);
    setRawRows([]);
  };

  return (
    <ModalOverlay open={open} onClose={onClose} title="Import CSV">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-inner)] border border-dashed border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-8 transition hover:border-[var(--accent)]/40">
        <Upload className="h-6 w-6 text-[var(--muted)]" />
        <span className={cn("text-sm font-medium", fintechForeground)}>Choose a CSV file</span>
        <span className={cn("text-xs", fintechMuted)}>Map columns, detect duplicates, apply rules</span>
        <input
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onFile(file);
          }}
        />
      </label>

      {headers.length > 0 ? (
        <div className="mt-4 grid gap-3">
          <p className={cn("text-xs font-semibold uppercase tracking-wide", fintechMuted)}>Column mapping</p>
          {COLUMN_KEYS.map((key) => (
            <label key={key} className="grid gap-1 sm:grid-cols-2 sm:items-center">
              <FieldLabel>{CSV_COLUMN_LABELS[key]}</FieldLabel>
              <ShellSelect
                value={mapping[key] ?? ""}
                onChange={(e) => {
                  const idx = e.target.value === "" ? undefined : Number(e.target.value);
                  setMapping((m) => ({ ...m, [key]: idx }));
                }}
              >
                <option value="">— skip —</option>
                {headers.map((h, i) => (
                  <option key={h + i} value={i}>
                    {h || `Column ${i + 1}`}
                  </option>
                ))}
              </ShellSelect>
            </label>
          ))}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={skipDuplicates}
              onChange={(e) => setSkipDuplicates(e.target.checked)}
              className="rounded border-[var(--border-subtle)]"
            />
            <span className={fintechMuted}>Skip likely duplicates (same date, merchant, amount)</span>
          </label>
          <p className={cn("text-sm", fintechMuted)}>
            {importable.length} of {preview.length} rows ready
            {preview.some((p) => p.duplicate) ? ` (${preview.filter((p) => p.duplicate).length} duplicates)` : ""}
          </p>
        </div>
      ) : null}

      <div className="mt-4 flex justify-end gap-2">
        <GhostButton onClick={onClose}>Cancel</GhostButton>
        <PrimaryButton onClick={importRows} disabled={!importable.length}>
          Import
        </PrimaryButton>
      </div>
    </ModalOverlay>
  );
}
