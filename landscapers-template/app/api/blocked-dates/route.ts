import { NextRequest, NextResponse } from 'next/server'
import { business } from '../../../config/business'

const headers = {
  apikey: business.supabaseServiceKey,
  Authorization: `Bearer ${business.supabaseServiceKey}`,
  'Content-Type': 'application/json',
}

export async function GET() {
  const res = await fetch(
    `${business.supabaseUrl}/rest/v1/blocked_dates?select=date&order=date.asc`,
    { headers, cache: 'no-store' }
  )
  if (!res.ok) return NextResponse.json({ error: 'fetch failed' }, { status: 500 })
  const rows: { date: string }[] = await res.json()
  return NextResponse.json({ dates: rows.map((r) => r.date) })
}

export async function POST(req: NextRequest) {
  const { date, reason } = await req.json()
  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })
  const res = await fetch(`${business.supabaseUrl}/rest/v1/blocked_dates`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({ date, reason: reason ?? null }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    if (body?.code === '23505') return NextResponse.json({ error: 'already_blocked' }, { status: 409 })
    return NextResponse.json({ error: 'insert failed' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })
  const res = await fetch(
    `${business.supabaseUrl}/rest/v1/blocked_dates?date=eq.${date}`,
    { method: 'DELETE', headers }
  )
  if (!res.ok) return NextResponse.json({ error: 'delete failed' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
