import type { AppGoal, FundKind } from "@/types/app-settings";

export function fundKind(goal: AppGoal): FundKind {
  return goal.kind ?? "sinking";
}

export function isDebtFund(goal: AppGoal): boolean {
  return fundKind(goal) === "debt";
}

export function isSinkingFund(goal: AppGoal): boolean {
  return fundKind(goal) === "sinking";
}
