import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

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

type Enrichment = {
  email: string | null
  instagram: string | null
  facebook: string | null
}

async function searchPlaces(query: string): Promise<string[]> {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${MAPS_API_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  if (data.status === 'REQUEST_DENIED' || data.status === 'OVER_QUERY_LIMIT' || data.status === 'INVALID_REQUEST') {
    throw new Error(`Maps API: ${data.status} — ${data.error_message ?? 'no message'}`)
  }
  if (!data.results) return []
  return (data.results as { place_id: string }[]).slice(0, 20).map(r => r.place_id)
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

async function scoreWebPresence(website: string | undefined): Promise<{ score: number; reasons: string[] }> {
  if (!website) return { score: 10, reasons: ['No website'] }

  let score = 2
  const reasons: string[] = []

  if (!website.startsWith('https://')) { score += 2; reasons.push('No HTTPS') }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 7000)

    const start = Date.now()
    const res = await fetch(website, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FastWebsitesBot/1.0)' },
    })
    const loadTime = Date.now() - start
    clearTimeout(timeout)

    if (!res.ok) { score += 4; reasons.push('Site down or returning errors') }

    const html = await res.text()

    if (loadTime > 4000) { score += 1; reasons.push(`Slow load (${(loadTime / 1000).toFixed(1)}s)`) }

    if (!html.includes('viewport')) { score += 2; reasons.push('Not mobile-friendly') }

    if (html.includes('wp-content') || html.includes('wp-includes')) { score += 1; reasons.push('WordPress') }
    if (html.includes('wix.com') || html.includes('wixstatic')) { score += 2; reasons.push('Wix site') }
    if (html.includes('squarespace') || html.includes('squarespace.com')) { score += 1; reasons.push('Squarespace') }
    if (html.includes('weebly.com') || html.includes('weeblysite')) { score += 2; reasons.push('Weebly site') }
    if (html.includes('godaddysites') || html.includes('godaddy')) { score += 2; reasons.push('GoDaddy builder') }
    if (html.includes('vistasite') || html.includes('vista.com')) { score += 2; reasons.push('Vistaprint site') }

    if (!html.match(/\d{3}[-.\s]\d{3}[-.\s]\d{4}/) && !html.includes('contact')) { score += 1; reasons.push('No visible contact info') }

  } catch {
    score += 5
    reasons.push('Site unreachable')
  }

  return { score: Math.min(score, 10), reasons }
}

async function enrichFromWebsite(website: string | undefined): Promise<Enrichment> {
  const result: Enrichment = { email: null, instagram: null, facebook: null }
  if (!website) return result

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)

    // Try contact page first, fall back to homepage
    const urls = [
      website.replace(/\/$/, '') + '/contact',
      website.replace(/\/$/, '') + '/contact-us',
      website,
    ]

    let html = ''
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FastWebsitesBot/1.0)' },
        })
        if (res.ok) {
          html = await res.text()
          if (html.length > 500) break
        }
      } catch {
        // try next url
      }
    }
    clearTimeout(timeout)

    if (!html) return result

    // Extract email
    const emailMatch = html.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g)
    if (emailMatch) {
      const filtered = emailMatch.filter(e =>
        !e.includes('example.com') &&
        !e.includes('sentry') &&
        !e.includes('wix') &&
        !e.includes('wordpress') &&
        !e.endsWith('.png') &&
        !e.endsWith('.jpg')
      )
      if (filtered.length) result.email = filtered[0]
    }

    // Extract Instagram
    const igMatch = html.match(/instagram\.com\/([a-zA-Z0-9_.]+)/i)
    if (igMatch) result.instagram = `https://instagram.com/${igMatch[1]}`

    // Extract Facebook
    const fbMatch = html.match(/facebook\.com\/([a-zA-Z0-9_.]+)/i)
    if (fbMatch && !fbMatch[1].startsWith('sharer') && !fbMatch[1].startsWith('share')) {
      result.facebook = `https://facebook.com/${fbMatch[1]}`
    }
  } catch {
    // enrichment failed — return what we have
  }

  return result
}

// Higher reviews + worse website = better lead (more customers to lose)
function calcPriority(score: number, reviewCount: number | undefined): number {
  const reviewBoost = reviewCount
    ? reviewCount >= 200 ? 3
    : reviewCount >= 50 ? 2
    : reviewCount >= 10 ? 1
    : 0
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

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { query } = body

  if (!query?.trim()) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 })
  }

  // Default to California if no US state or city context is given
  const CA_PATTERN = /\b(california|CA|Los Angeles|San Diego|San Francisco|San Jose|Sacramento|Fresno|Oakland|Bakersfield|Anaheim|Riverside|Stockton|Irvine|Chula Vista|Fremont|Long Beach|Santa Ana|Modesto|Fontana)\b/i
  const focusedQuery = CA_PATTERN.test(query) ? query : `${query.trim()}, California`

  const placeIds = await searchPlaces(focusedQuery)
  if (!placeIds.length) {
    return NextResponse.json({ saved: 0, message: 'No results found for that query.' })
  }

  const results = []

  for (const placeId of placeIds) {
    try {
      const place = await getPlaceDetails(placeId)
      if (!place) continue

      const { score: rawScore, reasons: scoreReasons } = await scoreWebPresence(place.website)
      if (rawScore < 5) continue

      const enrichment = await enrichFromWebsite(place.website)
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
        email: enrichment.email,
        instagram: enrichment.instagram,
        facebook: enrichment.facebook,
        score_reasons: scoreReasons,
      }

      // Skip if phone already exists under a different place_id
      if (lead.phone) {
        const { data: existing } = await getSupabaseAdmin()
          .from('leads')
          .select('id')
          .eq('phone', lead.phone)
          .neq('maps_place_id', place.place_id)
          .limit(1)
          .single()
        if (existing) continue
      }

      const { error } = await getSupabaseAdmin()
        .from('leads')
        .upsert(lead, { onConflict: 'maps_place_id', ignoreDuplicates: false })

      if (!error) results.push(lead)
    } catch {
      // skip failed places
    }
  }

  return NextResponse.json({ saved: results.length, leads: results })
}
