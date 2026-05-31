import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// Max previews to generate per cron run — keeps execution under Vercel's 60s limit
const BATCH_SIZE = 5

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find leads that have no preview row yet and aren't passed/converted
  // Use a left join via RPC isn't available so we pull existing preview lead_ids first
  const { data: existingPreviews } = await getSupabaseAdmin()
    .from('previews')
    .select('lead_id')
    .limit(2000)

  const alreadyDone = new Set((existingPreviews ?? []).map((p: { lead_id: string }) => p.lead_id))

  const { data: allLeads, error } = await getSupabaseAdmin()
    .from('leads')
    .select('id, business_name')
    .not('status', 'in', '("passed","converted")')
    .order('score', { ascending: false })
    .limit(50) // fetch more than batch so we can filter

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const leads = (allLeads ?? [])
    .filter((l: { id: string; business_name: string }) => !alreadyDone.has(l.id))
    .slice(0, BATCH_SIZE)

  if (!leads.length) return NextResponse.json({ ok: true, generated: 0, message: 'No leads need previews' })

  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'

  const results: { id: string; name: string; ok: boolean; url?: string }[] = []

  for (const lead of leads) {
    try {
      const res = await fetch(`${baseUrl}/api/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id }),
      })
      const data = await res.json()
      results.push({ id: lead.id, name: lead.business_name, ok: res.ok, url: data.previewUrl })
    } catch {
      results.push({ id: lead.id, name: lead.business_name, ok: false })
    }
  }

  const generated = results.filter(r => r.ok).length
  return NextResponse.json({ ok: true, generated, total: leads.length, results })
}
