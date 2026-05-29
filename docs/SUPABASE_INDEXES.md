# Supabase indexing recommendations

Apply these in the Supabase SQL editor for production workloads.

```sql
-- Transactions: list by user, filter by date
CREATE INDEX IF NOT EXISTS idx_transactions_user_date
  ON transactions (user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_user_category
  ON transactions (user_id, category_id);

-- Accounts & categories
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts (user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories (user_id);

-- Recurring rules
CREATE INDEX IF NOT EXISTS idx_recurring_user_next
  ON recurring_rules (user_id, next_date);

-- Goals
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals (user_id);

-- Receipts metadata (if stored in DB)
CREATE INDEX IF NOT EXISTS idx_receipts_transaction
  ON transaction_receipts (transaction_id);
```

Query tips:
- Always filter by `user_id` (or `auth.uid()`) first — matches RLS and index prefix.
- Paginate transaction lists (`limit` + `range`) instead of loading full history.
- Store receipt binaries in Storage; keep DB rows as pointers only.
