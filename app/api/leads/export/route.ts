import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const headers = [
    'business_name', 'city', 'category', 'source', 'score', 'status',
    'website', 'phone', 'email', 'instagram', 'facebook',
    'google_rating', 'google_review_count', 'reddit_url', 'notes', 'created_at',
  ]

  const rows = (data ?? []).map(lead =>
    headers.map(h => {
      const val = (lead as Record<string, unknown>)[h] ?? ''
      const str = String(val)
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str
    }).join(',')
  )

  const csv = [headers.join(','), ...rows].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
