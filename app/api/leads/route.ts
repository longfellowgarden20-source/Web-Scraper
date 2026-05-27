import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const source = searchParams.get('source')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') ?? '0')
  const pageSize = 200

  let query = getSupabaseAdmin()
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1)

  if (status && status !== 'all') query = query.eq('status', status)
  if (source && source !== 'all') query = query.eq('source', source)
  if (search) query = query.ilike('business_name', `%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const allowed = ['status', 'notes', 'outreach_draft', 'starred', 'called', 'follow_up_date']
  const filtered = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)))

  const { data, error } = await getSupabaseAdmin()
    .from('leads')
    .update(filtered)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
