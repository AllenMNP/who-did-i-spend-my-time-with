-- Friend Time Tracker - Supabase schema
-- Single-user, no-auth. Run this in the Supabase SQL Editor.
-- Safe to re-run (idempotent).

-- ── Tables ────────────────────────────────────────────────────────────────
create table if not exists public.friends (
  id         uuid primary key,
  name       text not null,
  group_ids  jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id    uuid primary key,
  name  text not null,
  color text
);

create table if not exists public.groups (
  id            uuid primary key,
  name          text not null,
  color         text,
  cadence_days  integer,
  exception_ids jsonb not null default '[]'::jsonb
);

-- Backfill columns for databases created before these fields existed.
alter table public.groups add column if not exists color         text;
alter table public.groups add column if not exists cadence_days  integer;
alter table public.groups add column if not exists exception_ids jsonb not null default '[]'::jsonb;

create table if not exists public.hangouts (
  id          uuid primary key,
  friend_id   uuid references public.friends(id) on delete cascade,
  date        date,
  category_id uuid references public.categories(id) on delete set null,
  notes       text,
  hours       numeric,
  group_id    uuid,            -- session-grouping id (NOT a FK to groups)
  photos      jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists hangouts_friend_id_idx   on public.hangouts (friend_id);
create index if not exists hangouts_category_id_idx on public.hangouts (category_id);
create index if not exists hangouts_group_id_idx    on public.hangouts (group_id);

-- ── Row Level Security (permissive, single-user / no-auth) ──────────────────
-- WARNING: These policies allow anyone with the anon key full read/write.
-- Acceptable only for private, single-user personal use.
alter table public.friends    enable row level security;
alter table public.categories enable row level security;
alter table public.groups     enable row level security;
alter table public.hangouts   enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['friends','categories','groups','hangouts'] loop
    execute format('drop policy if exists anon_all on public.%I;', t);
    execute format(
      'create policy anon_all on public.%I for all to anon using (true) with check (true);', t
    );
  end loop;
end $$;
