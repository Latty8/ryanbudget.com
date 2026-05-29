/** One-line note comparing current period total to the immediately prior budget period. */
export function priorPeriodDeltaNote(
  prevTotal: number,
  currTotal: number,
  preferLower: boolean
): { text: string; className: string } | undefined {
  if (prevTotal === 0 && currTotal === 0) return undefined;
  if (prevTotal === 0) {
    return {
      text: "New vs prior period",
      className: "text-[var(--muted)]",
    };
  }
  const pct = ((currTotal - prevTotal) / prevTotal) * 100;
  const rounded = pct >= 0 ? `+${pct.toFixed(0)}` : pct.toFixed(0);
  const improved = preferLower ? currTotal < prevTotal : currTotal > prevTotal;
  const worse = preferLower ? currTotal > prevTotal : currTotal < prevTotal;
  let className = "text-[var(--muted)]";
  if (improved) className = "text-positive";
  else if (worse) className = "text-negative";
  return { text: `${rounded}% vs prior period`, className };
}
