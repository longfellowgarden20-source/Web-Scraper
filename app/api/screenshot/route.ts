import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { leadId } = await req.json()
  if (!leadId) return NextResponse.json({ error: 'Missing leadId' }, { status: 400 })

  const { data: preview } = await getSupabaseAdmin()
    .from('previews')
    .select('id')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!preview) return NextResponse.json({ error: 'No preview found for this lead' }, { status: 404 })

  const base = process.env.NEXUS_AGENCY_URL ?? 'https://nexus-agency-formore.vercel.app'
  const previewUrl = `${base}/preview/${preview.id}`
  const screenshotService = process.env.SCREENSHOT_SERVICE_URL

  if (!screenshotService) return NextResponse.json({ error: 'Screenshot service not configured' }, { status: 500 })

  const res = await fetch(`${screenshotService}/screenshot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ preview_id: preview.id, preview_url: previewUrl }),
  })

  if (!res.ok) return NextResponse.json({ error: 'Screenshot service failed' }, { status: 500 })

  const data = await res.json()
  return NextResponse.json({ screenshotUrl: data.screenshot_url })
}
