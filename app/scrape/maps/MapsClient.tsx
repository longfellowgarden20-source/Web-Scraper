'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'

const card = 'bg-white/5 border border-white/10 rounded-2xl'
const inputCls = 'px-3 py-2.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-[#0ea5e9]/60 w-full'

const PRESETS = [
  'plumber Los Angeles',
  'electrician Houston',
  'landscaper Phoenix',
  'auto repair Chicago',
  'dentist San Diego',
  'restaurant Miami',
  'hair salon Dallas',
  'HVAC Denver',
]

type ScrapeResult = {
  business_name: string
  city: string
  category: string
  website: string | null
  score: number
}

export default function MapsClient() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ saved: number; leads: ScrapeResult[]; message?: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = async (q?: string) => {
    const finalQuery = q ?? query
    if (!finalQuery.trim()) return
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const res = await fetch('/api/scrape/maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: finalQuery }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Request failed')
      setResult(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Google Maps Scraper</h1>
        <p className="text-sm text-slate-500 mt-0.5">Find local businesses with weak web presence. Max 20 results per run.</p>
      </div>

      <div className={`${card} p-5 flex flex-col gap-4`}>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Search Query</label>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && run()}
            placeholder='e.g. "plumber Los Angeles"'
            className={inputCls}
          />
          <button
            onClick={() => run()}
            disabled={loading || !query.trim()}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0ea5e9] text-black text-sm font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#38bdf8] flex-shrink-0"
            style={{ transition: 'background 0.15s' }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Scrape
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-slate-600 uppercase tracking-wide font-semibold">Quick presets</p>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map(p => (
              <button
                key={p}
                onClick={() => { setQuery(p); run(p) }}
                disabled={loading}
                className="px-2.5 py-1 text-xs text-slate-400 border border-white/10 rounded-lg hover:border-[#0ea5e9]/40 hover:text-[#0ea5e9] disabled:opacity-40"
                style={{ transition: 'border-color 0.15s, color 0.15s' }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <div className={`${card} p-5 flex flex-col gap-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-semibold">{result.saved} leads saved</span>
            </div>
            <Link href="/dashboard" className="text-xs text-[#0ea5e9] hover:underline">View all leads →</Link>
          </div>

          {result.message && <p className="text-sm text-slate-400">{result.message}</p>}

          {result.leads?.length > 0 && (
            <div className="flex flex-col gap-2">
              {result.leads.map((lead, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-white">{lead.business_name}</p>
                    <p className="text-xs text-slate-500">{lead.city} · {lead.category}</p>
                    {lead.website && (
                      <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-600 hover:text-[#0ea5e9] flex items-center gap-1" style={{ transition: 'color 0.15s' }}>
                        {lead.website.replace(/^https?:\/\//, '').slice(0, 40)}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {!lead.website && <span className="text-xs text-red-400">No website</span>}
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold tabular-nums ${
                      lead.score >= 8 ? 'bg-red-500/15 text-red-400' :
                      lead.score >= 5 ? 'bg-yellow-500/15 text-yellow-400' :
                      'bg-slate-500/15 text-slate-400'
                    }`}>{lead.score}/10</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
