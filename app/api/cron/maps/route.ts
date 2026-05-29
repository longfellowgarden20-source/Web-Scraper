import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY!

type PlaceResult = {
  place_id: string
  name: string
  formatted_address?: string
  formatted_phone_number?: string
  website?: string
  types?: string[]
  rating?: number
  user_ratings_total?: number
}

async function searchPlaces(query: string): Promise<PlaceResult[]> {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${MAPS_API_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  if (data.status === 'REQUEST_DENIED' || data.status === 'OVER_QUERY_LIMIT' || data.status === 'INVALID_REQUEST') {
    throw new Error(`Maps API: ${data.status} — ${data.error_message ?? 'no message'}`)
  }
  return (data.results ?? []) as PlaceResult[]
}

async function getPlaceDetails(placeId: string): Promise<PlaceResult | null> {
  const fields = 'name,website,formatted_phone_number,place_id,types,formatted_address,rating,user_ratings_total'
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${MAPS_API_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  if (data.status === 'REQUEST_DENIED' || data.status === 'OVER_QUERY_LIMIT' || data.status === 'INVALID_REQUEST') {
    throw new Error(`Maps API: ${data.status} — ${data.error_message ?? 'no message'}`)
  }
  return data.result ?? null
}

async function generateDraft(place: PlaceResult): Promise<string | null> {
  const websiteInfo = place.website
    ? `They have a website (${place.website}) that looks low quality or outdated.`
    : `They have no website at all.`

  const reviewInfo = place.user_ratings_total
    ? `They have ${place.user_ratings_total} Google reviews and a ${place.rating} star rating — people clearly find them, but their web presence doesn't match.`
    : ''

  const prompt = `You write cold outreach for a web design agency called Fast Websites (fastwebsitesagency.com).

Business: ${place.name}
Location: ${place.formatted_address ?? 'California'}
Type: ${place.types?.slice(0, 2).join(', ') ?? 'local business'}
Web situation: ${websiteInfo}
${reviewInfo}

Write a short casual outreach message. Rules:
- 2-3 sentences max
- Sound like a real person texting, not a marketer
- Mention something specific about their situation (no website, or bad website)
- Don't use their name or act like you know them personally
- No fluff like "I hope this finds you well" or "I came across your business"
- End with a simple low-pressure question
- No sign-off needed`

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 150,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() ?? null
  } catch {
    return null
  }
}

async function enrichFromWebsite(website: string): Promise<{ email: string | null; instagram: string | null; facebook: string | null }> {
  const result = { email: null as string | null, instagram: null as string | null, facebook: null as string | null }
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)
    const urls = [website.replace(/\/$/, '') + '/contact', website.replace(/\/$/, '') + '/contact-us', website]
    let html = ''
    for (const url of urls) {
      try {
        const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FastWebsitesBot/1.0)' } })
        if (res.ok) { html = await res.text(); if (html.length > 500) break }
      } catch { /* try next */ }
    }
    clearTimeout(timeout)
    if (!html) return result
    const emailMatch = html.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g)
    if (emailMatch) {
      const filtered = emailMatch.filter(e => !e.includes('example.com') && !e.includes('sentry') && !e.includes('wix') && !e.includes('wordpress') && !e.endsWith('.png') && !e.endsWith('.jpg'))
      if (filtered.length) result.email = filtered[0]
    }
    const igMatch = html.match(/instagram\.com\/([a-zA-Z0-9_.]+)/i)
    if (igMatch) result.instagram = `https://instagram.com/${igMatch[1]}`
    const fbMatch = html.match(/facebook\.com\/([a-zA-Z0-9_.]+)/i)
    if (fbMatch && !fbMatch[1].startsWith('sharer') && !fbMatch[1].startsWith('share')) result.facebook = `https://facebook.com/${fbMatch[1]}`
  } catch { /* enrichment failed */ }
  return result
}

// Fast score — no HTTP fetches, based only on what Maps tells us
// Returns score (higher = worse web presence = better lead) and reasons
function fastScore(place: PlaceResult): { score: number; reasons: string[] } {
  const reasons: string[] = []
  let score = 0

  if (!place.website) {
    score += 10
    reasons.push('No website')
    return { score: 10, reasons }
  }

  // Has a website — start at 3, add points for bad signals
  score = 3
  if (!place.website.startsWith('https://')) { score += 1; reasons.push('No HTTPS') }
  if (place.website.includes('wix.com') || place.website.includes('wixstatic')) { score += 2; reasons.push('Wix site') }
  if (place.website.includes('godaddysites') || place.website.includes('godaddy')) { score += 2; reasons.push('GoDaddy builder') }
  if (place.website.includes('weebly.com')) { score += 2; reasons.push('Weebly site') }
  if (place.website.includes('vistasite') || place.website.includes('vista.com')) { score += 2; reasons.push('Vistaprint site') }
  if (place.website.includes('squarespace.com')) { score += 1; reasons.push('Squarespace') }
  if (place.website.includes('wp-content') || place.website.includes('wordpress')) { score += 1; reasons.push('WordPress') }

  return { score: Math.min(score, 10), reasons }
}

