# Agency Setup Guide

How to deploy this template for a new client in under 10 minutes.

---

## Step 1 — Clone the template

Duplicate this repo for each new client. Do not work directly on the template.

---

## Step 2 — Create a Supabase project

1. Go to https://supabase.com and create a new project
2. Wait for it to finish provisioning (~1 minute)
3. Go to **Settings → API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key

---

## Step 3 — Run the SQL

Go to **SQL Editor** in Supabase and paste the entire block below, then click Run.

```sql
-- ============================================================
--  AGENCY TEMPLATE — Full Appointment System Setup
--  Paste into Supabase SQL Editor and run. Takes ~5 seconds.
--  Do this once per client project.
-- ============================================================


-- 1. APPOINTMENTS TABLE
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
  status        text not null default 'pending',
  created_at    timestamptz not null default now()
);

create index if not exists appointments_date_idx
  on public.appointments (date);

create index if not exists appointments_status_idx
  on public.appointments (status);

-- Prevent double-bookings (cancelled slots can be re-booked)
create unique index if not exists appointments_date_time_unique
  on public.appointments (date, time)
  where status != 'cancelled';


-- 2. BLOCKED DATES TABLE
-- ============================================================
create table if not exists public.blocked_dates (
  id         uuid primary key default gen_random_uuid(),
  date       date not null unique,
  reason     text,
  created_at timestamptz not null default now()
);


-- 3. ROW LEVEL SECURITY
-- ============================================================
alter table public.appointments enable row level security;
alter table public.blocked_dates enable row level security;


-- 4. RLS POLICIES — APPOINTMENTS
-- Customers can insert. Only service role (admin) can read/update/delete.
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


-- 5. RLS POLICIES — BLOCKED DATES
-- Anyone can read blocked dates (booking page needs to hide them).
-- Only service role (admin) can add/remove.
-- ============================================================
drop policy if exists "Allow public read blocked_dates" on public.blocked_dates;
create policy "Allow public read blocked_dates"
  on public.blocked_dates
  for select
  to anon
  using (true);

drop policy if exists "Allow service role full access blocked_dates" on public.blocked_dates;
create policy "Allow service role full access blocked_dates"
  on public.blocked_dates
  for all
  to service_role
  using (true)
  with check (true);


-- 6. VERIFY
-- ============================================================
select table_name, column_name, data_type
from information_schema.columns
where table_name in ('appointments', 'blocked_dates')
order by table_name, ordinal_position;
```

---

## Step 4 — Configure the client

Open `config/business.ts` and fill in the client's details:

```ts
export const business = {
  // --- Branding ---
  name: 'Client Business Name',
  phone: '(555) 000-0000',
  email: 'hello@client.com',

  // --- Supabase (Settings → API in the client's Supabase project) ---
  supabaseUrl: 'https://THEIR-PROJECT.supabase.co',
  supabaseAnonKey: 'their-anon-key',
  supabaseServiceKey: 'their-service-role-key',

  // --- Admin dashboard password ---
  adminPassword: 'choose-a-strong-password',

  // --- Services shown in the booking form ---
  services: [
    'Service One',
    'Service Two',
    'Service Three',
  ],

  // --- Available days (0 = Sunday, 6 = Saturday) ---
  availableDays: [1, 2, 3, 4, 5], // Mon–Fri

  // --- Time slots ---
  timeSlots: [
    '8:00 AM',
    '9:00 AM',
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '1:00 PM',
    '2:00 PM',
    '3:00 PM',
    '4:00 PM',
  ],

  // --- How many days ahead customers can book ---
  bookingWindowDays: 60,

  // --- Google Reviews (get from Google Business Profile) ---
  // Leave as '' if not set up yet
  googleReviewUrl: '', // e.g. 'https://g.page/r/YOUR_PLACE_ID/review'
  googlePlaceId: '',   // e.g. 'ChIJ...' — used for SEO structured data
}
```

---

## Step 5 — Deploy to Vercel

1. Push the repo to GitHub
2. Import it in Vercel — no environment variables needed, all config lives in `config/business.ts`
3. Deploy

---

## What's included

| Feature | Details |
|---|---|
| Booking flow | 3-step: service → date & time → contact info |
| Double-booking prevention | UI disables taken slots + database unique index |
| Blocked dates | Admin can hide any date from the customer calendar |
| Admin dashboard | Password-gated — view, confirm, cancel, delete appointments |
| Auto-refresh | Booked slots refresh live when a customer picks a date |

---

## Admin dashboard

URL: `https://your-client-site.com/admin`

Password: whatever you set in `adminPassword` above.

**Appointments tab** — view all bookings, filter by status, search by name/email/phone, confirm or cancel individual appointments.

**Block Dates tab** — pick any date to hide it from the customer booking calendar. Add an optional reason (e.g. Holiday, Vacation). Remove blocks at any time.
