# Fast Websites — Client Lead Scraper

A private dashboard that finds potential web design clients automatically. Scrapes Google Maps for local businesses with weak/no websites, monitors Reddit for people actively looking for developers, and drafts personalized outreach for each lead using AI.

Built with Next.js — reuses auth, UI shell, upload, and data table patterns from surfonlyvintage.com.

---

## What It Does

**Google Maps Module**
- Enter a city + business type (e.g. "coffee shop Los Angeles")
- Pulls businesses from Google Maps that have no website, or a website that fails basic checks (no HTTPS, not mobile-friendly, returns 404)
- Scores each lead 1–10 based on how bad their web presence is
- Saves them to your leads table in Supabase

**Reddit Monitor**
- Watches r/entrepreneur, r/smallbusiness, r/Etsy, r/ecommerce
- Catches posts containing keywords: "need a website", "looking for a developer", "website help", "build me a site"
- Surfaces warm leads in real time — these people are already asking

**AI Outreach Drafter**
- For each lead, generates a short personalized cold email or DM
- Uses their business name, location, category, and what's weak about their site
- One click to copy — you send it manually (never auto-sends)

**Lead Dashboard**
- Table of all leads with status: `new → contacted → replied → converted → passed`
- Filter by source, status, score, city
- Add notes per lead
- Track conversion over time

---

## Stack

- **Next.js 15** (App Router) — same as surfonlyvintage
- **Supabase** — auth, leads table, storage
- **Claude API** (Anthropic) — outreach drafting
- **Google Maps Places API** — place search + details
- **Reddit API** — subreddit monitoring (free)
- **Tailwind CSS** — styling

---

## Reused from surfonlyvintage.com

The following are copied directly with minimal changes:

| What | Where it came from |
|------|--------------------|
| Google auth + session | `lib/supabase-browser.ts`, `lib/supabase-server.ts`, `context/AuthContext` |
| Admin shell + nav | `app/blackysurf09/` layout + `AdminNav.tsx` |
| Cookie-based route protection | `middleware.ts` pattern |
| Image upload + compression | `lib/compress-image.ts`, `api/upload/route.ts` |
| Data table pattern | `app/blackysurf09/customers/page.tsx` |
| API route boilerplate | Any `route.ts` file |

---

## Database Table (Supabase)

Run this SQL in your Supabase project:

```sql
create table leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  source text,               -- 'google_maps' | 'reddit'
  business_name text,
  city text,
  category text,
  website text,
  phone text,
  score int,                 -- 1-10, higher = worse web presence = hotter lead
  status text default 'new', -- new | contacted | replied | converted | passed
  outreach_draft text,
  notes text,
  reddit_url text,
  maps_place_id text unique
);
```

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in your keys
cp .env.example .env.local

# 3. Run dev server
npm run dev

# 4. Open http://localhost:3000
```

### Required API Keys (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
GOOGLE_MAPS_API_KEY=
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_USER_AGENT=FastWebsitesBot/1.0
```

**Where to get them:**
- Supabase: your project settings → API
- Anthropic: console.anthropic.com → API Keys
- Google Maps: console.cloud.google.com → Places API
- Reddit: reddit.com/prefs/apps → create a "script" app

---

## Usage

1. Sign in with Google
2. Go to **Scrape → Google Maps** — enter a city + business type → Run
3. Go to **Scrape → Reddit** — hit Sync to pull latest matching posts
4. Review new leads in the **Leads** dashboard
5. Click any lead → **Draft Outreach** → copy and send manually
6. Update the lead status as you work through outreach

---

## Project Structure

```
app/
  dashboard/          # Lead table, stats, filters
  scrape/
    maps/             # Google Maps scraper UI
    reddit/           # Reddit monitor UI
  leads/
    [id]/             # Lead detail page + outreach drafter
  api/
    scrape/
      maps/           # Calls Google Maps API, saves leads to Supabase
      reddit/         # Polls Reddit API, saves leads to Supabase
    leads/            # CRUD for leads table
    outreach/         # Calls Claude API to generate draft message
  context/
    AuthContext.tsx   # Copied from surfonly web
lib/
  supabase-browser.ts
  supabase-server.ts
  supabase-admin.ts
```

---

## Agency Info

- **Agency:** Fast Websites
- **Site:** fastwebsitesagency.com
- **Email:** fastwebsitesagency@gmail.com
- **Analytics:** Google Analytics ID `G-HLB31E84Z7`
