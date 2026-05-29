export type PdfReportPayload = {
  title: string;
  cadence?: string;
  generatedAt?: string;
  income: number;
  expenses: number;
  net?: number;
  balance: number;
  categories: Array<{ name: string; budgeted: number; spent: number }>;
  cashflow?: Array<{ label: string; income: number; expenses: number; net: number }>;
  goals?: Array<{ name: string; current: number; target: number; pct: number }>;
  recurring?: Array<{ name: string; amount: number; cadence: string; nextDate: string }>;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function barWidth(pct: number) {
  return Math.min(100, Math.max(0, pct));
}

export function buildPdfReportHtml(body: PdfReportPayload): string {
  const period = body.title;
  const net = body.net ?? body.income - body.expenses;
  const cadenceLabel = body.cadence === "biweekly" ? "Bi-weekly view" : "Monthly view";
  const generated =
    body.generatedAt ??
    new Date().toLocaleDateString("en-US", { dateStyle: "long", timeStyle: "short" });

  const categoryRows = (body.categories ?? [])
    .map((c) => {
      const remaining = c.budgeted - c.spent;
      const pct = c.budgeted > 0 ? (c.spent / c.budgeted) * 100 : 0;
      return `<tr>
        <td>${escapeHtml(c.name)}</td>
        <td>$${c.budgeted.toFixed(2)}</td>
        <td>$${c.spent.toFixed(2)}</td>
        <td style="color:${remaining < 0 ? "#e11d48" : "#059669"}">$${remaining.toFixed(2)}</td>
        <td><div class="bar-track"><div class="bar-fill" style="width:${barWidth(pct)}%;background:${pct > 100 ? "#e11d48" : "#0ea5e9"}"></div></div></td>
      </tr>`;
    })
    .join("");

  const cashflowRows = (body.cashflow ?? [])
    .map(
      (p) => `<tr>
        <td>${escapeHtml(p.label)}</td>
        <td style="color:#059669">$${p.income.toFixed(2)}</td>
        <td style="color:#e11d48">$${p.expenses.toFixed(2)}</td>
        <td>$${p.net.toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const goalRows = (body.goals ?? [])
    .map(
      (g) => `<tr>
        <td>${escapeHtml(g.name)}</td>
        <td>$${g.current.toFixed(2)}</td>
        <td>$${g.target.toFixed(2)}</td>
        <td>${Math.round(g.pct)}%</td>
      </tr>`
    )
    .join("");

  const recurringRows = (body.recurring ?? [])
    .map(
      (r) => `<tr>
        <td>${escapeHtml(r.name)}</td>
        <td style="color:${r.amount >= 0 ? "#059669" : "#e11d48"}">$${Math.abs(r.amount).toFixed(2)}</td>
        <td>${escapeHtml(r.cadence)}</td>
        <td>${escapeHtml(r.nextDate)}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>Paycheck Planner — ${escapeHtml(period)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", system-ui, sans-serif; padding: 2rem 2.5rem; color: #0f172a; max-width: 880px; margin: 0 auto; line-height: 1.45; }
  header { display: flex; align-items: flex-end; justify-content: space-between; border-bottom: 3px solid #0ea5e9; padding-bottom: 1rem; margin-bottom: 1.75rem; }
  .brand { display: flex; align-items: center; gap: 0.75rem; }
  .logo { width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #0ea5e9, #10b981); }
  h1 { margin: 0; font-size: 1.5rem; color: #0369a1; font-weight: 700; }
  .subtitle { color: #64748b; font-size: 0.85rem; margin-top: 0.25rem; }
  .meta { text-align: right; font-size: 0.75rem; color: #94a3b8; }
  h2 { font-size: 0.95rem; margin: 1.5rem 0 0.5rem; color: #334155; font-weight: 600; }
  .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin: 1rem 0; }
  .metric { background: linear-gradient(180deg, #f8fafc, #fff); border-radius: 12px; padding: 0.85rem 1rem; border: 1px solid #e2e8f0; }
  .metric strong { display: block; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; }
  .metric span { font-size: 1.15rem; font-weight: 600; margin-top: 0.2rem; display: block; color: #0f172a; }
  table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; font-size: 0.82rem; }
  th { text-align: left; background: #f1f5f9; padding: 0.5rem 0.45rem; font-weight: 600; color: #475569; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; }
  td { border-bottom: 1px solid #e2e8f0; padding: 0.45rem; vertical-align: middle; }
  .bar-track { height: 6px; background: #e2e8f0; border-radius: 99px; overflow: hidden; min-width: 60px; }
  .bar-fill { height: 100%; border-radius: 99px; }
  footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; font-size: 0.7rem; color: #94a3b8; text-align: center; }
  @media print { body { padding: 0.75rem; } header { break-after: avoid; } }
</style></head><body>
  <header>
    <div class="brand">
      <div class="logo" aria-hidden="true"></div>
      <div>
        <h1>Paycheck Planner</h1>
        <p class="subtitle">${escapeHtml(period)} · ${cadenceLabel}</p>
      </div>
    </div>
    <p class="meta">Generated ${escapeHtml(generated)}</p>
  </header>

  <section aria-label="Summary">
    <h2>Dashboard summary</h2>
    <div class="metrics">
      <div class="metric"><strong>Net worth</strong><span>$${(body.balance ?? 0).toFixed(2)}</span></div>
      <div class="metric"><strong>Income</strong><span style="color:#059669">$${(body.income ?? 0).toFixed(2)}</span></div>
      <div class="metric"><strong>Expenses</strong><span style="color:#e11d48">$${(body.expenses ?? 0).toFixed(2)}</span></div>
      <div class="metric"><strong>Net cash flow</strong><span>$${net.toFixed(2)}</span></div>
    </div>
  </section>

  ${
    cashflowRows
      ? `<section><h2>Cash flow</h2><table><thead><tr><th>Period</th><th>Income</th><th>Expenses</th><th>Net</th></tr></thead><tbody>${cashflowRows}</tbody></table></section>`
      : ""
  }

  <section><h2>Spending breakdown</h2>
  <table>
    <thead><tr><th>Category</th><th>Budgeted</th><th>Spent</th><th>Remaining</th><th>Used</th></tr></thead>
    <tbody>${categoryRows || "<tr><td colspan='5'>No categories</td></tr>"}</tbody>
  </table></section>

  ${
    goalRows
      ? `<section><h2>Goal progress</h2><table><thead><tr><th>Goal</th><th>Saved</th><th>Target</th><th>Progress</th></tr></thead><tbody>${goalRows}</tbody></table></section>`
      : ""
  }

  ${
    recurringRows
      ? `<section><h2>Recurring overview</h2><table><thead><tr><th>Name</th><th>Amount</th><th>Cadence</th><th>Next</th></tr></thead><tbody>${recurringRows}</tbody></table></section>`
      : ""
  }

  <footer>Paycheck Planner · Calm paycheck-first budgeting · Confidential</footer>
</body></html>`;
}
