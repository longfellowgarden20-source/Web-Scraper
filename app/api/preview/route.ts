import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const INDUSTRY_COLORS: Record<string, { accent: string; accentDark: string; accentLight: string; accentBorder: string; accentFooter: string; accentFooterBorder: string; accentFooterText: string; accentFooterHeading: string }> = {
  plumber:      { accent: '#1d4ed8', accentDark: '#1e3a8a', accentLight: '#eff6ff', accentBorder: '#bfdbfe', accentFooter: '#1e3a8a', accentFooterBorder: '#1d4ed8', accentFooterText: '#bfdbfe', accentFooterHeading: '#dbeafe' },
  plumbing:     { accent: '#1d4ed8', accentDark: '#1e3a8a', accentLight: '#eff6ff', accentBorder: '#bfdbfe', accentFooter: '#1e3a8a', accentFooterBorder: '#1d4ed8', accentFooterText: '#bfdbfe', accentFooterHeading: '#dbeafe' },
  electrician:  { accent: '#b45309', accentDark: '#92400e', accentLight: '#fffbeb', accentBorder: '#fde68a', accentFooter: '#78350f', accentFooterBorder: '#92400e', accentFooterText: '#fde68a', accentFooterHeading: '#fef3c7' },
  electrical:   { accent: '#b45309', accentDark: '#92400e', accentLight: '#fffbeb', accentBorder: '#fde68a', accentFooter: '#78350f', accentFooterBorder: '#92400e', accentFooterText: '#fde68a', accentFooterHeading: '#fef3c7' },
  restaurant:   { accent: '#dc2626', accentDark: '#991b1b', accentLight: '#fef2f2', accentBorder: '#fecaca', accentFooter: '#7f1d1d', accentFooterBorder: '#991b1b', accentFooterText: '#fecaca', accentFooterHeading: '#fee2e2' },
  food:         { accent: '#dc2626', accentDark: '#991b1b', accentLight: '#fef2f2', accentBorder: '#fecaca', accentFooter: '#7f1d1d', accentFooterBorder: '#991b1b', accentFooterText: '#fecaca', accentFooterHeading: '#fee2e2' },
  landscap:     { accent: '#16a34a', accentDark: '#166534', accentLight: '#f0fdf4', accentBorder: '#bbf7d0', accentFooter: '#14532d', accentFooterBorder: '#15803d', accentFooterText: '#bbf7d0', accentFooterHeading: '#dcfce7' },
  lawn:         { accent: '#16a34a', accentDark: '#166534', accentLight: '#f0fdf4', accentBorder: '#bbf7d0', accentFooter: '#14532d', accentFooterBorder: '#15803d', accentFooterText: '#bbf7d0', accentFooterHeading: '#dcfce7' },
  garden:       { accent: '#16a34a', accentDark: '#166534', accentLight: '#f0fdf4', accentBorder: '#bbf7d0', accentFooter: '#14532d', accentFooterBorder: '#15803d', accentFooterText: '#bbf7d0', accentFooterHeading: '#dcfce7' },
  salon:        { accent: '#9333ea', accentDark: '#7e22ce', accentLight: '#faf5ff', accentBorder: '#e9d5ff', accentFooter: '#581c87', accentFooterBorder: '#7e22ce', accentFooterText: '#e9d5ff', accentFooterHeading: '#f3e8ff' },
  hair:         { accent: '#9333ea', accentDark: '#7e22ce', accentLight: '#faf5ff', accentBorder: '#e9d5ff', accentFooter: '#581c87', accentFooterBorder: '#7e22ce', accentFooterText: '#e9d5ff', accentFooterHeading: '#f3e8ff' },
  beauty:       { accent: '#9333ea', accentDark: '#7e22ce', accentLight: '#faf5ff', accentBorder: '#e9d5ff', accentFooter: '#581c87', accentFooterBorder: '#7e22ce', accentFooterText: '#e9d5ff', accentFooterHeading: '#f3e8ff' },
  hvac:         { accent: '#0891b2', accentDark: '#0e7490', accentLight: '#ecfeff', accentBorder: '#a5f3fc', accentFooter: '#164e63', accentFooterBorder: '#0e7490', accentFooterText: '#a5f3fc', accentFooterHeading: '#cffafe' },
  roofing:      { accent: '#b45309', accentDark: '#92400e', accentLight: '#fffbeb', accentBorder: '#fde68a', accentFooter: '#78350f', accentFooterBorder: '#92400e', accentFooterText: '#fde68a', accentFooterHeading: '#fef3c7' },
  roofer:       { accent: '#b45309', accentDark: '#92400e', accentLight: '#fffbeb', accentBorder: '#fde68a', accentFooter: '#78350f', accentFooterBorder: '#92400e', accentFooterText: '#fde68a', accentFooterHeading: '#fef3c7' },
  cleaning:     { accent: '#0284c7', accentDark: '#0369a1', accentLight: '#f0f9ff', accentBorder: '#bae6fd', accentFooter: '#0c4a6e', accentFooterBorder: '#0369a1', accentFooterText: '#bae6fd', accentFooterHeading: '#e0f2fe' },
  contractor:   { accent: '#374151', accentDark: '#1f2937', accentLight: '#f9fafb', accentBorder: '#d1d5db', accentFooter: '#111827', accentFooterBorder: '#1f2937', accentFooterText: '#d1d5db', accentFooterHeading: '#f3f4f6' },
  construction: { accent: '#374151', accentDark: '#1f2937', accentLight: '#f9fafb', accentBorder: '#d1d5db', accentFooter: '#111827', accentFooterBorder: '#1f2937', accentFooterText: '#d1d5db', accentFooterHeading: '#f3f4f6' },
  painter:      { accent: '#6d28d9', accentDark: '#5b21b6', accentLight: '#f5f3ff', accentBorder: '#ddd6fe', accentFooter: '#3b0764', accentFooterBorder: '#5b21b6', accentFooterText: '#ddd6fe', accentFooterHeading: '#ede9fe' },
  painting:     { accent: '#6d28d9', accentDark: '#5b21b6', accentLight: '#f5f3ff', accentBorder: '#ddd6fe', accentFooter: '#3b0764', accentFooterBorder: '#5b21b6', accentFooterText: '#ddd6fe', accentFooterHeading: '#ede9fe' },
  mechanic:     { accent: '#374151', accentDark: '#1f2937', accentLight: '#f9fafb', accentBorder: '#d1d5db', accentFooter: '#111827', accentFooterBorder: '#1f2937', accentFooterText: '#d1d5db', accentFooterHeading: '#f3f4f6' },
  auto:         { accent: '#374151', accentDark: '#1f2937', accentLight: '#f9fafb', accentBorder: '#d1d5db', accentFooter: '#111827', accentFooterBorder: '#1f2937', accentFooterText: '#d1d5db', accentFooterHeading: '#f3f4f6' },
  dental:       { accent: '#0ea5e9', accentDark: '#0284c7', accentLight: '#f0f9ff', accentBorder: '#bae6fd', accentFooter: '#0c4a6e', accentFooterBorder: '#0284c7', accentFooterText: '#bae6fd', accentFooterHeading: '#e0f2fe' },
  dentist:      { accent: '#0ea5e9', accentDark: '#0284c7', accentLight: '#f0f9ff', accentBorder: '#bae6fd', accentFooter: '#0c4a6e', accentFooterBorder: '#0284c7', accentFooterText: '#bae6fd', accentFooterHeading: '#e0f2fe' },
  medical:      { accent: '#0ea5e9', accentDark: '#0284c7', accentLight: '#f0f9ff', accentBorder: '#bae6fd', accentFooter: '#0c4a6e', accentFooterBorder: '#0284c7', accentFooterText: '#bae6fd', accentFooterHeading: '#e0f2fe' },
  gym:          { accent: '#ea580c', accentDark: '#c2410c', accentLight: '#fff7ed', accentBorder: '#fed7aa', accentFooter: '#7c2d12', accentFooterBorder: '#c2410c', accentFooterText: '#fed7aa', accentFooterHeading: '#ffedd5' },
  fitness:      { accent: '#ea580c', accentDark: '#c2410c', accentLight: '#fff7ed', accentBorder: '#fed7aa', accentFooter: '#7c2d12', accentFooterBorder: '#c2410c', accentFooterText: '#fed7aa', accentFooterHeading: '#ffedd5' },
}

