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

  const name = lead.business_name
  const city = lead.city ?? ''
  const reviews = lead.google_review_count
  const rating = lead.google_rating
  const hasWebsite = !!lead.website

  const reviewLine = reviews && rating
    ? `I noticed you have ${reviews} Google reviews and a ${rating} star rating`
    : `I came across ${name} on Google Maps`

  const websiteLine = hasWebsite
    ? `but your website could use some work to really convert visitors into customers`
    : `but not having a website makes it hard to reach people who aren't searching directly on Google`

  const cityLine = city ? ` in ${city}` : ''

  const templates: Record<string, string> = {
    casual: `Hey ${name} — ${reviewLine}${cityLine}, ${websiteLine}. Would you be open to a simple, fast website that brings in more calls? I already built a free preview for you — check it out.`,
    professional: `Hi ${name}, ${reviewLine}${cityLine}, ${websiteLine}. At Fast Websites we build clean, fast sites for local businesses starting at $500 — I already put together a free preview for you. Worth a look?`,
    urgent: `${name} — you're losing customers right now because ${hasWebsite ? 'your site isn\'t converting' : 'you have no website'}. ${reviewLine}${cityLine} — that reputation deserves a site to match. I built a free preview, takes 30 seconds to check out.`,
    sms: `Hey, saw ${name}${cityLine} on Google — ${hasWebsite ? 'your site could use some work' : 'you don\'t have a website'}. Built you a free preview, want to see it?`,
    instagram: `Hey! Love what ${name} is doing${cityLine} — ${hasWebsite ? 'your website could use a refresh though' : 'you should really have a website though'}. Built you a free preview 👀 want to see it?`,
  }

  const draft = templates[tone] ?? templates.professional

  await getSupabaseAdmin().from('leads').update({ outreach_draft: draft }).eq('id', id)


  return NextResponse.json({ draft })
}
