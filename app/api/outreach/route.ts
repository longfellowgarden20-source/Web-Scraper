import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { id } = body

  if (!id) return NextResponse.json({ error: 'Missing lead id' }, { status: 400 })

  const { data: lead, error } = await getSupabaseAdmin().from('leads').select('*').eq('id', id).single()
  if (error || !lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  const websiteInfo = lead.website
    ? `Their current website is ${lead.website}. It has a web presence score of ${lead.score}/10 (10 = worst).`
    : `They have no website at all.`

  const sourceInfo = lead.source === 'reddit'
    ? `They posted on Reddit asking for web help.`
    : `Found via Google Maps search.`

  const reviewInfo = lead.google_review_count
    ? `They have ${lead.google_review_count} Google reviews with a ${lead.google_rating} star rating.`
    : ''

  const prompt = `You are writing a cold outreach message for a web design agency called Fast Websites (fastwebsitesagency.com).

Business details:
- Name: ${lead.business_name}
- City: ${lead.city ?? 'unknown'}
- Category: ${lead.category ?? 'local business'}
- ${websiteInfo}
- ${sourceInfo}
${reviewInfo ? `- ${reviewInfo}` : ''}

Write a short, human-sounding cold outreach message. 3-5 sentences max. Be direct and specific about why you're reaching out. Reference their business type and web situation. End with a soft call to action. Do not use generic filler phrases. Do not mention the score number. Sign off as "Fast Websites team".`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const text = await res.text()

  if (!res.ok) {
    return NextResponse.json({ error: `Groq error ${res.status}: ${text}` }, { status: 500 })
  }

  let data: { choices?: { message?: { content?: string } }[] }
  try {
    data = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: `Invalid JSON from Groq: ${text.slice(0, 200)}` }, { status: 500 })
  }

  const draft = data.choices?.[0]?.message?.content?.trim()
  if (!draft) return NextResponse.json({ error: 'Empty response from Groq' }, { status: 500 })

  await getSupabaseAdmin().from('leads').update({ outreach_draft: draft }).eq('id', id)

  return NextResponse.json({ draft })
}
