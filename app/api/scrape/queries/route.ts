import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'edge'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await getSupabaseAdmin()
    .from('scrape_queries')
    .select('id, query, last_run')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const { query } = await req.json()
  if (!query?.trim()) return NextResponse.json({ error: 'Missing query' }, { status: 400 })

  // Upsert so running the same query twice doesn't create duplicates
  const { error } = await getSupabaseAdmin()
    .from('scrape_queries')
    .upsert({ query: query.trim() }, { onConflict: 'query', ignoreDuplicates: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await getSupabaseAdmin()
    .from('scrape_queries')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
