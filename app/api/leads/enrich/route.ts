import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'edge'

export const dynamic = 'force-dynamic'

async function enrichFromWebsite(website: string): Promise<{ email: string | null; instagram: string | null; facebook: string | null }> {
  const result = { email: null as string | null, instagram: null as string | null, facebook: null as string | null }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)

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
      } catch { /* try next */ }
    }
    clearTimeout(timeout)

    if (!html) return result

    const emailMatch = html.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g)
    if (emailMatch) {
      const filtered = emailMatch.filter(e =>
        !e.includes('example.com') && !e.includes('sentry') && !e.includes('wix') &&
        !e.includes('wordpress') && !e.endsWith('.png') && !e.endsWith('.jpg')
      )
      if (filtered.length) result.email = filtered[0]
    }

    const igMatch = html.match(/instagram\.com\/([a-zA-Z0-9_.]+)/i)
    if (igMatch) result.instagram = `https://instagram.com/${igMatch[1]}`

    const fbMatch = html.match(/facebook\.com\/([a-zA-Z0-9_.]+)/i)
    if (fbMatch && !fbMatch[1].startsWith('sharer') && !fbMatch[1].startsWith('share')) {
      result.facebook = `https://facebook.com/${fbMatch[1]}`
    }
  } catch { /* enrichment failed */ }

  return result
}

export async function POST(req: NextRequest) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { data: lead } = await getSupabaseAdmin().from('leads').select('website').eq('id', id).single()
  if (!lead?.website) return NextResponse.json({ error: 'No website to enrich from' }, { status: 400 })

  const enrichment = await enrichFromWebsite(lead.website)

  await getSupabaseAdmin()
    .from('leads')
    .update(enrichment)
    .eq('id', id)

  return NextResponse.json(enrichment)
}
