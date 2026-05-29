import type { AssignmentHalfRow } from "@/lib/assignment-halves";
import { mergeHalvesRow } from "@/lib/assignment-halves";
import type { AssignmentsMap } from "@/lib/ynab-simulation";

export type AssignmentTemplate = Record<string, number>;

export const emptyTemplateHalves = (): AssignmentHalfRow => ({
  first: {},
  second: {},
});

export function templateHalvesHasValues(row: AssignmentHalfRow): boolean {
  return (
    Object.keys(row.first).length > 0 || Object.keys(row.second).length > 0
  );
}

export function sumTemplateAmounts(
  flat: AssignmentTemplate,
  halves?: AssignmentHalfRow
): number {
  if (halves && templateHalvesHasValues(halves)) {
    return Object.values(mergeHalvesRow(halves)).reduce((a, b) => a + b, 0);
  }
  return Object.values(flat).reduce((a, b) => a + b, 0);
}

export function scrubTemplateForCategory(
  flat: AssignmentTemplate,
  halves: AssignmentHalfRow,
  categoryId: string
): { flat: AssignmentTemplate; halves: AssignmentHalfRow } {
  const nextFlat = { ...flat };
  delete nextFlat[categoryId];
  const first = { ...halves.first };
  const second = { ...halves.second };
  delete first[categoryId];
  delete second[categoryId];
  return { flat: nextFlat, halves: { first, second } };
}

function roundMoney(n: number): number {
  return Math.round(Math.max(0, n) * 100) / 100;
}

/** Copy template into a period row, optionally skipping categories already funded. */
export function buildPeriodAssignmentsFromTemplate(
  template: AssignmentTemplate,
  templateHalves: AssignmentHalfRow,
  current: Record<string, number> | undefined,
  mode: "onlyEmpty" | "overwrite",
  useHalves: boolean
): {
  flat: Record<string, number>;
  halves?: AssignmentHalfRow;
} {
  const cur = current ?? {};
  const onlyEmpty = mode === "onlyEmpty";
  const useHalfTemplate = useHalves && templateHalvesHasValues(templateHalves);

  if (useHalfTemplate) {
    const halves: AssignmentHalfRow = { first: {}, second: {} };
    const allIds = new Set([
      ...Object.keys(templateHalves.first),
      ...Object.keys(templateHalves.second),
      ...Object.keys(template),
    ]);

    for (const catId of allIds) {
      if (onlyEmpty && (cur[catId] ?? 0) > 0.001) continue;

      const f = roundMoney(templateHalves.first[catId] ?? 0);
      const s = roundMoney(templateHalves.second[catId] ?? 0);
      if (f > 0) halves.first[catId] = f;
      if (s > 0) halves.second[catId] = s;

      const total = f + s || roundMoney(template[catId] ?? 0);
      if (total <= 0) continue;
      if (f <= 0 && s <= 0) halves.first[catId] = total;
    }

    const merged = mergeHalvesRow(halves);
    if (mode === "overwrite") {
      return { flat: merged, halves };
    }
    return { flat: { ...cur, ...merged }, halves };
  }

  if (mode === "overwrite") {
    const flat: Record<string, number> = {};
    for (const [catId, amt] of Object.entries(template)) {
      const rounded = roundMoney(amt);
      if (rounded > 0) flat[catId] = rounded;
    }
    return { flat };
  }

  const flat: Record<string, number> = { ...cur };
  for (const [catId, amt] of Object.entries(template)) {
    const rounded = roundMoney(amt);
    if (rounded <= 0) continue;
    if ((cur[catId] ?? 0) > 0.001) continue;
    flat[catId] = rounded;
  }
  return { flat };
}

export function copyPeriodToTemplate(
  periodRow: Record<string, number> | undefined,
  periodHalves: AssignmentHalfRow | undefined
): { template: AssignmentTemplate; halves: AssignmentHalfRow } {
  if (periodHalves && templateHalvesHasValues(periodHalves)) {
    return {
      template: mergeHalvesRow(periodHalves),
      halves: {
        first: { ...periodHalves.first },
        second: { ...periodHalves.second },
      },
    };
  }
  return {
    template: { ...(periodRow ?? {}) },
    halves: emptyTemplateHalves(),
  };
}

export function periodHasAssignments(
  assignmentsByPeriod: AssignmentsMap,
  periodKey: string
): boolean {
  const row = assignmentsByPeriod[periodKey];
  return row != null && Object.values(row).some((v) => v > 0.001);
}
