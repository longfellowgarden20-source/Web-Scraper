import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

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
  if (!data.results) return []
  return (data.results as { place_id: string }[]).slice(0, 20).map(r => r.place_id)
}

async function getPlaceDetails(placeId: string): Promise<PlaceResult | null> {
  const fields = 'name,website,formatted_phone_number,place_id,types,formatted_address,rating,user_ratings_total'
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${MAPS_API_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  return data.result ?? null
}

async function scoreWebPresence(website: string | undefined): Promise<number> {
  if (!website) return 10

  let score = 2

  // No HTTPS
  if (!website.startsWith('https://')) score += 2

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

    // Site down or error
    if (!res.ok) { score += 4 }

    const html = await res.text()

    // Slow load (over 4 seconds)
    if (loadTime > 4000) score += 1

    // No viewport meta = not mobile friendly
    if (!html.includes('viewport')) score += 2

    // Outdated/cheap CMS detection
    if (html.includes('wp-content') || html.includes('wp-includes')) score += 1 // WordPress (not bad, but common)
    if (html.includes('wix.com') || html.includes('wixstatic')) score += 2
    if (html.includes('squarespace') || html.includes('squarespace.com')) score += 1
    if (html.includes('weebly.com') || html.includes('weeblysite')) score += 2
    if (html.includes('godaddysites') || html.includes('godaddy')) score += 2
    if (html.includes('vistasite') || html.includes('vista.com')) score += 2

    // No contact info visible
    if (!html.match(/\d{3}[-.\s]\d{3}[-.\s]\d{4}/) && !html.includes('contact')) score += 1

  } catch {
    // Site unreachable
    score += 5
  }

  return Math.min(score, 10)
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

  const placeIds = await searchPlaces(query)
  if (!placeIds.length) {
    return NextResponse.json({ saved: 0, message: 'No results found for that query.' })
  }

  const results = []

  for (const placeId of placeIds) {
    try {
      const place = await getPlaceDetails(placeId)
      if (!place) continue

      const score = await scoreWebPresence(place.website)
      if (score < 4) continue

      const enrichment = await enrichFromWebsite(place.website)
      const priority = calcPriority(score, place.user_ratings_total)

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
      }

      const { error } = await supabaseAdmin
        .from('leads')
        .upsert(lead, { onConflict: 'maps_place_id', ignoreDuplicates: false })

      if (!error) results.push(lead)
    } catch {
      // skip failed places
    }
  }

  return NextResponse.json({ saved: results.length, leads: results })
}
