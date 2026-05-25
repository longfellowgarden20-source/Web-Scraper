import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const QUERIES = [
  'plumber Los Angeles',
  'electrician Houston',
  'landscaper Phoenix',
  'auto repair Chicago',
  'dentist San Diego',
  'restaurant Miami',
  'hair salon Dallas',
  'HVAC Denver',
  'plumber New York',
  'electrician Philadelphia',
  'landscaper San Antonio',
  'auto repair San Jose',
  'dentist Austin',
  'restaurant Jacksonville',
  'hair salon Fort Worth',
  'HVAC Columbus',
  'roofer Los Angeles',
  'painter Houston',
  'flooring Phoenix',
  'pest control Chicago',
  'pool service Miami',
  'towing San Diego',
  'locksmith Dallas',
  'pressure washing Denver',
  'cleaning service New York',
  'handyman Philadelphia',
  'fence company San Antonio',
  'concrete contractor San Jose',
  'tree service Austin',
  'moving company Jacksonville',
  'appliance repair Fort Worth',
  'garage door repair Columbus',
  'gutters Los Angeles',
  'window cleaning Houston',
  'carpet cleaning Phoenix',
  'junk removal Chicago',
  'dog groomer Miami',
  'tattoo shop San Diego',
  'barber shop Dallas',
  'mechanic Denver',
]

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Pick query based on current hour so each run targets something different
  const index = Math.floor(Date.now() / (1000 * 60 * 60 * 8)) % QUERIES.length
  const query = QUERIES[index]

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'

  const res = await fetch(`${baseUrl}/api/scrape/maps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  const data = await res.json()

  return NextResponse.json({ ok: true, query, ...data })
}
