import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { id } = body

  if (!id) return NextResponse.json({ error: 'Missing lead id' }, { status: 400 })

  const { data: lead, error } = await supabaseAdmin.from('leads').select('*').eq('id', id).single()
  if (error || !lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  const websiteInfo = lead.website
    ? `Their current website is ${lead.website}. It has a web presence score of ${lead.score}/10 (10 = worst).`
    : `They have no website at all.`

  const sourceInfo = lead.source === 'reddit'
    ? `They posted on Reddit asking for web help.`
    : `Found via Google Maps search.`

  const prompt = `You are writing a cold outreach message for a web design agency called Fast Websites (fastwebsitesagency.com).

Business details:
- Name: ${lead.business_name}
- City: ${lead.city ?? 'unknown'}
- Category: ${lead.category ?? 'local business'}
- ${websiteInfo}
- ${sourceInfo}

Write a short, human-sounding cold outreach message. 3-5 sentences max. Be direct and specific about why you're reaching out. Reference their business type and web situation. End with a soft call to action. Do not use generic filler phrases. Do not mention the score number. Sign off as "Fast Websites team".`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  })

  const draft = (message.content[0] as { type: string; text: string }).text.trim()

  await supabaseAdmin.from('leads').update({ outreach_draft: draft }).eq('id', id)

  return NextResponse.json({ draft })
}
