-- Optional performance indexes (run after schema.sql)
create index if not exists idx_transactions_user_date on transactions (user_id, date desc);
create index if not exists idx_recurring_rules_user_active on recurring_rules (user_id, active);
create index if not exists idx_categories_user_group on categories (user_id, group_name);
