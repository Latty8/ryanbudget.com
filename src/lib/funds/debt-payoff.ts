import { addMonths, format } from "date-fns";

export type DebtPayoffProjection = {
  months: number;
  payoffDate: string;
  totalInterest: number;
  totalPaid: number;
};

/** Estimate months until debt-free with fixed monthly payment and optional APR. */
export function projectDebtPayoff(input: {
  balanceRemaining: number;
  monthlyPayment: number;
  interestRateApy?: number;
  startDate?: Date;
}): DebtPayoffProjection | null {
  const balance = Math.max(0, input.balanceRemaining);
  const payment = Math.max(0, input.monthlyPayment);
  if (balance <= 0) {
    return {
      months: 0,
      payoffDate: format(input.startDate ?? new Date(), "yyyy-MM-dd"),
      totalInterest: 0,
      totalPaid: 0,
    };
  }
  if (payment <= 0) return null;

  const monthlyRate = Math.max(0, input.interestRateApy ?? 0) / 100 / 12;
  let remaining = balance;
  let months = 0;
  let totalInterest = 0;
  const maxMonths = 600;

  while (remaining > 0.005 && months < maxMonths) {
    const interest = remaining * monthlyRate;
    totalInterest += interest;
    const principal = payment - interest;
    if (principal <= 0 && monthlyRate > 0) return null;
    remaining -= principal;
    months += 1;
    if (months > 1 && remaining >= balance) return null;
  }

  if (months >= maxMonths) return null;

  const start = input.startDate ?? new Date();
  return {
    months,
    payoffDate: format(addMonths(start, months), "yyyy-MM-dd"),
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPaid: Math.round((balance + totalInterest) * 100) / 100,
  };
}

export function debtProgressPct(originalBalance: number, balanceRemaining: number): number {
  if (originalBalance <= 0) return balanceRemaining <= 0 ? 100 : 0;
  const paid = Math.max(0, originalBalance - balanceRemaining);
  return Math.min(100, (paid / originalBalance) * 100);
}
