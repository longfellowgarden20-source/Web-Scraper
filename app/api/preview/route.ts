import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const INDUSTRY_COLORS: Record<string, string> = {
  plumber: '#1d4ed8',
  plumbing: '#1d4ed8',
  electrician: '#ca8a04',
  electrical: '#ca8a04',
  restaurant: '#dc2626',
  food: '#dc2626',
  landscap: '#16a34a',
  lawn: '#16a34a',
  salon: '#9333ea',
  hair: '#9333ea',
  beauty: '#9333ea',
  hvac: '#0891b2',
  roofing: '#b45309',
  roofer: '#b45309',
  cleaning: '#0284c7',
  contractor: '#374151',
  construction: '#374151',
  painter: '#6d28d9',
  painting: '#6d28d9',
  mechanic: '#1f2937',
  auto: '#1f2937',
  dental: '#0ea5e9',
  dentist: '#0ea5e9',
  medical: '#0ea5e9',
  gym: '#ea580c',
  fitness: '#ea580c',
}

function getColor(category: string): string {
  const lower = (category ?? '').toLowerCase()
  for (const [key, color] of Object.entries(INDUSTRY_COLORS)) {
    if (lower.includes(key)) return color
  }
  return '#0ea5e9'
}

export async function GET(req: NextRequest) {
  const leadId = req.nextUrl.searchParams.get('leadId')
  if (!leadId) return NextResponse.json({ error: 'Missing leadId' }, { status: 400 })

  const { data } = await getSupabaseAdmin()
    .from('previews')
    .select('id, viewed, view_count')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!data) return NextResponse.json(null)

  const previewUrl = `${process.env.NEXUS_AGENCY_URL ?? 'https://nexus-agency-formore-cvufrmzih.vercel.app'}/preview/${data.id}`
  return NextResponse.json({ previewUrl, viewed: data.viewed, viewCount: data.view_count ?? 0 })
}

export async function POST(req: NextRequest) {
  const { leadId, colorOverride, template = 'modern' } = await req.json()
  if (!leadId) return NextResponse.json({ error: 'Missing leadId' }, { status: 400 })

  const { data: lead, error } = await getSupabaseAdmin()
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single()

  if (error || !lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  const primaryColor = (colorOverride && /^#[0-9a-fA-F]{6}$/.test(colorOverride))
    ? colorOverride
    : getColor(lead.category ?? '')

  const prompt = `You are helping build a website preview for a local business. Generate website copy for this business.

Business details:
- Name: ${lead.business_name}
- Type: ${lead.category ?? 'local business'}
- City: ${lead.city ?? 'your area'}
- Phone: ${lead.phone ?? 'call us'}

Return ONLY valid JSON in exactly this format, no extra text:
{
  "headline": "short punchy headline, 6-10 words, specific to their business type",
  "tagline": "one sentence tagline, 10-15 words, mention their city",
  "subheadline": "2 sentences describing what makes them great and why customers should choose them",
  "services": ["service 1", "service 2", "service 3", "service 4", "service 5"],
  "cta_text": "3-4 word call to action button text",
  "about": "2-3 sentences about this type of business, friendly and trustworthy tone, mention the city"
}`

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const groqText = await groqRes.text()
  if (!groqRes.ok) return NextResponse.json({ error: `Groq error: ${groqText}` }, { status: 500 })

  let groqData: { choices?: { message?: { content?: string } }[] }
  try { groqData = JSON.parse(groqText) } catch {
    return NextResponse.json({ error: 'Invalid Groq response' }, { status: 500 })
  }

  const content = groqData.choices?.[0]?.message?.content?.trim() ?? ''

  let generated: {
    headline: string; tagline: string; subheadline: string
    services: string[]; cta_text: string; about: string
  }

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    generated = JSON.parse(jsonMatch?.[0] ?? content)
  } catch {
    return NextResponse.json({ error: `Could not parse Groq JSON: ${content.slice(0, 200)}` }, { status: 500 })
  }

  const { data: preview, error: insertError } = await getSupabaseAdmin()
    .from('previews')
    .insert({
      lead_id: leadId,
      business_name: lead.business_name,
      city: lead.city,
      category: lead.category,
      tagline: generated.tagline,
      headline: generated.headline,
      subheadline: generated.subheadline,
      services: generated.services,
      primary_color: primaryColor,
      phone: lead.phone,
      email: lead.email,
      cta_text: generated.cta_text,
      about: generated.about,
    })
    .select()
    .single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  const base = process.env.NEXUS_AGENCY_URL ?? 'https://nexus-agency-formore-cvufrmzih.vercel.app'
  const previewUrl = `${base}/preview/${preview.id}${template !== 'modern' ? `?t=${template}` : ''}`

  return NextResponse.json({ previewUrl, previewId: preview.id })
}
