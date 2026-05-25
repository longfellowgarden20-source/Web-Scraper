'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MessageSquare, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

const card = 'bg-white/5 border border-white/10 rounded-2xl'

const SUBREDDITS = ['r/entrepreneur', 'r/smallbusiness', 'r/Etsy', 'r/ecommerce']
const KEYWORDS = [
  'need a website', 'looking for a developer', 'website help',
  'build me a site', 'need web design', 'hire a developer',
]

export default function RedditClient() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ saved: number; found: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sync = async () => {
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const res = await fetch('/api/scrape/reddit', { method: 'POST' })
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
        <h1 className="text-2xl font-bold text-white tracking-tight">Reddit Monitor</h1>
        <p className="text-sm text-slate-500 mt-0.5">Catch people actively asking for web help. Pulls latest 25 posts per subreddit.</p>
      </div>

      <div className={`${card} p-5 flex flex-col gap-5`}>
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Watching subreddits</p>
          <div className="flex flex-wrap gap-2">
            {SUBREDDITS.map(s => (
              <span key={s} className="px-2.5 py-1 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg font-medium">{s}</span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Keyword triggers</p>
          <div className="flex flex-wrap gap-2">
            {KEYWORDS.map(k => (
              <span key={k} className="px-2.5 py-1 text-xs text-slate-400 bg-white/5 border border-white/10 rounded-lg">"{k}"</span>
            ))}
          </div>
        </div>

        <button
          onClick={sync}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0ea5e9] text-black text-sm font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#38bdf8] self-start"
          style={{ transition: 'background 0.15s' }}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Scanning Reddit...</>
          ) : (
            <><MessageSquare className="w-4 h-4" /> Sync Now</>
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <div className={`${card} p-5 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-sm font-semibold text-white">{result.saved} new leads saved</p>
              <p className="text-xs text-slate-500">{result.found} total keyword matches found across all subreddits</p>
            </div>
          </div>
          <Link href="/dashboard" className="text-xs text-[#0ea5e9] hover:underline">View leads →</Link>
        </div>
      )}
    </div>
  )
}
