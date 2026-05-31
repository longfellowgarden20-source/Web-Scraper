-- ============================================================
--  SHOPCRAFT / AGENCY TEMPLATE — Appointment System Setup
--  Paste this entire file into Supabase SQL Editor and run it.
--  Takes ~5 seconds. Do this once per client project.
-- ============================================================


-- 1. CREATE APPOINTMENTS TABLE
-- ============================================================
create table if not exists public.appointments (
  id            uuid primary key default gen_random_uuid(),
  business_name text not null,
  service       text not null,
  date          date not null,
  time          text not null,
  name          text not null,
  email         text not null,
  phone         text not null,
  notes         text,
  status        text not null default 'pending',  -- pending | confirmed | cancelled
  created_at    timestamptz not null default now()
);


-- 2. INDEX FOR FAST DATE QUERIES
-- ============================================================
create index if not exists appointments_date_idx
  on public.appointments (date);

create index if not exists appointments_status_idx
  on public.appointments (status);


-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================================
alter table public.appointments enable row level security;


-- 4. RLS POLICIES
-- Allow anyone to insert (customers booking)
-- Only service role (your admin) can read/update/delete
-- ============================================================
drop policy if exists "Allow public insert" on public.appointments;
create policy "Allow public insert"
  on public.appointments
  for insert
  to anon
  with check (true);

drop policy if exists "Allow service role full access" on public.appointments;
create policy "Allow service role full access"
  on public.appointments
  for all
  to service_role
  using (true)
  with check (true);


-- 5. DONE — verify the table was created
-- ============================================================
select
  column_name,
  data_type,
  column_default
from information_schema.columns
where table_name = 'appointments'
order by ordinal_position;
