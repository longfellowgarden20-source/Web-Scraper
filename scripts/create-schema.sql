-- Fast Websites Scraper — full schema (extracted from live Supabase)
-- Paste into new Supabase SQL Editor and click Run

CREATE TABLE IF NOT EXISTS leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  source text,
  business_name text,
  city text,
  category text,
  website text,
  phone text,
  score integer,
  status text default 'new',
  outreach_draft text,
  notes text,
  reddit_url text,
  maps_place_id text unique,
  email text,
  instagram text,
  facebook text,
  google_rating numeric,
  google_review_count integer,
  starred boolean default false,
  called boolean default false,
  follow_up_date date,
  score_reasons text[]
);

CREATE TABLE IF NOT EXISTS previews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  lead_id uuid references leads(id) on delete cascade,
  business_name text,
  city text,
  category text,
  tagline text,
  headline text,
  subheadline text,
  services text[],
  primary_color text,
  phone text,
  email text,
  cta_text text,
  viewed boolean default false,
  viewed_at timestamptz,
  view_count integer default 0,
  payment_link text,
  business_config jsonb,
  about text,
  screenshot_url text
);

CREATE TABLE IF NOT EXISTS scrape_queries (
  id uuid primary key default gen_random_uuid(),
  query text unique,
  last_run timestamptz,
  run_count integer default 0
);

CREATE TABLE IF NOT EXISTS clients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  business_name text,
  tagline text,
  city text,
  phone text,
  email text,
  hours text,
  bot_name text,
  services text,
  faqs text,
  tone text,
  lead_capture text,
  off_limits text,
  password_hash text,
  active boolean default true
);

CREATE TABLE IF NOT EXISTS conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  client_id uuid references clients(id) on delete cascade,
  visitor_message text,
  bot_reply text
);

CREATE TABLE IF NOT EXISTS projects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  client_name text,
  client_email text,
  client_phone text,
  project_type text,
  status text,
  price numeric,
  paid boolean default false,
  deadline date,
  notes text,
  live_url text
);

CREATE TABLE IF NOT EXISTS invoices (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  project_id uuid references projects(id) on delete cascade,
  client_name text,
  client_email text,
  amount numeric,
  paid boolean default false,
  paid_at timestamptz,
  due_date date,
  notes text,
  payment_link text
);

CREATE TABLE IF NOT EXISTS estimates (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  client_id uuid references clients(id) on delete cascade,
  business_name text,
  job_description text,
  labor_hours numeric,
  labor_rate numeric,
  materials_cost numeric,
  total numeric,
  sent boolean default false
);

CREATE TABLE IF NOT EXISTS depop_listings (
  id text primary key,
  query text,
  title text,
  price real,
  description text,
  seller text,
  image_url text,
  listing_url text,
  sold integer,
  ai_match integer,
  ai_reason text,
  score integer,
  first_seen timestamptz,
  sold_at timestamptz
);

CREATE TABLE IF NOT EXISTS depop_sellers (
  username text primary key,
  match_count integer,
  last_seen timestamptz
);

CREATE TABLE IF NOT EXISTS depop_price_history (
  id bigint generated always as identity primary key,
  listing_id text references depop_listings(id) on delete cascade,
  price real,
  recorded_at timestamptz default now()
);
