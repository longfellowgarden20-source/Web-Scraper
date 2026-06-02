'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Copy, Check, ExternalLink, Wand2, AlertCircle, Send, Phone, Globe, Rocket } from 'lucide-react'

type Lead = {
  id: string
  created_at: string
  source: string
  business_name: string
  city: string | null
  category: string | null
  website: string | null
  phone: string | null
  score: number
  status: string
  outreach_draft: string | null
  notes: string | null
  reddit_url: string | null
  email: string | null
  instagram: string | null
  facebook: string | null
  google_rating: number | null
  google_review_count: number | null
  called: boolean | null
  score_reasons: string[] | null
}

function gmailHref(email: string, subject: string, body: string | null) {
  const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|Android/i.test(navigator.userAgent)
  const params = new URLSearchParams()
  if (subject) params.set('subject', subject)
  if (body) params.set('body', body)
  if (isMobile) return `mailto:${email}${params.toString() ? '?' + params.toString() : ''}`
  const gParams = new URLSearchParams({ view: 'cm', to: email })
  if (subject) gParams.set('su', subject)
  if (body) gParams.set('body', body)
  return `https://mail.google.com/mail/?${gParams.toString()}`
}

const card = 'bg-white/5 border border-white/10 rounded-2xl'
const inputCls = 'px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-[#0ea5e9]/60 w-full'

