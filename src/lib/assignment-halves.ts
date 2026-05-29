import type { AssignmentsMap } from "@/lib/ynab-simulation";

export type AssignmentHalfRow = {
  first: Record<string, number>;
  second: Record<string, number>;
};

export type AssignmentHalvesMap = Record<string, AssignmentHalfRow>;

export function mergeHalfParts(
  first: Record<string, number>,
  second: Record<string, number>
): Record<string, number> {
  const ids = new Set([
    ...Object.keys(first),
    ...Object.keys(second),
  ]);
  const out: Record<string, number> = {};
  for (const id of ids) {
    const v =
      Math.round(((first[id] ?? 0) + (second[id] ?? 0)) * 100) / 100;
    if (v > 0) out[id] = v;
  }
  return out;
}

export function mergeHalvesRow(row: AssignmentHalfRow): Record<string, number> {
  return mergeHalfParts(row.first, row.second);
}

/** After edits to halves, rebuild merged rows for all keys present in halves. */
export function applyMergedAssignmentsFromHalves(
  flat: AssignmentsMap,
  halves: AssignmentHalvesMap
): AssignmentsMap {
  const next = { ...flat };
  for (const [periodKey, row] of Object.entries(halves)) {
    const merged = mergeHalvesRow(row);
    if (Object.keys(merged).length === 0) delete next[periodKey];
    else next[periodKey] = merged;
  }
  return next;
}

/** Enable splits: move existing flat assignments into "first" for each period. */
export function flatAssignmentsToHalves(
  flat: AssignmentsMap
): AssignmentHalvesMap {
  const out: AssignmentHalvesMap = {};
  for (const [k, row] of Object.entries(flat)) {
    if (Object.keys(row).length === 0) continue;
    out[k] = { first: { ...row }, second: {} };
  }
  return out;
}

export function scrubHalvesForCategory(
  halves: AssignmentHalvesMap,
  categoryId: string
): AssignmentHalvesMap {
  const out: AssignmentHalvesMap = {};
  for (const [k, row] of Object.entries(halves)) {
    const first = { ...row.first };
    const second = { ...row.second };
    delete first[categoryId];
    delete second[categoryId];
    if (
      Object.keys(first).length === 0 &&
      Object.keys(second).length === 0
    ) {
      continue;
    }
    out[k] = { first, second };
  }
  return out;
}
