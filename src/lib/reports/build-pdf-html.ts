export type PdfReportPayload = {
  title: string;
  reportKind?: "dashboard" | "reports" | "review";
  cadence?: string;
  generatedAt?: string;
  income: number;
  expenses: number;
  net?: number;
  balance: number;
  savingsRate?: number;
  categories: Array<{ name: string; budgeted: number; spent: number }>;
  cashflow?: Array<{ label: string; income: number; expenses: number; net: number }>;
  topSpend?: Array<{ name: string; spent: number; pct: number }>;
  goals?: Array<{ name: string; current: number; target: number; pct: number }>;
  recurring?: Array<{ name: string; amount: number; cadence: string; nextDate: string }>;
  insights?: string[];
  netWorth?: number;
  netWorthChange?: number;
  spendingChart?: Array<{ name: string; spent: number; pct: number }>;
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

function money(n: unknown) {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return v.toFixed(2);
}

function formatGeneratedAt(iso?: string) {
  const date = iso ? new Date(iso) : new Date();
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

export function buildPdfReportHtml(body: PdfReportPayload): string {
  const period = body.title;
  const net = body.net ?? body.income - body.expenses;
  const cadenceLabel =
    body.cadence === "biweekly"
      ? "Bi-weekly view"
      : body.reportKind === "review"
        ? "Period review"
        : "Monthly view";
  const kindLabel =
    body.reportKind === "review"
      ? "Financial review"
      : body.reportKind === "dashboard"
        ? "Dashboard snapshot"
        : "Financial report";
  const generated = body.generatedAt ? formatGeneratedAt(body.generatedAt) : formatGeneratedAt();

  const categoryRows = (body.categories ?? [])
    .map((c) => {
      const remaining = c.budgeted - c.spent;
      const pct = c.budgeted > 0 ? (c.spent / c.budgeted) * 100 : 0;
      return `<tr>
        <td>${escapeHtml(c.name)}</td>
        <td>$${money(c.budgeted)}</td>
        <td>$${money(c.spent)}</td>
        <td style="color:${remaining < 0 ? "#e11d48" : "#059669"}">$${money(remaining)}</td>
        <td><div class="bar-track"><div class="bar-fill" style="width:${barWidth(pct)}%;background:${pct > 100 ? "#e11d48" : "#0ea5e9"}"></div></div></td>
      </tr>`;
    })
    .join("");

  const cashflowRows = (body.cashflow ?? [])
    .map(
      (p) => `<tr>
        <td>${escapeHtml(p.label)}</td>
        <td style="color:#059669">$${money(p.income)}</td>
        <td style="color:#e11d48">$${money(p.expenses)}</td>
        <td>$${money(p.net)}</td>
      </tr>`
    )
    .join("");

  const goalRows = (body.goals ?? [])
    .map(
      (g) => `<tr>
        <td>${escapeHtml(g.name)}</td>
        <td>$${money(g.current)}</td>
        <td>$${money(g.target)}</td>
        <td>${Math.round(Number.isFinite(g.pct) ? g.pct : 0)}%</td>
      </tr>`
    )
    .join("");

  const topSpendRows = (body.topSpend ?? [])
    .map(
      (c) => `<tr>
        <td>${escapeHtml(c.name)}</td>
        <td>$${money(c.spent)}</td>
        <td>${Math.round(Number.isFinite(c.pct) ? c.pct : 0)}%</td>
        <td><div class="bar-track"><div class="bar-fill" style="width:${barWidth(c.pct)}%"></div></div></td>
      </tr>`
    )
    .join("");

  const insightList = (body.insights ?? [])
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("");

  const spendingChartBars = (body.spendingChart ?? [])
    .map(
      (c) => `<div class="chart-row">
        <span class="chart-label">${escapeHtml(c.name)}</span>
        <div class="bar-track chart-bar"><div class="bar-fill" style="width:${barWidth(c.pct)}%"></div></div>
        <span class="chart-val">$${money(c.spent).replace(/\.00$/, "")} (${Math.round(Number.isFinite(c.pct) ? c.pct : 0)}%)</span>
      </div>`
    )
    .join("");

  const recurringRows = (body.recurring ?? [])
    .map(
      (r) => `<tr>
        <td>${escapeHtml(r.name)}</td>
        <td style="color:${r.amount >= 0 ? "#059669" : "#e11d48"}">$${money(Math.abs(Number(r.amount) || 0))}</td>
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
  .chart-row { display: grid; grid-template-columns: 7rem 1fr 5rem; gap: 0.5rem; align-items: center; margin: 0.35rem 0; font-size: 0.78rem; }
  .chart-label { color: #475569; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .chart-bar { min-width: 80px; }
  .chart-val { text-align: right; color: #64748b; font-size: 0.72rem; tabular-nums; }
  footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; font-size: 0.7rem; color: #94a3b8; text-align: center; }
  @media print { body { padding: 0.75rem; } header { break-after: avoid; } }
</style></head><body>
  <header>
    <div class="brand">
      <div class="logo" aria-hidden="true"></div>
      <div>
        <h1>Paycheck Planner</h1>
        <p class="subtitle">${escapeHtml(kindLabel)} · ${escapeHtml(period)} · ${cadenceLabel}</p>
      </div>
    </div>
    <p class="meta">Generated ${escapeHtml(generated)}</p>
  </header>

  <section aria-label="Summary">
    <h2>Summary</h2>
    <div class="metrics">
      <div class="metric"><strong>Balance</strong><span>$${money(body.balance)}</span></div>
      <div class="metric"><strong>Income</strong><span style="color:#059669">$${money(body.income)}</span></div>
      <div class="metric"><strong>Expenses</strong><span style="color:#e11d48">$${money(body.expenses)}</span></div>
      <div class="metric"><strong>Net</strong><span style="color:${net >= 0 ? "#059669" : "#e11d48"}">$${money(net)}</span></div>
    </div>
    ${
      body.savingsRate != null
        ? `<p style="margin-top:0.75rem;font-size:0.85rem;color:#64748b">Savings rate: <strong>${Math.round(Number.isFinite(body.savingsRate) ? body.savingsRate : 0)}%</strong> of income</p>`
        : ""
    }
    ${
      body.netWorth != null
        ? `<p style="margin-top:0.5rem;font-size:0.85rem;color:#64748b">Net worth: <strong>$${money(body.netWorth)}</strong>${
            body.netWorthChange != null
              ? ` <span style="color:${body.netWorthChange >= 0 ? "#059669" : "#e11d48"}">(${body.netWorthChange >= 0 ? "+" : ""}$${money(body.netWorthChange)} vs prior snapshot)</span>`
              : ""
          }</p>`
        : ""
    }
  </section>

  ${
    spendingChartBars
      ? `<section><h2>Spending by category</h2><div style="margin-top:0.5rem">${spendingChartBars}</div></section>`
      : ""
  }

  ${
    insightList
      ? `<section><h2>Insights</h2><ul style="margin:0.5rem 0;padding-left:1.25rem;font-size:0.85rem;color:#475569">${insightList}</ul></section>`
      : ""
  }

  ${
    topSpendRows
      ? `<section><h2>Top spending</h2><table><thead><tr><th>Category</th><th>Spent</th><th>Share</th><th></th></tr></thead><tbody>${topSpendRows}</tbody></table></section>`
      : ""
  }

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
