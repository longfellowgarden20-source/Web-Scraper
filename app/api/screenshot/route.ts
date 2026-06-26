import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'edge'

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

  let res: Response
  try {
    res = await fetch(`${screenshotService}/screenshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preview_id: preview.id, preview_url: previewUrl }),
    })
  } catch {
    return NextResponse.json({ error: 'Screenshot service unreachable' }, { status: 502 })
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    return NextResponse.json({ error: `Screenshot service failed: ${errText.slice(0, 100)}` }, { status: 502 })
  }

  const data = await res.json()
  if (!data.screenshot_url) return NextResponse.json({ error: 'Screenshot service returned no URL' }, { status: 500 })
  return NextResponse.json({ screenshotUrl: data.screenshot_url })
}
