import { NextRequest, NextResponse } from 'next/server'
import { business } from '../../../config/business'

const serviceHeaders = {
  apikey: business.supabaseServiceKey,
  Authorization: `Bearer ${business.supabaseServiceKey}`,
  'Content-Type': 'application/json',
}

const anonHeaders = {
  apikey: business.supabaseAnonKey,
  Authorization: `Bearer ${business.supabaseAnonKey}`,
  'Content-Type': 'application/json',
}

// Public: get all approved reviews — email is never included
export async function GET() {
  const res = await fetch(
    `${business.supabaseUrl}/rest/v1/reviews?select=id,name,rating,comment,created_at&approved=eq.true&order=created_at.desc`,
    { headers: anonHeaders, cache: 'no-store' }
  )
  if (!res.ok) return NextResponse.json({ error: 'fetch failed' }, { status: 500 })
  const data = await res.json()
  return NextResponse.json({ reviews: data })
}

// Public: submit a new review (unapproved by default)
export async function POST(req: NextRequest) {
  const { name, email, rating, comment } = await req.json()
  if (!name || !email || !rating || !comment) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 })
  }
  const res = await fetch(`${business.supabaseUrl}/rest/v1/reviews`, {
    method: 'POST',
    headers: { ...anonHeaders, Prefer: 'return=minimal' },
    body: JSON.stringify({ name, email, rating, comment }),
  })
  if (!res.ok) return NextResponse.json({ error: 'insert failed' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// Admin: approve or delete a review
export async function PATCH(req: NextRequest) {
  const { id, approved } = await req.json()
  const res = await fetch(`${business.supabaseUrl}/rest/v1/reviews?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...serviceHeaders, Prefer: 'return=minimal' },
    body: JSON.stringify({ approved }),
  })
  if (!res.ok) return NextResponse.json({ error: 'update failed' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const res = await fetch(`${business.supabaseUrl}/rest/v1/reviews?id=eq.${id}`, {
    method: 'DELETE',
    headers: serviceHeaders,
  })
  if (!res.ok) return NextResponse.json({ error: 'delete failed' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// Admin: get all reviews (approved + pending)
export async function PUT() {
  const res = await fetch(
    `${business.supabaseUrl}/rest/v1/reviews?select=*&order=created_at.desc`,
    { headers: serviceHeaders, cache: 'no-store' }
  )
  if (!res.ok) return NextResponse.json({ error: 'fetch failed' }, { status: 500 })
  const data = await res.json()
  return NextResponse.json({ reviews: data })
}
