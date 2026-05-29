-- Core schema for Paycheck-first budgeting
create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  email text not null unique,
  full_name text,
  currency text not null default 'USD',
  pay_frequency text not null default 'bi-weekly',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  type text not null check (type in ('checking','savings','credit','cash')),
  balance numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  group_name text not null,
  monthly_target numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists paychecks (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  pay_date date not null,
  period_start date not null,
  period_end date not null,
  expected_amount numeric(12,2) not null default 0,
  actual_amount numeric(12,2),
  created_at timestamptz not null default now()
);

create table if not exists recurring_rules (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  amount numeric(12,2) not null,
  cadence text not null check (cadence in ('weekly','bi-weekly','semi-monthly','monthly','yearly')),
  next_run_date date not null,
  category_id uuid references categories(id) on delete set null,
  account_id uuid references accounts(id) on delete set null,
  is_income boolean not null default false,
  is_active boolean not null default true
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  account_id uuid references accounts(id) on delete set null,
  category_id uuid references categories(id) on delete set null,
  paycheck_id uuid references paychecks(id) on delete set null,
  recurring_rule_id uuid references recurring_rules(id) on delete set null,
  merchant text not null,
  amount numeric(12,2) not null,
  transaction_date date not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  target_amount numeric(12,2) not null,
  current_amount numeric(12,2) not null default 0,
  target_date date
);