const DEFAULT_COLORS = { accent: '#0ea5e9', accentDark: '#0284c7', accentLight: '#f0f9ff', accentBorder: '#bae6fd', accentFooter: '#0c4a6e', accentFooterBorder: '#0284c7', accentFooterText: '#bae6fd', accentFooterHeading: '#e0f2fe' }

function getColors(category: string): typeof DEFAULT_COLORS {
  const lower = (category ?? '').toLowerCase()
  for (const [key, colors] of Object.entries(INDUSTRY_COLORS)) {
    if (lower.includes(key)) return colors
  }
  return DEFAULT_COLORS
}

function pickAccentFromOverride(override: string, base: typeof DEFAULT_COLORS): typeof DEFAULT_COLORS {
  // Keep all derived tints from base palette, but swap accent + accentDark for the override
  const dark = override // close enough — can't compute proper dark without colorsys
  return { ...base, accent: override, accentDark: dark }
}

// Map industry keywords to icon sets appropriate for that vertical
const INDUSTRY_ICONS: Record<string, string[]> = {
  landscap: ['Scissors', 'Home', 'Building2', 'Flower2', 'Trees', 'Headphones'],
  lawn:     ['Scissors', 'Home', 'Building2', 'Flower2', 'Trees', 'Headphones'],
  garden:   ['Scissors', 'Flower2', 'Trees', 'Home', 'Building2', 'Headphones'],
  plumb:    ['Wrench', 'Home', 'Building2', 'Zap', 'Shield', 'Headphones'],
  electric: ['Zap', 'Home', 'Building2', 'Wrench', 'Shield', 'Headphones'],
  clean:    ['Home', 'Building2', 'Star', 'Shield', 'Clock', 'Headphones'],
  roof:     ['Home', 'Building2', 'Shield', 'Wrench', 'Star', 'Headphones'],
  hvac:     ['Zap', 'Home', 'Building2', 'Wrench', 'Shield', 'Headphones'],
  paint:    ['Home', 'Building2', 'Star', 'Wrench', 'Shield', 'Headphones'],
  contrac:  ['Wrench', 'Home', 'Building2', 'Shield', 'Star', 'Headphones'],
  auto:     ['Wrench', 'Zap', 'Shield', 'Star', 'Clock', 'Headphones'],
  mechanic: ['Wrench', 'Zap', 'Shield', 'Star', 'Clock', 'Headphones'],
  salon:    ['Scissors', 'Star', 'Shield', 'Clock', 'DollarSign', 'Headphones'],
  hair:     ['Scissors', 'Star', 'Shield', 'Clock', 'DollarSign', 'Headphones'],
  fitness:  ['Zap', 'Star', 'Shield', 'Clock', 'DollarSign', 'Headphones'],
  gym:      ['Zap', 'Star', 'Shield', 'Clock', 'DollarSign', 'Headphones'],
  dental:   ['Star', 'Shield', 'Clock', 'DollarSign', 'Home', 'Headphones'],
  medical:  ['Star', 'Shield', 'Clock', 'DollarSign', 'Home', 'Headphones'],
}

