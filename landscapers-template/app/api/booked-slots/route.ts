import { NextRequest, NextResponse } from 'next/server'
import { business } from '../../../config/business'

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })

  const res = await fetch(
    `${business.supabaseUrl}/rest/v1/appointments?select=time&date=eq.${date}&status=neq.cancelled`,
    {
      headers: {
        apikey: business.supabaseServiceKey,
        Authorization: `Bearer ${business.supabaseServiceKey}`,
      },
      cache: 'no-store',
    }
  )

  if (!res.ok) return NextResponse.json({ error: 'fetch failed' }, { status: 500 })

  const rows: { time: string }[] = await res.json()
  return NextResponse.json({ times: rows.map((r) => r.time) })
}
