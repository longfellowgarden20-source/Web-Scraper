import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'edge'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Get previews that have been viewed, with their lead info
  const { data, error } = await getSupabaseAdmin()
    .from('previews')
    .select('id, lead_id, view_count, viewed_at:updated_at, leads(id, business_name, city, category, status, phone, email, instagram, score, called, outreach_draft)')
    .gt('view_count', 0)
    .order('view_count', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Dedupe by lead_id — keep the preview with highest view_count per lead
  const seen = new Set<string>()
  const deduped = (data ?? []).filter(row => {
    const leadId = row.lead_id
    if (!leadId || seen.has(leadId)) return false
    seen.add(leadId)
    return true
  })

  const result = deduped.map(row => {
    const lead = Array.isArray(row.leads) ? row.leads[0] : row.leads
    return {
      previewId: row.id,
      leadId: row.lead_id,
      viewCount: row.view_count,
      businessName: lead?.business_name ?? '—',
      city: lead?.city ?? '',
      category: lead?.category ?? '',
      status: lead?.status ?? 'new',
      phone: lead?.phone ?? null,
      email: lead?.email ?? null,
      instagram: lead?.instagram ?? null,
      score: lead?.score ?? 0,
      called: lead?.called ?? false,
      hasMessage: !!(lead?.outreach_draft),
    }
  })

  return NextResponse.json(result)
}
