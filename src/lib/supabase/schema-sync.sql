-- Run in Supabase SQL Editor after docs/SUPABASE_SCHEMA.md base schema.
-- Adds multi-device sync columns, goals table, and realtime.

-- Profile extensions
alter table public.profiles add column if not exists onboarding_completed boolean not null default false;
alter table public.profiles add column if not exists preferences jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

-- Accounts (app fields)
alter table public.accounts add column if not exists kind text default 'checking';
alter table public.accounts add column if not exists color text default '#38bdf8';
alter table public.accounts add column if not exists icon text default 'Wallet';
alter table public.accounts add column if not exists currency text default 'USD';
alter table public.accounts add column if not exists hidden boolean not null default false;

-- Categories (app fields)
alter table public.categories add column if not exists icon text default 'CircleDollarSign';
alter table public.categories add column if not exists color text default '#0d9488';
alter table public.categories add column if not exists budgeted numeric default 0;

-- Transactions (store uses names for account/category)
alter table public.transactions add column if not exists account_name text;
alter table public.transactions add column if not exists category_name text;
alter table public.transactions add column if not exists recurring boolean not null default false;
alter table public.transactions add column if not exists currency text default 'USD';

-- Recurring
alter table public.recurring_rules add column if not exists paused boolean not null default false;

-- Goals
create table if not exists public.goals (
  id text primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  target_amount numeric not null default 0,
  current_amount numeric not null default 0,
  target_date date,
  icon text default 'Target',
  color text default '#0d9488',
  created_at timestamptz default now()
);

alter table public.goals enable row level security;
create policy "goals_own" on public.goals for all using (auth.uid() = profile_id);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name),
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Realtime (required for instant multi-device sync)
alter publication supabase_realtime add table public.accounts;
alter publication supabase_realtime add table public.categories;
alter publication supabase_realtime add table public.transactions;
alter publication supabase_realtime add table public.recurring_rules;
alter publication supabase_realtime add table public.goals;
alter publication supabase_realtime add table public.profiles;
