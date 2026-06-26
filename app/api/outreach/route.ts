import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'edge'

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

  const toneGuide: Record<string, string> = {
    professional: 'Professional, concise, soft CTA. 3 sentences. Sign off "Fast Websites team". End with "Reply STOP to opt out."',
    casual: 'Casual, like a local texting. Low-pressure. 3 sentences. Sign off "Fast Websites team". End with "Reply STOP to opt out."',
    urgent: 'Urgent, direct, highlight what they are losing. 3 sentences. Sign off "Fast Websites team". End with "Reply STOP to opt out."',
    sms: '2 sentences max, 160 chars, casual, end with a question. No sign-off.',
    instagram: '2 sentences, casual DM, real person tone, soft question at end. No sign-off.',
  }

  const prompt = `Write cold outreach for Fast Websites (fastwebsitesagency.com). Business: ${lead.business_name}, ${lead.city ?? 'CA'}, ${lead.category ?? 'local business'}. ${websiteInfo} ${reviewInfo} Tone: ${toneGuide[tone] ?? toneGuide.professional} No generic filler. No score numbers.`

  const groqKeys = [process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_2, process.env.GROQ_API_KEY_3].filter(Boolean) as string[]
  let draft = ''
  for (const key of groqKeys) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          max_tokens: 300,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await res.json()
      if (data?.error?.code === 'rate_limit_exceeded') continue
      const content = data.choices?.[0]?.message?.content?.trim()
      if (content) { draft = content; break }
    } catch { continue }
  }
  if (!draft) return NextResponse.json({ error: 'All Groq keys rate limited or failed' }, { status: 500 })

  await getSupabaseAdmin().from('leads').update({ outreach_draft: draft }).eq('id', id)


  return NextResponse.json({ draft })
}