function calcPriority(score: number, reviewCount: number | undefined): number {
  const reviewBoost = reviewCount
    ? reviewCount >= 200 ? 3 : reviewCount >= 50 ? 2 : reviewCount >= 10 ? 1 : 0
    : 0
  return Math.min(score + reviewBoost, 10)
}

function extractCity(address: string | undefined): string {
  if (!address) return ''
  const parts = address.split(',')
  return parts.length >= 2 ? parts[parts.length - 3]?.trim() ?? parts[0].trim() : parts[0].trim()
}

function extractCategory(types: string[] | undefined): string {
  if (!types?.length) return 'Business'
  const skip = ['establishment', 'point_of_interest', 'food', 'store']
  const best = types.find(t => !skip.includes(t))
  return (best ?? types[0]).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Pick the least-recently-run query
  const { data: queryRow, error: queryError } = await getSupabaseAdmin()
    .from('scrape_queries')
    .select('id, query')
    .order('last_run', { ascending: true, nullsFirst: true })
    .limit(1)
    .single()

  if (queryError || !queryRow) {
    return NextResponse.json({ error: 'No queries available' }, { status: 500 })
  }

  // Mark as run immediately so parallel crons don't double-run it
  await getSupabaseAdmin()
    .from('scrape_queries')
    .update({ last_run: new Date().toISOString() })
    .eq('id', queryRow.id)

  let searchResults: PlaceResult[]
  try {
    searchResults = await searchPlaces(queryRow.query)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }

  if (!searchResults.length) {
    return NextResponse.json({ ok: true, query: queryRow.query, saved: 0, message: 'No results' })
  }

  // Check which place_ids already exist so we skip the Details API call entirely
  const placeIds = searchResults.map(r => r.place_id).filter(Boolean)
  const { data: existingRows } = await getSupabaseAdmin()
    .from('leads')
    .select('maps_place_id')
    .in('maps_place_id', placeIds)

  const existingIds = new Set((existingRows ?? []).map(r => r.maps_place_id))
  const newPlaces = searchResults.filter(r => !existingIds.has(r.place_id))

  if (!newPlaces.length) {
    return NextResponse.json({ ok: true, query: queryRow.query, saved: 0, message: 'All already saved' })
  }

  const saved: string[] = []

  for (const partial of newPlaces) {
    try {
      // Get full details only for new places
      const place = await getPlaceDetails(partial.place_id)
      if (!place) continue

      const { score: rawScore, reasons: scoreReasons } = fastScore(place)

      // Skip only truly great websites (score 1-2 = actively good site, not worth contacting)
      if (rawScore <= 2) continue

      const priority = calcPriority(rawScore, place.user_ratings_total)

      const lead = {
        source: 'google_maps',
        business_name: place.name,
        city: extractCity(place.formatted_address),
        category: extractCategory(place.types),
        website: place.website ?? null,
        phone: place.formatted_phone_number ?? null,
        score: priority,
        status: 'new',
        maps_place_id: place.place_id,
        google_rating: place.rating ?? null,
        google_review_count: place.user_ratings_total ?? null,
        email: null,
        instagram: null,
        facebook: null,
        score_reasons: scoreReasons,
      }

      const { error } = await getSupabaseAdmin()
        .from('leads')
        .upsert(lead, { onConflict: 'maps_place_id', ignoreDuplicates: true })

      if (!error) {
        saved.push(place.name)
        // Enrich with email/instagram/facebook from their website
        if (place.website) {
          const enrichment = await enrichFromWebsite(place.website)
          if (enrichment.email || enrichment.instagram || enrichment.facebook) {
            await getSupabaseAdmin()
              .from('leads')
              .update(enrichment)
              .eq('maps_place_id', place.place_id)
          }
        }

        // Auto-generate personalized outreach draft
        const draft = await generateDraft(place)
        if (draft) {
          await getSupabaseAdmin()
            .from('leads')
            .update({ outreach_draft: draft })
            .eq('maps_place_id', place.place_id)
        }
      }
    } catch {
      // skip failed places silently
    }
  }

  return NextResponse.json({ ok: true, query: queryRow.query, saved: saved.length, leads: saved })
}
