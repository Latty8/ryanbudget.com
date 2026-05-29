"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type ReferralState = {
  referralCode: string;
  successfulInvites: number;
  premiumMonthsEarned: number;
  recordInvite: () => void;
};

function generateCode(): string {
  return `PP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export const useReferralStore = create<ReferralState>()(
  persist(
    (set, get) => ({
      referralCode: generateCode(),
      successfulInvites: 0,
      premiumMonthsEarned: 0,
      recordInvite: () => {
        const invites = get().successfulInvites + 1;
        const months = Math.floor(invites / 2);
        set({ successfulInvites: invites, premiumMonthsEarned: months });
      },
    }),
    { name: "paycheck-planner-referrals" }
  )
);
