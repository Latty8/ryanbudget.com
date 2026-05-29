import { nanoid } from "nanoid";

export type SharedBudgetPayload = {
  token: string;
  title: string;
  ownerLabel: string;
  createdAt: string;
  expiresAt: string;
  categories: Array<{ name: string; budgeted: number; spent: number }>;
  recurring: Array<{ name: string; amount: number; cadence: string }>;
  goals: Array<{ name: string; current: number; target: number }>;
};

export type SharedReportPayload = {
  token: string;
  title: string;
  ownerLabel: string;
  createdAt: string;
  expiresAt: string;
  html: string;
};

const budgetShares = new Map<string, SharedBudgetPayload>();
const reportShares = new Map<string, SharedReportPayload>();

const TTL_MS = 30 * 24 * 60 * 60 * 1000;

function expiry() {
  return new Date(Date.now() + TTL_MS).toISOString();
}

export function createBudgetShare(
  data: Omit<SharedBudgetPayload, "token" | "createdAt" | "expiresAt">
): SharedBudgetPayload {
  const token = nanoid(24);
  const payload: SharedBudgetPayload = {
    ...data,
    token,
    createdAt: new Date().toISOString(),
    expiresAt: expiry(),
  };
  budgetShares.set(token, payload);
  return payload;
}

export function getBudgetShare(token: string): SharedBudgetPayload | null {
  const row = budgetShares.get(token);
  if (!row) return null;
  if (new Date(row.expiresAt).getTime() < Date.now()) {
    budgetShares.delete(token);
    return null;
  }
  return row;
}

export function createReportShare(
  data: Omit<SharedReportPayload, "token" | "createdAt" | "expiresAt">
): SharedReportPayload {
  const token = nanoid(24);
  const payload: SharedReportPayload = {
    ...data,
    token,
    createdAt: new Date().toISOString(),
    expiresAt: expiry(),
  };
  reportShares.set(token, payload);
  return payload;
}

export function getReportShare(token: string): SharedReportPayload | null {
  const row = reportShares.get(token);
  if (!row) return null;
  if (new Date(row.expiresAt).getTime() < Date.now()) {
    reportShares.delete(token);
    return null;
  }
  return row;
}
