# Supabase database (optional)

Google Sign-In only needs **Auth** configured in the Supabase dashboard. Budget data (transactions, accounts, etc.) is stored **per user in the browser** by default.

You only need this schema if you want cloud sync across devices (`NEXT_PUBLIC_SUPABASE_ENABLE_DATA=true`).

## Quick fix for "Could not find the table public.transactions"

**Option A — recommended:** Do nothing. Redeploy the latest app. Data saves locally; leave `NEXT_PUBLIC_SUPABASE_ENABLE_DATA` unset in `.env.production`.

**Option B — enable cloud sync later:** Run the SQL below in Supabase → SQL Editor, then set:

```env
NEXT_PUBLIC_SUPABASE_ENABLE_DATA=true
```

and rebuild (`bash deploy.sh`).

## Minimal schema (SQL editor)

```sql
-- Profiles linked to auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz default now()
);

create table if not exists public.accounts (
  id text primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  type text,
  balance numeric default 0,
  created_at timestamptz default now()
);

create table if not exists public.categories (
  id text primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  group_name text,
  monthly_target numeric default 0
);

create table if not exists public.transactions (
  id text primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  merchant text not null,
  amount numeric not null,
  transaction_date date not null,
  account_id text,
  category_id text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.recurring_rules (
  id text primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  amount numeric not null,
  cadence text,
  next_run_date date,
  account_id text,
  category_id text,
  is_income boolean default false,
  is_active boolean default true
);

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.recurring_rules enable row level security;

create policy "profiles_own" on public.profiles for all using (auth.uid() = id);
create policy "accounts_own" on public.accounts for all using (auth.uid() = profile_id);
create policy "categories_own" on public.categories for all using (auth.uid() = profile_id);
create policy "transactions_own" on public.transactions for all using (auth.uid() = profile_id);
create policy "recurring_own" on public.recurring_rules for all using (auth.uid() = profile_id);
```

After migrations, enable data sync in production env and redeploy.

## Multi-device sync extensions

After the minimal schema above, also run `src/lib/supabase/schema-sync.sql` in the SQL Editor. This adds:

- `profiles.onboarding_completed` — one-time onboarding across devices
- `profiles.preferences` — JSON preferences sync
- Extended columns on accounts, categories, transactions, recurring
- `goals` table
- Realtime publication for instant cross-device updates
- Auto-create profile trigger on `auth.users` insert

With `NEXT_PUBLIC_SUPABASE_ENABLE_DATA=true` and `SUPABASE_SERVICE_ROLE_KEY` set, the app will:

1. Pull cloud data on sign-in (remote wins when it has data)
2. Push local changes debounced (~800ms)
3. Subscribe to Supabase Realtime for live updates

