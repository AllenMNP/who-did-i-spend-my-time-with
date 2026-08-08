-- Migration: restore group fields dropped during the initial migration.
-- Run this in the Supabase SQL Editor on an existing project, then re-run
-- supabase/seed.sql to backfill the values from your latest backup.
alter table public.groups add column if not exists color         text;
alter table public.groups add column if not exists cadence_days  integer;
alter table public.groups add column if not exists exception_ids jsonb not null default '[]'::jsonb;
