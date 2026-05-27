'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Copy, Check, ExternalLink, Wand2, AlertCircle, Send, Phone } from 'lucide-react'

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
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

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
        body: JSON.stringify({ id }),
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

      {/* Info card */}
      <div className={`${card} p-5 grid grid-cols-2 gap-4`}>
        <div>
          <p className="text-xs text-slate-500 mb-1">Source</p>
          <p className="text-sm text-white font-medium">{lead.source === 'google_maps' ? 'Google Maps' : 'Reddit'}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Score</p>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold tabular-nums ${
            lead.score >= 8 ? 'bg-red-500/15 text-red-400' :
            lead.score >= 5 ? 'bg-yellow-500/15 text-yellow-400' :
            'bg-slate-500/15 text-slate-400'
          }`}>{lead.score}/10</span>
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

      {/* Outreach drafter */}
      <div className={`${card} p-5 flex flex-col gap-4`}>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Outreach Draft</p>
          <button
            onClick={generateDraft}
            disabled={draftLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-black bg-[#0ea5e9] rounded-lg disabled:opacity-50 hover:bg-[#38bdf8]"
            style={{ transition: 'background 0.15s' }}
          >
            {draftLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
            {lead.outreach_draft ? 'Regenerate' : 'Generate Draft'}
          </button>
        </div>

        {draftError && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {draftError}
          </div>
        )}

        {lead.outreach_draft ? (
          <div className="flex flex-col gap-3">
            <div className="p-4 bg-white/3 border border-white/10 rounded-xl text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
              {lead.outreach_draft}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={copyDraft}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-white/10 rounded-lg text-slate-400 hover:text-white hover:border-white/30"
                style={{ transition: 'color 0.15s, border-color 0.15s' }}
              >
                {copied ? <><Check className="w-3.5 h-3.5 text-green-400" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
              </button>
              <a
                href={`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(lead.email ?? manualEmail)}&su=${encodeURIComponent(`Quick question about ${lead.business_name}'s website`)}&body=${encodeURIComponent(lead.outreach_draft ?? '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#0ea5e9] text-black rounded-lg hover:bg-[#38bdf8]"
                style={{ transition: 'background 0.15s' }}
              >
                <Send className="w-3.5 h-3.5" /> Send via Gmail
              </a>
            </div>
            {!lead.email && (
              <input
                type="email"
                value={manualEmail}
                onChange={e => setManualEmail(e.target.value)}
                placeholder="No email found — enter one manually"
                className={inputCls}
              />
            )}
            <p className="text-xs text-slate-600">Opens Gmail — review before sending.</p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No draft yet. Click Generate to create personalized outreach.</p>
        )}
      </div>
    </div>
  )
}
