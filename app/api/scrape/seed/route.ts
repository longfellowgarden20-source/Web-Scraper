import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const CA_CITIES = [
  'Los Angeles', 'San Diego', 'San Jose', 'Fresno', 'Sacramento',
  'Long Beach', 'Oakland', 'Bakersfield', 'Anaheim', 'Riverside',
  'Stockton', 'Irvine', 'Chula Vista', 'Fontana', 'Modesto',
  'Moreno Valley', 'Glendale', 'Santa Ana', 'Oxnard', 'Garden Grove',
  'Oceanside', 'Rancho Cucamonga', 'Santa Clarita', 'Ontario', 'Elk Grove',
  'Corona', 'Salinas', 'Pomona', 'Escondido', 'Torrance',
]

const NICHES = [
  'plumber',
  'electrician',
  'HVAC contractor',
  'roofer',
  'landscaper',
  'pool service',
  'pest control',
  'auto repair shop',
  'auto detailing',
  'towing service',
  'locksmith',
  'handyman',
  'painting contractor',
  'flooring contractor',
  'fence company',
  'pressure washing',
  'window cleaning',
  'tree service',
  'concrete contractor',
  'drywall contractor',
  'tile contractor',
  'carpet cleaning',
  'junk removal',
  'moving company',
  'storage facility',
  'dog groomer',
  'dog trainer',
  'pet boarding',
  'massage therapist',
  'nail salon',
  'barber shop',
  'tattoo shop',
  'chiropractor',
  'dentist',
  'optometrist',
  'personal trainer',
  'yoga studio',
  'martial arts',
  'dance studio',
  'tutoring center',
  'daycare',
  'cleaning service',
  'laundromat',
  'tailor',
  'shoe repair',
  'appliance repair',
  'computer repair',
  'phone repair',
  'printer repair',
  'catering',
  'food truck',
  'bakery',
  'Mexican restaurant',
  'Vietnamese restaurant',
  'Thai restaurant',
  'Indian restaurant',
  'pizza place',
  'burger spot',
  'sushi restaurant',
  'Ethiopian restaurant',
  'tax preparer',
  'bookkeeper',
  'notary',
  'insurance agent',
  'real estate agent',
  'mortgage broker',
  'immigration attorney',
  'family law attorney',
  'bail bonds',
  'private investigator',
  'security guard company',
  'printing shop',
  'sign shop',
  'embroidery shop',
  'photo studio',
  'videographer',
  'DJ service',
  'party rental',
  'bounce house rental',
  'wedding planner',
  'florist',
  'event venue',
  'limousine service',
]

// Build queries: every niche × a rotating set of cities (capped to avoid 2400+ rows)
// Strategy: pair each niche with 3 spread-out cities for variety
function buildQueries(): string[] {
  const queries: string[] = []
  for (let i = 0; i < NICHES.length; i++) {
    const niche = NICHES[i]
    // Pick 3 cities spread across the array
    const cityIndices = [
      i % CA_CITIES.length,
      (i + 10) % CA_CITIES.length,
      (i + 20) % CA_CITIES.length,
    ]
    for (const ci of cityIndices) {
      queries.push(`${niche} in ${CA_CITIES[ci]}, California`)
    }
  }
  return queries
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const queries = buildQueries()
  const rows = queries.map(q => ({ query: q }))

  const { error } = await getSupabaseAdmin()
    .from('scrape_queries')
    .upsert(rows, { onConflict: 'query', ignoreDuplicates: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, inserted: rows.length })
}
