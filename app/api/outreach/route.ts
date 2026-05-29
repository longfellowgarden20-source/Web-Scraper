import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { id, tone = 'professional' } = body

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

  const toneInstructions: Record<string, string> = {
    professional: 'Write in a professional, respectful tone. Be clear and concise. End with a soft call to action. 3-5 sentences max.',
    casual: 'Write in a friendly, conversational tone — like a fellow local business owner. Be relaxed and approachable. End with a low-pressure invitation to chat. 3-5 sentences max.',
    urgent: 'Write with a sense of urgency. Highlight what they are losing by not having a strong web presence. Be direct and confident. End with a clear, time-sensitive call to action. 3-5 sentences max.',
    sms: 'Write as a SHORT text message — max 2 sentences, 160 characters ideal. Casual, friendly, gets straight to the point. Include a question or soft CTA at the end. No sign-off needed beyond "- Fast Websites".',
  }
  const toneGuide = toneInstructions[tone] ?? toneInstructions.professional

  const prompt = `You are writing a cold outreach message for a web design agency called Fast Websites (fastwebsitesagency.com).

Business details:
- Name: ${lead.business_name}
- City: ${lead.city ?? 'unknown'}
- Category: ${lead.category ?? 'local business'}
- ${websiteInfo}
- ${sourceInfo}
${reviewInfo ? `- ${reviewInfo}` : ''}

${toneGuide} Be specific about why you're reaching out. Reference their business type and web situation. Do not use generic filler phrases. Do not mention the score number.${tone !== 'sms' ? ' Sign off as "Fast Websites team". Add a final line: "Reply STOP to opt out of future messages."' : ''}`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
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