function getIconSet(category: string): string[] {
  const lower = (category ?? '').toLowerCase()
  for (const [key, icons] of Object.entries(INDUSTRY_ICONS)) {
    if (lower.includes(key)) return icons
  }
  return ['Star', 'Home', 'Building2', 'Shield', 'Clock', 'Headphones']
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

  const category = lead.category ?? 'local business'
  const city = lead.city ?? 'your area'
  const state = lead.state ?? ''
  const name = lead.business_name
  const phone = lead.phone ?? ''
  const email = lead.email ?? ''

  let colors = getColors(category)
  if (colorOverride && /^#[0-9a-fA-F]{6}$/.test(colorOverride)) {
    colors = pickAccentFromOverride(colorOverride, colors)
  }
  const iconSet = getIconSet(category)

  const prompt = `You are a professional website copywriter. Generate complete website content for a local ${category} business.

Business details:
- Business name: ${name}
- Industry: ${category}
- City: ${city}${state ? ', ' + state : ''}
- Phone: ${phone || 'TBD'}
- Email: ${email || 'TBD'}

Return ONLY valid JSON matching this EXACT structure (no markdown, no extra text, no trailing commas):
{
  "shortName": "2-3 word short business name for nav/footer",
  "tagline": "one catchy sentence tagline mentioning the city, 10-16 words",
  "industry": "${category.toLowerCase().split(' ')[0]}",
  "industryLabel": "Title Case industry name (e.g. Plumbing, Lawn Care)",
  "serviceNoun": "service",
  "proNoun": "plural professional noun (e.g. plumbers, landscapers, cleaners)",
  "proNounSingular": "singular professional noun",
  "logoEmoji": "one relevant emoji for this industry",
  "hero": {
    "badgeText": "Professional [Industry] Since [plausible year like 2008 or 2012]",
    "headline": "6-8 word headline without the accent part",
    "headlineAccent": "3-5 words that complete the headline with emphasis",
    "subheadline": "2 sentences: what they do + why customers trust them. Mention city.",
    "ctaPrimary": "3-4 word CTA button text",
    "ctaSecondary": "View Our Services",
    "socialProof": "⭐ 4.9/5 from 150+ customers",
    "socialProof2": "Trusted by homeowners and local businesses in ${city}"
  },
  "services": [
    { "title": "Service 1 name", "description": "1-2 sentence description of this service", "icon": "${iconSet[0]}" },
    { "title": "Service 2 name", "description": "1-2 sentence description", "icon": "${iconSet[1]}" },
    { "title": "Service 3 name", "description": "1-2 sentence description", "icon": "${iconSet[2]}" },
    { "title": "Service 4 name", "description": "1-2 sentence description", "icon": "${iconSet[3]}" },
    { "title": "Service 5 name", "description": "1-2 sentence description", "icon": "${iconSet[4]}" },
    { "title": "Free Consultation", "description": "Clear estimates, honest communication, and no-pressure quotes from first call to final cleanup.", "icon": "${iconSet[5]}" }
  ],
  "whyUs": {
    "tagline": "Why Choose ${name}",
    "headline": "7-9 words about trust and quality",
    "intro": "2 sentences about what makes them stand out",
    "points": [
      { "title": "Licensed & Insured", "description": "Fully licensed and insured professionals for your protection on every job." },
      { "title": "Transparent Pricing", "description": "Clear estimates upfront with no surprise fees or hidden charges." },
      { "title": "Quality Workmanship", "description": "Premium materials and proven methods leaving every job done right the first time." },
      { "title": "Reliable Scheduling", "description": "We show up on time, every time — no-shows cost customers and we know it." }
    ],
    "outro": "1 sentence summarizing why they're the right choice"
  },
  "pricing": {
    "tagline": "Transparent Pricing",
    "headline": "Our Packages",
    "intro": "1 sentence about upfront, honest pricing",
    "outro": "1 sentence: contact for free consultation or custom estimate",
    "plans": [
      {
        "name": "Basic [Service]",
        "price": "$[realistic low price like $79 or $149]",
        "description": "One-time or entry-level service description",
        "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Debris cleanup", "No-obligation estimate"],
        "cta": "Book a Visit",
        "featured": false
      },
      {
        "name": "Full [Service]",
        "price": "$[realistic mid price like $599 or $1200]",
        "description": "Comprehensive service description",
        "features": ["Everything in Basic", "Feature 2", "Feature 3", "Feature 4", "Feature 5", "1 year guarantee"],
        "cta": "Get a Quote",
        "featured": true
      },
      {
        "name": "Maintenance Plan",
        "price": "Custom",
        "description": "Ongoing care and recurring service plans",
        "features": ["Recurring service visits", "Seasonal adjustments", "Priority scheduling", "Feature 4", "Feature 5", "Service agreements"],
        "cta": "Schedule Consultation",
        "featured": false
      }
    ]
  },
  "testimonials": [
    { "quote": "Realistic 1-2 sentence positive review about quality and professionalism", "name": "Common first name + last initial", "location": "${city}${state ? ', ' + state : ''}" },
    { "quote": "Another realistic review mentioning reliability or value", "name": "Different first name + last initial", "location": "Nearby city name${state ? ', ' + state : ''}" },
    { "quote": "Third review about communication or results", "name": "Third first name + last initial", "location": "${city}${state ? ', ' + state : ''}" }
  ],
  "faqs": [
    { "question": "How much does [main service] cost in ${city}?", "answer": "2-3 sentences with realistic price range and mention of free quotes" },
    { "question": "Do you offer free estimates?", "answer": "Yes, we do. 1-2 more sentences about the process." },
    { "question": "What areas do you serve?", "answer": "Mention ${city} and 3-4 plausible nearby cities/areas" },
    { "question": "Are you licensed and insured?", "answer": "Yes, fully licensed and insured. 1 more sentence." }
  ],
  "cta": {
    "headline": "7-9 word question like 'Ready to [verb] your [noun]?'",
    "subheadline": "1 sentence inviting them to reach out",
    "ctaPrimary": "Request a Quote",
    "ctaSecondary": "View Services"
  },
  "about": {
    "tagline": "About ${name}",
    "headline": "7-9 words about hard work or craftsmanship",
    "intro": "2 sentences about the business history and mission",
    "values": [
      { "title": "Local Expertise", "body": "1 sentence about local knowledge and better results" },
      { "title": "Quality Workmanship", "body": "1 sentence about materials and standards" },
      { "title": "Honest Communication", "body": "1 sentence about clear pricing and straight answers" }
    ]
  },
  "owner": {
    "name": "Plausible owner first + last name matching the business name if possible",
    "title": "Founder & Owner",
    "yearsExperience": "15+",
    "bio": [
      "2-3 sentence paragraph about founding the business and passion for the trade",
      "2-3 sentence paragraph about commitment to quality and customer service"
    ]
  },
  "serviceArea": {
    "city": "${city}",
    "state": "${state || 'CA'}",
    "headline": "Proudly serving\\n${city} & surrounding areas",
    "intro": "2 sentences: based in ${city}, serves surrounding communities with fast response",
    "neighborhoods": ["6-8 plausible neighborhood names for ${city}"],
    "nearbyCities": ["4-6 plausible nearby city names"]
  },
  "seo": {
    "defaultDescription": "2 sentence SEO meta description mentioning ${name}, ${city}, and main services. Under 160 chars.",
    "keywords": ["keyword 1 with city", "keyword 2", "keyword 3", "keyword 4", "${name}"]
  }
}`

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 4096,
      temperature: 0.7,
      messages: [
        { role: 'system', content: 'You are a JSON generator. Return only valid JSON, no markdown fences, no extra text.' },
        { role: 'user', content: prompt },
      ],
    }),
  })

  const groqText = await groqRes.text()
  if (!groqRes.ok) return NextResponse.json({ error: `Groq error: ${groqText}` }, { status: 500 })

  let groqData: { choices?: { message?: { content?: string } }[] }
  try { groqData = JSON.parse(groqText) } catch {
    return NextResponse.json({ error: 'Invalid Groq response' }, { status: 500 })
  }

  const content = groqData.choices?.[0]?.message?.content?.trim() ?? ''

  let generated: Record<string, unknown>
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    generated = JSON.parse(jsonMatch?.[0] ?? content)
  } catch {
    return NextResponse.json({ error: `Could not parse Groq JSON: ${content.slice(0, 300)}` }, { status: 500 })
  }

  // Build the full business_config merging generated content + real identity fields
  const businessConfig = {
    name,
    shortName: generated.shortName ?? name,
    tagline: generated.tagline ?? '',
    phone,
    phoneHref: phone ? `tel:+1${phone.replace(/\D/g, '')}` : '',
    email,
    domain: lead.website ?? '',
    industry: generated.industry ?? category.toLowerCase().split(' ')[0],
    industryLabel: generated.industryLabel ?? category,
    serviceNoun: generated.serviceNoun ?? 'service',
    proNoun: generated.proNoun ?? 'professionals',
    proNounSingular: generated.proNounSingular ?? 'professional',
    logoEmoji: generated.logoEmoji ?? '⚡',
    logoImagePath: '',
    colors,
    hero: generated.hero ?? {},
    owner: generated.owner ?? {},
    about: generated.about ?? {},
    services: generated.services ?? [],
    whyUs: generated.whyUs ?? {},
    pricing: generated.pricing ?? {},
    cta: generated.cta ?? {},
    serviceArea: generated.serviceArea ?? {},
    testimonials: generated.testimonials ?? [],
    faqs: generated.faqs ?? [],
    seo: generated.seo ?? {},
  }

  const { data: preview, error: insertError } = await getSupabaseAdmin()
    .from('previews')
    .insert({
      lead_id: leadId,
      business_name: name,
      city,
      category,
      // Legacy columns kept for backward compat
      tagline: (generated.hero as Record<string, string>)?.subheadline ?? String(generated.tagline ?? ''),
      headline: (generated.hero as Record<string, string>)?.headline ?? '',
      subheadline: (generated.hero as Record<string, string>)?.subheadline ?? '',
      services: (generated.services as { title: string }[] ?? []).map((s) => s.title),
      primary_color: colors.accent,
      phone,
      email,
      cta_text: (generated.cta as Record<string, string>)?.ctaPrimary ?? 'Get a Quote',
      about: (generated.about as Record<string, string>)?.intro ?? '',
      // Full config for template rendering
      business_config: businessConfig,
    })
    .select()
    .single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  const base = process.env.NEXUS_AGENCY_URL ?? 'https://nexus-agency-formore-cvufrmzih.vercel.app'
  const previewUrl = `${base}/preview/${preview.id}${template !== 'modern' ? `?t=${template}` : ''}`

  return NextResponse.json({ previewUrl, previewId: preview.id })
}
