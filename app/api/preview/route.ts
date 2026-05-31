import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

function darkenHex(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const d = (n: number) => Math.max(0, Math.floor(n * 0.78)).toString(16).padStart(2, '0')
  return `#${d(r)}${d(g)}${d(b)}`
}

// WCAG relative luminance
function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const lin = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

// Contrast ratio against white — if too low, darken until it passes 4.5:1
function ensureContrastOnWhite(hex: string): string {
  let current = hex
  for (let i = 0; i < 10; i++) {
    const contrast = (1.05) / (luminance(current) + 0.05)
    if (contrast >= 4.5) return current
    current = darkenHex(current)
  }
  return current
}

function lightenHex(hex: string, alpha = '10'): string {
  return `${hex}${alpha}`
}

function buildColorPalette(accent: string) {
  const dark = darkenHex(accent)
  const footer = darkenHex(dark)
  // Check luminance — dark accents need more alpha to stay visible as tints
  const lum = luminance(accent)
  const lightAlpha = lum < 0.15 ? '20' : '12' // more opaque tint for very dark colors
  const borderAlpha = lum < 0.15 ? '50' : '30' // more visible border for very dark colors
  return {
    accent,
    accentDark: dark,
    accentLight: lightenHex(accent, lightAlpha),
    accentBorder: lightenHex(accent, borderAlpha),
    accentFooter: footer,
    accentFooterBorder: dark,
    // Always use light neutral text in footer — accent-tinted text on dark bg is unreadable
    accentFooterText: '#94a3b8',
    accentFooterHeading: '#f1f5f9',
  }
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
  pool:     ['Zap', 'Wrench', 'Shield', 'Star', 'Clock', 'Headphones'],
  concrete: ['Wrench', 'Home', 'Building2', 'Shield', 'Star', 'Headphones'],
  tree:     ['Trees', 'Scissors', 'Home', 'Shield', 'Star', 'Headphones'],
  pest:     ['Shield', 'Home', 'Building2', 'Star', 'Clock', 'Headphones'],
  groom:    ['Scissors', 'Star', 'Shield', 'Clock', 'DollarSign', 'Headphones'],
  pet:      ['Scissors', 'Star', 'Shield', 'Clock', 'DollarSign', 'Headphones'],
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

  const previewUrl = `${process.env.NEXUS_AGENCY_URL ?? 'https://nexus-agency-formore.vercel.app'}/preview/${data.id}`
  return NextResponse.json({ previewUrl, viewed: data.viewed, viewCount: data.view_count ?? 0 })
}

export async function POST(req: NextRequest) {
  const { leadId, colorOverride } = await req.json()
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
  const googleRating: number | null = lead.google_rating ?? null
  const googleReviewCount: number | null = lead.google_review_count ?? null
  const mapsPlaceId: string | null = lead.maps_place_id ?? null

  const iconSet = getIconSet(category)

  const prompt = `You are a professional website designer and copywriter. Generate complete website content AND a brand color for a local ${category} business.

Business details:
- Business name: ${name}
- Industry: ${category}
- City: ${city}${state ? ', ' + state : ''}
- Phone: ${phone || 'TBD'}
- Email: ${email || 'TBD'}

Return ONLY valid JSON matching this EXACT structure (no markdown, no extra text, no trailing commas):
{
  "accentHex": "A single hex color (#rrggbb) that fits this industry and looks great as a brand color. Must have contrast ratio ≥ 4.5:1 against white (#ffffff) so text remains readable. Examples by industry: landscaping=#16a34a, plumbing=#1d4ed8, electrical=#b45309, cleaning=#0284c7, roofing=#92400e, salon=#9333ea, gym=#ea580c, dental=#0891b2, restaurant=#dc2626, pet grooming=#92400e. Pick something fitting but feel free to vary the exact shade — avoid pure #000000 or #ffffff.",
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
    "socialProof": "${googleRating ? `⭐ ${googleRating}/5 from ${googleReviewCount ?? 'many'} Google reviews` : '⭐ 4.9/5 from 150+ customers'}",
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
    { "quote": "Write a specific, realistic 1-2 sentence 5-star review from a real customer's perspective. Make it specific to ${category} work — mention a concrete detail like a specific job, problem solved, or result achieved. Sound like a real person, not marketing copy.", "name": "Common local first name + last initial", "location": "${city}${state ? ', ' + state : ''}" },
    { "quote": "A different realistic review focused on reliability and showing up on time. Mention something specific about the ${category} job — a before/after, a tight deadline, or a tricky situation they handled well.", "name": "Different first name + last initial", "location": "Nearby city name${state ? ', ' + state : ''}" },
    { "quote": "A third realistic review about value for money or quality. Specific to ${category} — mention a real detail a customer would notice, like how long it took, how clean they left the site, or a specific result.", "name": "Third first name + last initial", "location": "${city}${state ? ', ' + state : ''}" },
    { "quote": "A fourth review from a repeat customer or someone who referred friends. Mention they've used ${name} more than once or recommended them to a neighbor. Keep it specific to the ${category} work.", "name": "Fourth first name + last initial", "location": "${city}${state ? ', ' + state : ''}" },
    { "quote": "A fifth review about communication and professionalism. Mention something specific — they got a call back fast, the estimate was clear, or there were no surprise charges on the ${category} job.", "name": "Fifth first name + last initial", "location": "Another nearby city${state ? ', ' + state : ''}" }
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

  const groqKeys = [process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_2, process.env.GROQ_API_KEY_3].filter(Boolean) as string[]
  let rawContent = ''
  for (const key of groqKeys) {
    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
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
      let groqData: { choices?: { message?: { content?: string } }[]; error?: { code?: string } }
      try { groqData = JSON.parse(groqText) } catch { continue }
      if (groqData?.error?.code === 'rate_limit_exceeded') continue
      const content = groqData.choices?.[0]?.message?.content?.trim()
      if (content) { rawContent = content; break }
    } catch { continue }
  }
  if (!rawContent) return NextResponse.json({ error: 'All Groq keys rate limited or failed' }, { status: 500 })

  // Strip markdown fences if model wrapped output in ```json ... ```
  const stripped = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  // Remove JS-style trailing commas before } or ] which are invalid JSON
  const cleaned = stripped.replace(/,(\s*[}\]])/g, '$1')

  let generated: Record<string, unknown>
  try {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    generated = JSON.parse(jsonMatch?.[0] ?? cleaned)
  } catch {
    return NextResponse.json({ error: `Could not parse Groq JSON: ${rawContent.slice(0, 300)}` }, { status: 500 })
  }

  // Extract hex from Groq's accentHex — it sometimes includes trailing comments like "#16a34a (green)"
  const extractHex = (val: unknown): string | null => {
    if (typeof val !== 'string') return null
    const match = val.match(/#[0-9a-fA-F]{6}/)
    return match ? match[0] : null
  }

  const rawAccent = ensureContrastOnWhite(
    (colorOverride && extractHex(colorOverride))
    ?? extractHex(generated.accentHex)
    ?? '#0ea5e9'
  )
  const colors = buildColorPalette(rawAccent)

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
    googleRating,
    googleReviewCount,
    mapsPlaceId,
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
      primary_color: rawAccent,
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

  const base = process.env.NEXUS_AGENCY_URL ?? 'https://nexus-agency-formore.vercel.app'
  const previewUrl = `${base}/preview/${preview.id}`

  return NextResponse.json({ previewUrl, previewId: preview.id })
}
