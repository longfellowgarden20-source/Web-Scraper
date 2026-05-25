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
}

async function searchPlaces(query: string): Promise<string[]> {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${MAPS_API_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  if (!data.results) return []
  return (data.results as { place_id: string }[]).slice(0, 20).map(r => r.place_id)
}

async function getPlaceDetails(placeId: string): Promise<PlaceResult | null> {
  const fields = 'name,website,formatted_phone_number,place_id,types,formatted_address'
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${MAPS_API_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  return data.result ?? null
}

async function scoreWebPresence(website: string | undefined): Promise<number> {
  if (!website) return 10

  let score = 3

  if (!website.startsWith('https://')) score += 2

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(website, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    })
    clearTimeout(timeout)

    if (!res.ok) score += 3
    const ct = res.headers.get('content-type') ?? ''
    if (!ct.includes('text/html')) score += 2
  } catch {
    score += 4
  }

  return Math.min(score, 10)
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

      const lead = {
        source: 'google_maps',
        business_name: place.name,
        city: extractCity(place.formatted_address),
        category: extractCategory(place.types),
        website: place.website ?? null,
        phone: place.formatted_phone_number ?? null,
        score,
        status: 'new',
        maps_place_id: place.place_id,
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
