import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Pick the query that was run least recently (or never)
  const { data, error } = await supabaseAdmin
    .from('scrape_queries')
    .select('id, query')
    .order('last_run', { ascending: true, nullsFirst: true })
    .limit(1)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'No queries available' }, { status: 500 })
  }

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'

  const res = await fetch(`${baseUrl}/api/scrape/maps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: data.query }),
  })
  const result = await res.json()

  // Mark this query as just run
  await supabaseAdmin
    .from('scrape_queries')
    .update({ last_run: new Date().toISOString() })
    .eq('id', data.id)

  return NextResponse.json({ ok: true, query: data.query, ...result })
}
