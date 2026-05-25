# CLAUDE.md — Fast Websites Client Lead Scraper

## Project Overview
Private Next.js dashboard for Fast Websites agency (fastwebsitesagency.com). Finds local business leads via Google Maps + Reddit, scores them by how bad their web presence is, and drafts AI-written cold outreach. Single user — only the agency owner logs in.

## Always Do First
- **Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.

## Code Reuse — Read Before Writing
A lot of this project is copied from `../Downloads/surfonly web/`. Before writing any of the following from scratch, read the original first:

| Need | Read this file first |
|------|----------------------|
| Supabase browser client | `../Downloads/surfonly web/lib/supabase-browser.ts` |
| Supabase server client | `../Downloads/surfonly web/lib/supabase-server.ts` |
| Supabase admin client | `../Downloads/surfonly web/lib/supabase-admin.ts` |
| Auth context (Google sign-in) | `../Downloads/surfonly web/app/context/AuthContext.tsx` |
| Middleware / route protection | `../Downloads/surfonly web/middleware.ts` |
| Image compression util | `../Downloads/surfonly web/lib/compress-image.ts` |
| File upload API route | `../Downloads/surfonly web/app/api/upload/route.ts` |
| Admin data table UI | `../Downloads/surfonly web/app/blackysurf09/customers/page.tsx` |
| Admin nav shell | `../Downloads/surfonly web/app/blackysurf09/components/AdminNav.tsx` |
| Admin layout | `../Downloads/surfonly web/app/blackysurf09/layout.tsx` |

Copy and adapt — don't rewrite from scratch.

---

## Architecture

**Auth:** Google sign-in via Supabase. Cookie-based session. All routes protected — no public pages except `/sign-in`. Single user only.

**Supabase:** Always use `supabaseAdmin` in API routes. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client. `NEXT_PUBLIC_` vars only for browser-safe keys.

**Scraper API routes** (`/api/scrape/maps`, `/api/scrape/reddit`):
- Cap results per run: max 20 Places results from Maps per request, max 25 posts from Reddit per sync
- Never block the response — return immediately, run heavy work inline but keep it bounded
- Google Maps: only request `fields=name,website,formatted_phone_number,place_id,types,formatted_address` — extra fields cost more money
- Reddit: add 1 second delay between subreddit fetches to respect rate limits

**Outreach route** (`/api/outreach`):
- Calls Claude API (`claude-haiku-4-5-20251001` — fast + cheap for short drafts)
- Output must be 3–5 sentences max — short, human-sounding cold outreach only
- Never auto-send. This route only returns a draft string. The user copies and sends manually.

**Leads table:** `status` is the source of truth. Valid values only: `new`, `contacted`, `replied`, `converted`, `passed`. Never hard-delete leads — use `passed` to dismiss.

---

## UI / Design

**Theme:** Dark, minimal, information-dense. Private internal tool — no marketing polish needed, but keep it sharp.

**Base color:** `#0a0f1a` (same dark base as surfonly)
**Accent:** `#0ea5e9` (same blue — do not invent a new palette)
**No other brand colors.** This is a tool, not a landing page.

**Status badge colors:**
- `new` → blue (`#0ea5e9`)
- `contacted` → yellow (`#f59e0b`)
- `replied` → purple (`#a855f7`)
- `converted` → green (`#22c55e`)
- `passed` → gray (`#6b7280`)

**Lead score badge:**
- 1–4 → gray (low priority)
- 5–7 → yellow (medium)
- 8–10 → red (`#ef4444`, high priority — worst web presence = best lead)

**Tables:** Compact rows, no wasted space. Prioritize showing as many leads as possible without scrolling.

---

## Anti-Generic Guardrails
- Never use default Tailwind palette (indigo-500, blue-600, etc.) — stick to the `#0ea5e9` system
- Never use `transition-all` — only animate `transform` and `opacity`
- Every clickable element needs hover + focus-visible states
- Layered box shadows with color tint, not flat `shadow-md`
- No marketing copy anywhere in the UI — labels are direct and functional

---

## Hard Rules
- Never commit API keys — all secrets in `.env.local` only, never in code
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or `ANTHROPIC_API_KEY` client-side
- Cap all external API calls — no unbounded loops
- Outreach drafter must never auto-send — draft only, user sends manually
- Do not add features not in the README without asking the user first
- `maps_place_id` has a unique index — use upsert, not insert, when saving Maps leads to avoid duplicates

---

## File Naming Conventions
Match Next.js App Router pattern from surfonly:
- Pages: `page.tsx`
- Client components with state: `[Feature]Client.tsx`
- Shared UI: `app/components/[Name].tsx`
- API routes: `app/api/[resource]/route.ts`

---

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
GOOGLE_MAPS_API_KEY
REDDIT_CLIENT_ID
REDDIT_CLIENT_SECRET
REDDIT_USER_AGENT=FastWebsitesBot/1.0
```

---

## Build Order
Start here, in this order:
1. Auth + middleware (copy from surfonly)
2. Admin shell + nav (copy from surfonly)
3. Leads table page (copy customer table pattern, adapt columns)
4. Google Maps scraper API route + UI
5. Reddit monitor API route + UI
6. Outreach drafter API route + lead detail page

## Current Status
Project just created. Nothing built yet.