function statusBadge(s: string) {
  const map: Record<string, { bg: string; text: string }> = {
    new: { bg: 'bg-[#0ea5e9]/15', text: 'text-[#0ea5e9]' },
    contacted: { bg: 'bg-yellow-500/15', text: 'text-yellow-400' },
    replied: { bg: 'bg-purple-500/15', text: 'text-purple-400' },
    converted: { bg: 'bg-green-500/15', text: 'text-green-400' },
    passed: { bg: 'bg-slate-500/15', text: 'text-slate-400' },
  }
  const c = map[s] ?? map.new
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text} capitalize`}>{s}</span>
}

export default function LeadDetailClient({ id }: { id: string }) {
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [draftLoading, setDraftLoading] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [status, setStatus] = useState('')
  const [manualEmail, setManualEmail] = useState('')
  const [outreachTone, setOutreachTone] = useState<'professional' | 'casual' | 'urgent' | 'sms' | 'instagram'>('casual')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewViews, setPreviewViews] = useState<number | null>(null)
  const [previewColor, setPreviewColor] = useState('')
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
  const [screenshotCopied, setScreenshotCopied] = useState(false)
  const [screenshotLoading, setScreenshotLoading] = useState(false)
  const [enriching, setEnriching] = useState(false)

  // Launch All state
  const [launchLoading, setLaunchLoading] = useState(false)
  const [launchStep, setLaunchStep] = useState<string | null>(null)
  const [launchMessage, setLaunchMessage] = useState<string | null>(null)
  const [launchCopied, setLaunchCopied] = useState(false)
  const [launchError, setLaunchError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/leads/${id}`)
      .then(async r => {
        const text = await r.text()
        if (!text) throw new Error('Empty response')
        return JSON.parse(text)
      })
      .then(data => {
        setLead(data)
        setNotes(data.notes ?? '')
        setStatus(data.status ?? 'new')
        if (data.outreach_draft) setLaunchMessage(data.outreach_draft)
        setLoading(false)
      })
      .catch(() => setLoading(false))

    // Fetch existing preview for this lead
    fetch(`/api/preview?leadId=${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.previewUrl) setPreviewUrl(data.previewUrl)
        if (data?.viewCount != null) setPreviewViews(data.viewCount)
        if (data?.screenshotUrl) setScreenshotUrl(data.screenshotUrl)

        // If preview exists but no screenshot yet, start polling
        if (data?.previewUrl && !data?.screenshotUrl) {
          let attempts = 0
          const poll = setInterval(async () => {
            attempts++
            const r = await fetch(`/api/preview?leadId=${id}`)
            const d = await r.json()
            if (d?.screenshotUrl) {
              setScreenshotUrl(d.screenshotUrl)
              clearInterval(poll)
            }
            if (attempts >= 12) clearInterval(poll)
          }, 5000)
        }
      })
      .catch(() => {})
  }, [id])

  const enrichLead = async () => {
    if (!lead) return
    setEnriching(true)
    const res = await fetch('/api/leads/enrich', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: lead.id }) })
    const data = await res.json()
    if (res.ok) setLead(l => l ? { ...l, email: data.email ?? l.email, instagram: data.instagram ?? l.instagram, facebook: data.facebook ?? l.facebook } : l)
    setEnriching(false)
  }

  const updateField = async (updates: Partial<Lead>) => {
    const res = await fetch('/api/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    })
    const text = await res.text()
    if (text) {
      try { setLead(JSON.parse(text)) } catch { /* ignore */ }
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus)
    await updateField({ status: newStatus as Lead['status'] })
  }

  const saveNotes = async () => {
    setSavingNotes(true)
    await updateField({ notes })
    setSavingNotes(false)
  }

  const generateDraft = async () => {
    setDraftLoading(true)
    setDraftError(null)
    try {
      const res = await fetch('/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, tone: outreachTone }),
      })
      const text = await res.text()
      if (!text) throw new Error(`Server error ${res.status} — empty response`)
      let data: { draft?: string; error?: string }
      try { data = JSON.parse(text) } catch { throw new Error(`Bad response: ${text.slice(0, 100)}`) }
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`)
      setLead(prev => prev ? { ...prev, outreach_draft: data.draft ?? null } : prev)
    } catch (e: unknown) {
      setDraftError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setDraftLoading(false)
    }
  }

  const generatePreview = async () => {
    setPreviewLoading(true)
    setPreviewError(null)
    try {
      const res = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: id, ...(previewColor ? { colorOverride: previewColor } : {}) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`)
      setPreviewUrl(data.previewUrl)
      setPreviewViews(0)
      setScreenshotUrl(null)

      // Poll for screenshot — Railway takes ~10s to capture it
      const previewId = data.previewId
      let attempts = 0
      const poll = setInterval(async () => {
        attempts++
        const r = await fetch(`/api/preview?leadId=${id}`)
        const d = await r.json()
        if (d?.screenshotUrl) {
          setScreenshotUrl(d.screenshotUrl)
          clearInterval(poll)
        }
        if (attempts >= 12) clearInterval(poll) // stop after ~60s
      }, 5000)
    } catch (e: unknown) {
      setPreviewError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setPreviewLoading(false)
    }
  }

  const launchAll = async () => {
    if (!lead) return
    setLaunchLoading(true)
    setLaunchError(null)
    setLaunchMessage(null)

    try {
      // Step 1 — preview
      setLaunchStep('Building your site...')
      const previewRes = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: id, ...(previewColor ? { colorOverride: previewColor } : {}) }),
      })
      const previewData = await previewRes.json()
      if (!previewRes.ok) throw new Error(previewData.error ?? `Preview error ${previewRes.status}`)
      const url = previewData.previewUrl as string
      setPreviewUrl(url)
      setPreviewViews(0)

      // Step 2 — outreach draft
      setLaunchStep('Writing your message...')
      const outreachRes = await fetch('/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, tone: outreachTone }),
      })
      const outreachText = await outreachRes.text()
      let draft = ''
      try {
        const outreachData = JSON.parse(outreachText)
        if (!outreachRes.ok) throw new Error(outreachData.error ?? `Outreach error ${outreachRes.status}`)
        draft = outreachData.draft ?? ''
        setLead(prev => prev ? { ...prev, outreach_draft: draft } : prev)
      } catch {
        throw new Error(`Bad outreach response: ${outreachText.slice(0, 100)}`)
      }

      // Step 3 — assemble final message: Groq draft + preview link
      const message = `${draft}\n\nCheck out the site I built for you: ${url}`
      setLaunchMessage(message)

      // Save the full assembled message to DB so it persists on refresh
      await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, outreach_draft: message }),
      })

      setLaunchStep(null)
    } catch (e: unknown) {
      setLaunchError(e instanceof Error ? e.message : 'Unknown error')
      setLaunchStep(null)
    } finally {
      setLaunchLoading(false)
    }
  }

  const copyDraft = () => {
    if (lead?.outreach_draft) {
      navigator.clipboard.writeText(lead.outreach_draft)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-slate-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading...
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="text-center py-32 text-slate-500">
        <p>Lead not found.</p>
        <Link href="/dashboard" className="text-[#0ea5e9] hover:underline text-sm mt-2 inline-block">← Back to leads</Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 border border-white/10" style={{ transition: 'background 0.15s' }}>
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">{lead.business_name}</h1>
          <p className="text-xs text-slate-500">{lead.city ?? ''}{lead.city && lead.category ? ' · ' : ''}{lead.category ?? ''}</p>
        </div>
      </div>

      {/* Website screenshot */}
      {lead.website && (
        <div className={`${card} overflow-hidden`}>
          <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Current Website</p>
            <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-xs text-[#0ea5e9] hover:underline flex items-center gap-1">
              {lead.website.replace(/^https?:\/\//, '').slice(0, 40)} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="relative w-full bg-slate-900" style={{ height: 220 }}>
            <img
              src={`https://api.microlink.io/?url=${encodeURIComponent(lead.website)}&screenshot=true&meta=false&embed=screenshot.url`}
              alt="Website screenshot"
              className="w-full h-full object-cover object-top"
              loading="lazy"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
        </div>
      )}

      {/* Info card */}
      <div className={`${card} p-5 grid grid-cols-2 gap-4 overflow-hidden`}>
        <div>
          <p className="text-xs text-slate-500 mb-1">Source</p>
          <p className="text-sm text-white font-medium">{lead.source === 'google_maps' ? 'Google Maps' : 'Reddit'}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Score <span className="text-slate-600 font-normal normal-case">(10 = worst web presence)</span></p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold tabular-nums ${
              lead.score >= 8 ? 'bg-red-500/15 text-red-400' :
              lead.score >= 5 ? 'bg-yellow-500/15 text-yellow-400' :
              'bg-slate-500/15 text-slate-400'
            }`}>{lead.score}/10</span>
            {lead.score_reasons && lead.score_reasons.length > 0 ? (
              <span className="text-xs text-slate-500">— {lead.score_reasons.join(', ')}</span>
            ) : (
              <span className="text-xs text-slate-500">
                {!lead.website ? '— No website found' :
                 lead.score >= 8 ? '— Poor/outdated site, slow or broken' :
                 lead.score >= 5 ? '— Basic site, room for improvement' :
                 '— Decent web presence'}
              </span>
            )}
          </div>
        </div>
        {lead.website && (
          <div className="col-span-2">
            <p className="text-xs text-slate-500 mb-1">Website</p>
            <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-sm text-[#0ea5e9] hover:underline flex items-center gap-1">
              {lead.website.replace(/^https?:\/\//, '')}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
        {lead.phone && (
          <div>
            <p className="text-xs text-slate-500 mb-1">Phone</p>
            <p className="text-sm text-white">{lead.phone}</p>
          </div>
        )}
        {lead.email && (
          <div>
            <p className="text-xs text-slate-500 mb-1">Email</p>
            <a href={`mailto:${lead.email}`} className="text-sm text-[#0ea5e9] hover:underline">{lead.email}</a>
          </div>
        )}
        {lead.google_review_count != null && (
          <div>
            <p className="text-xs text-slate-500 mb-1">Google Reviews</p>
            <p className="text-sm text-white">⭐ {lead.google_rating?.toFixed(1)} <span className="text-slate-500">({lead.google_review_count} reviews)</span></p>
          </div>
        )}
        {lead.instagram && (
          <div>
            <p className="text-xs text-slate-500 mb-1">Instagram</p>
            <a href={lead.instagram} target="_blank" rel="noopener noreferrer" className="text-sm text-[#0ea5e9] hover:underline flex items-center gap-1">
              {lead.instagram.replace('https://instagram.com/', '@')} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
        {lead.website && !lead.instagram && !lead.email && (
          <div className="col-span-2">
            <button
              onClick={enrichLead}
              disabled={enriching}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 disabled:opacity-40"
              style={{ transition: 'color 0.15s, border-color 0.15s' }}
            >
              {enriching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
              {enriching ? 'Finding contact info...' : 'Find email & Instagram'}
            </button>
          </div>
        )}
        {lead.facebook && (
          <div>
            <p className="text-xs text-slate-500 mb-1">Facebook</p>
            <a href={lead.facebook} target="_blank" rel="noopener noreferrer" className="text-sm text-[#0ea5e9] hover:underline flex items-center gap-1">
              View page <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
        {lead.reddit_url && (
          <div className="col-span-2">
            <p className="text-xs text-slate-500 mb-1">Reddit Post</p>
            <a href={lead.reddit_url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#0ea5e9] hover:underline flex items-center gap-1">
              View post <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
        <div>
          <p className="text-xs text-slate-500 mb-1">Added</p>
          <p className="text-sm text-white">{new Date(lead.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Status */}
      <div className={`${card} p-5 flex flex-col gap-4`}>
        <div className="flex-1">
          <p className="text-xs text-slate-500 mb-2">Status</p>
          <div className="flex flex-wrap gap-2">
            {['new', 'contacted', 'replied', 'converted', 'passed'].map(s => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize border ${
                  status === s
                    ? 'border-transparent ring-2 ring-white/20'
                    : 'border-white/10 text-slate-500 hover:text-white'
                }`}
                style={{ transition: 'color 0.15s' }}
              >
                {status === s ? statusBadge(s) : s}
              </button>
            ))}
          </div>
        </div>
        <div className="border-t border-white/10 pt-4">
          <button
            onClick={async () => {
              const next = !lead.called
              setLead(prev => prev ? { ...prev, called: next } : prev)
              await updateField({ called: next } as Partial<Lead>)
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border ${
              lead.called
                ? 'bg-green-500/15 border-green-500/30 text-green-400'
                : 'border-white/10 text-slate-400 hover:text-white hover:border-white/30'
            }`}
            style={{ transition: 'color 0.15s, background 0.15s, border-color 0.15s' }}
          >
            <Phone className={`w-4 h-4 ${lead.called ? 'fill-green-400' : ''}`} />
            {lead.called ? 'Called — mark as not called' : 'Mark as called'}
          </button>
        </div>
      </div>

      {/* Notes */}
      <div className={`${card} p-5 flex flex-col gap-3`}>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Notes</p>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Add notes about this lead..."
          className={`${inputCls} resize-none`}
        />
        <button
          onClick={saveNotes}
          disabled={savingNotes}
          className="self-start px-3 py-1.5 text-xs font-semibold text-black bg-[#0ea5e9] rounded-lg disabled:opacity-50 hover:bg-[#38bdf8]"
          style={{ transition: 'background 0.15s' }}
        >
          {savingNotes ? 'Saving...' : 'Save Notes'}
        </button>
      </div>

      {/* Launch All */}
      {/* Combined Launch */}
      <div className="bg-gradient-to-br from-[#0ea5e9]/10 to-[#0ea5e9]/5 border border-[#0ea5e9]/25 rounded-2xl p-5 flex flex-col gap-4">
        {/* Header row */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4 text-[#0ea5e9]" />
            <p className="text-sm font-bold text-white">Launch</p>
            {previewViews != null && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${previewViews > 0 ? 'bg-green-500/15 text-green-400' : 'bg-slate-500/15 text-slate-500'}`}>
                {previewViews > 0 ? `${previewViews} view${previewViews > 1 ? 's' : ''}` : 'Not viewed'}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2 w-full sm:flex-row sm:items-center sm:flex-wrap">
            {/* Tone picker */}
            <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
              {(['casual', 'professional', 'urgent', 'sms', 'instagram'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setOutreachTone(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border ${outreachTone === t ? 'bg-white/10 border-white/20 text-white' : 'border-white/10 text-slate-500 hover:text-white'}`}
                  style={{ transition: 'background 0.15s, color 0.15s' }}
                >{t}</button>
              ))}
            </div>
            {/* Color override */}
            <div className="flex items-center gap-1.5 px-2 py-1 border border-white/10 rounded-lg">
              <span className="text-xs text-slate-500">Color</span>
              <input
                type="color"
                value={previewColor || '#0ea5e9'}
                onChange={e => setPreviewColor(e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                title="Override brand color (leave default to let AI choose)"
              />
              {previewColor && (
                <button onClick={() => setPreviewColor('')} className="text-xs text-slate-600 hover:text-slate-400" title="Reset to AI auto-pick">✕</button>
              )}
            </div>
          </div>
        </div>

        {/* Launch button */}
        <button
          onClick={launchAll}
          disabled={launchLoading}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-base font-bold text-black bg-[#0ea5e9] disabled:opacity-60 hover:bg-[#38bdf8] active:scale-[0.98]"
          style={{ minHeight: 52, transition: 'background 0.15s, transform 0.1s' }}
        >
          {launchLoading
            ? <><Loader2 className="w-5 h-5 animate-spin" /> {launchStep ?? 'Working...'}</>
            : <><Rocket className="w-5 h-5" /> {launchMessage ? 'Regenerate' : 'Build Site + Write Message'}</>
          }
        </button>

        {launchError && (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {launchError}
          </div>
        )}

        {/* Preview iframe thumbnail */}
        {previewUrl && (
          <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="block relative rounded-xl overflow-hidden border border-white/10 hover:border-[#0ea5e9]/40 group" style={{ transition: 'border-color 0.15s' }}>
            <div style={{ height: 180, position: 'relative', overflow: 'hidden' }}>
              <iframe
                src={previewUrl}
                title="Preview"
                scrolling="no"
                style={{ width: '200%', height: '200%', transform: 'scale(0.5)', transformOrigin: 'top left', border: 'none', pointerEvents: 'none', maxWidth: 'none' }}
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
              <span className="flex items-center gap-2 px-4 py-2 bg-[#0ea5e9] text-black text-xs font-bold rounded-lg">
                <ExternalLink className="w-3.5 h-3.5" /> Open Full Preview
              </span>
            </div>
          </a>
        )}

        {/* Ready to send */}
        {launchMessage && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Ready to send</p>
            <div className="p-4 bg-black/30 border border-white/10 rounded-xl text-sm text-slate-100 leading-relaxed whitespace-pre-wrap">
              {launchMessage}
            </div>
            {/* Screenshot to attach */}
            {screenshotUrl ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Attach this screenshot</p>
                <a href={screenshotUrl} target="_blank" rel="noopener noreferrer">
                  <img src={screenshotUrl} alt="Preview screenshot" className="w-full rounded-xl border border-white/10 hover:border-[#0ea5e9]/40" style={{ transition: 'border-color 0.15s' }} />
                </a>
                <button
                  onClick={() => { navigator.clipboard.writeText(screenshotUrl); setScreenshotCopied(true); setTimeout(() => setScreenshotCopied(false), 2000) }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border border-white/15 text-white hover:bg-white/8 active:scale-[0.98]"
                  style={{ minHeight: 44, transition: 'background 0.15s, transform 0.1s' }}
                >
                  {screenshotCopied ? <><Check className="w-4 h-4 text-green-400" /> Copied image URL!</> : <><Copy className="w-4 h-4" /> Copy Screenshot URL</>}
                </button>
              </div>
            ) : previewUrl ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Attach this screenshot</p>
                <button
                  disabled={screenshotLoading}
                  onClick={async () => {
                    setScreenshotLoading(true)
                    try {
                      const res = await fetch('/api/screenshot', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ leadId: id }),
                      })
                      const data = await res.json()
                      if (data.screenshotUrl) setScreenshotUrl(data.screenshotUrl)
                    } finally {
                      setScreenshotLoading(false)
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border border-white/15 text-slate-400 hover:text-white hover:bg-white/8 active:scale-[0.98] disabled:opacity-50"
                  style={{ minHeight: 44, transition: 'background 0.15s, color 0.15s, transform 0.1s' }}
                >
                  {screenshotLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Capturing...</>
                    : <><Wand2 className="w-4 h-4" /> Capture Screenshot</>}
                </button>
              </div>
            ) : null}

            <div className="flex flex-col gap-2">
              <button
                onClick={() => { navigator.clipboard.writeText(launchMessage); setLaunchCopied(true); setTimeout(() => setLaunchCopied(false), 2000) }}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold border border-white/15 text-white hover:bg-white/8 active:scale-[0.98]"
                style={{ minHeight: 48, transition: 'background 0.15s, transform 0.1s' }}
              >
                {launchCopied ? <><Check className="w-4 h-4 text-green-400" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Message</>}
              </button>
              {outreachTone === 'instagram' && lead.instagram ? (
                <a
                  href={lead.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => navigator.clipboard.writeText(launchMessage)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold bg-pink-500/15 border border-pink-500/25 text-pink-400 hover:bg-pink-500/20 active:scale-[0.98]"
                  style={{ minHeight: 48, transition: 'background 0.15s, transform 0.1s' }}
                >
                  <Copy className="w-4 h-4" /> Copy & Open Instagram
                </a>
              ) : (
                <>
                  {lead.phone && (
                    <a
                      href={`sms:${lead.phone}?body=${encodeURIComponent(launchMessage)}`}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold bg-green-500/15 border border-green-500/25 text-green-400 hover:bg-green-500/20 active:scale-[0.98]"
                      style={{ minHeight: 48, transition: 'background 0.15s, transform 0.1s' }}
                    >
                      <Phone className="w-4 h-4" /> Open in Messages — {lead.phone}
                    </a>
                  )}
                  {!lead.email && (
                    <input
                      type="email"
                      value={manualEmail}
                      onChange={e => setManualEmail(e.target.value)}
                      placeholder="No email found — enter one to send"
                      className={inputCls}
                    />
                  )}
                  {(lead.email || manualEmail) && (
                    <a
                      href={gmailHref(lead.email ?? manualEmail, `I built a free website for ${lead.business_name}`, launchMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold bg-[#0ea5e9]/15 border border-[#0ea5e9]/25 text-[#0ea5e9] hover:bg-[#0ea5e9]/20 active:scale-[0.98]"
                      style={{ minHeight: 48, transition: 'background 0.15s, transform 0.1s' }}
                    >
                      <Send className="w-4 h-4" /> Open in Gmail
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
