"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { CurrencyCode } from "@/types/app-settings";
import type { TransactionTag } from "@/types/finance";

export type TransactionTemplate = {
  id: string;
  label: string;
  amount: number;
  description: string;
  categoryId: string;
  accountId: string;
  tags: TransactionTag[];
  currency?: CurrencyCode;
};

type TemplatesState = {
  templates: TransactionTemplate[];
  addTemplate: (t: Omit<TransactionTemplate, "id">) => string;
  updateTemplate: (id: string, patch: Partial<Omit<TransactionTemplate, "id">>) => void;
  deleteTemplate: (id: string) => void;
};

export const useTransactionTemplatesStore = create<TemplatesState>()(
  persist(
    (set) => ({
      templates: [],
      addTemplate: (t) => {
        const id = nanoid();
        set((state) => ({ templates: [...state.templates, { ...t, id }] }));
        return id;
      },
      updateTemplate: (id, patch) =>
        set((state) => ({
          templates: state.templates.map((row) => (row.id === id ? { ...row, ...patch } : row)),
        })),
      deleteTemplate: (id) =>
        set((state) => ({ templates: state.templates.filter((row) => row.id !== id) })),
    }),
    { name: "paycheck-planner-transaction-templates" }
  )
);
