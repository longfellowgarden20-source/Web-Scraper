'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, ChevronDown, ChevronUp, Loader2, RefreshCw, Mail, Star, Download, Send } from 'lucide-react'

type Lead = {
  id: string
  created_at: string
  source: 'google_maps' | 'reddit'
  business_name: string
  city: string
  category: string
  website: string | null
  phone: string | null
  score: number
  status: 'new' | 'contacted' | 'replied' | 'converted' | 'passed'
  outreach_draft: string | null
  notes: string | null
  reddit_url: string | null
  maps_place_id: string | null
  email: string | null
  instagram: string | null
  facebook: string | null
  google_rating: number | null
  google_review_count: number | null
  starred: boolean | null
}

type SortKey = 'business_name' | 'score' | 'city' | 'created_at' | 'status'

const card = 'bg-white/5 border border-white/10 rounded-2xl'
const input = 'px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-[#0ea5e9]/60'
const select = `${input} cursor-pointer`

const STATUSES = ['all', 'new', 'contacted', 'replied', 'converted', 'passed'] as const
const SOURCES = ['all', 'google_maps', 'reddit'] as const

function statusBadge(s: Lead['status']) {
  const map = {
    new: { bg: 'bg-[#0ea5e9]/15', text: 'text-[#0ea5e9]', label: 'New' },
    contacted: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', label: 'Contacted' },
    replied: { bg: 'bg-purple-500/15', text: 'text-purple-400', label: 'Replied' },
    converted: { bg: 'bg-green-500/15', text: 'text-green-400', label: 'Converted' },
    passed: { bg: 'bg-slate-500/15', text: 'text-slate-400', label: 'Passed' },
  }
  const c = map[s] ?? map.new
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>{c.label}</span>
}

function scoreBadge(n: number) {
  const color = n >= 8 ? 'bg-red-500/15 text-red-400' : n >= 5 ? 'bg-yellow-500/15 text-yellow-400' : 'bg-slate-500/15 text-slate-400'
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold tabular-nums ${color}`}>{n}/10</span>
}

export default function LeadsClient() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const [digestSending, setDigestSending] = useState(false)
  const [digestMsg, setDigestMsg] = useState<string | null>(null)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (sourceFilter !== 'all') params.set('source', sourceFilter)
    if (search) params.set('search', search)
    const res = await fetch(`/api/leads?${params}`)
    const data = await res.json()
    setLeads(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [statusFilter, sourceFilter, search])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const setSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(k); setSortDir('desc') }
  }

  const sorted = [...leads].sort((a, b) => {
    const mul = sortDir === 'asc' ? 1 : -1
    if (sortKey === 'score') return mul * (a.score - b.score)
    if (sortKey === 'business_name') return mul * a.business_name.localeCompare(b.business_name)
    if (sortKey === 'city') return mul * (a.city ?? '').localeCompare(b.city ?? '')
    if (sortKey === 'status') return mul * a.status.localeCompare(b.status)
    return mul * a.created_at.localeCompare(b.created_at)
  })

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id)
    await fetch('/api/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    setLeads(l => l.map(x => x.id === id ? { ...x, status: status as Lead['status'] } : x))
    setUpdatingId(null)
  }

  const bulkUpdateStatus = async (status: string) => {
    if (!selected.size) return
    setBulkUpdating(true)
    await Promise.all([...selected].map(id =>
      fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
    ))
    setLeads(l => l.map(x => selected.has(x.id) ? { ...x, status: status as Lead['status'] } : x))
    setSelected(new Set())
    setBulkUpdating(false)
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelected(prev => prev.size === sorted.length ? new Set() : new Set(sorted.map(l => l.id)))
  }

  const toggleStar = async (lead: Lead) => {
    const next = !lead.starred
    setLeads(l => l.map(x => x.id === lead.id ? { ...x, starred: next } : x))
    await fetch('/api/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: lead.id, starred: next }),
    })
  }

  const sendDigest = async () => {
    setDigestSending(true)
    setDigestMsg(null)
    const res = await fetch('/api/digest', { method: 'POST' })
    const data = await res.json()
    setDigestMsg(res.ok ? 'Digest sent! Check your inbox.' : data.error ?? 'Failed to send')
    setDigestSending(false)
    setTimeout(() => setDigestMsg(null), 5000)
  }

  const SortBtn = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <button onClick={() => setSort(k)} className="flex items-center gap-1 text-xs font-semibold text-slate-500 uppercase tracking-wide hover:text-white" style={{ transition: 'color 0.15s' }}>
      {children}
      {sortKey === k && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
    </button>
  )

  const newCount = leads.filter(l => l.status === 'new').length
  const convertedCount = leads.filter(l => l.status === 'converted').length
  const mapsCount = leads.filter(l => l.source === 'google_maps').length
  const redditCount = leads.filter(l => l.source === 'reddit').length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Leads</h1>
          <p className="text-sm text-slate-500 mt-0.5">{leads.length} total · {newCount} new</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={sendDigest} disabled={digestSending} title="Send digest email" className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/8 border border-white/10 rounded-lg disabled:opacity-40" style={{ transition: 'background 0.15s' }}>
            {digestSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {digestSending ? 'Sending...' : 'Send Digest'}
          </button>
          <a href="/api/leads/export" download className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 border border-white/10" style={{ transition: 'background 0.15s' }} title="Export CSV">
            <Download className="w-4 h-4" />
          </a>
          <button onClick={fetchLeads} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 border border-white/10" style={{ transition: 'background 0.15s' }}>
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        {digestMsg && (
          <p className={`text-xs mt-1 ${digestMsg.includes('sent') ? 'text-green-400' : 'text-red-400'}`}>{digestMsg}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'New Leads', value: newCount, color: 'text-[#0ea5e9]', bg: 'bg-[#0ea5e9]/10' },
          { label: 'Converted', value: convertedCount, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'From Maps', value: mapsCount, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { label: 'From Reddit', value: redditCount, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${card} p-4`}>
            <p className="text-xs text-slate-500">{label}</p>
            <p className={`text-2xl font-bold mt-1 tabular-nums ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Promising Leads */}
      {leads.some(l => l.starred) && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wide">Promising Leads</h2>
            <span className="text-xs text-slate-500">{leads.filter(l => l.starred).length} saved</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {leads.filter(l => l.starred).map(lead => (
              <div key={lead.id} className="flex items-center justify-between gap-3 px-4 py-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{lead.business_name}</p>
                  <p className="text-xs text-slate-500">{lead.city || '—'} · {scoreBadge(lead.score)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/leads/${lead.id}`} className="px-2.5 py-1 text-xs text-[#0ea5e9] border border-[#0ea5e9]/30 rounded-lg hover:bg-[#0ea5e9]/10" style={{ transition: 'background 0.15s' }}>
                    View
                  </Link>
                  <button onClick={() => toggleStar(lead)} className="text-yellow-400 hover:text-slate-400" style={{ transition: 'color 0.15s' }} title="Remove">
                    <Star className="w-4 h-4 fill-yellow-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={`${card} p-4 flex flex-col sm:flex-row gap-3`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search business name..."
            className={`${input} w-full pl-9`}
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={select}>
          {STATUSES.map(s => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className={select}>
          {SOURCES.map(s => <option key={s} value={s}>{s === 'all' ? 'All sources' : s === 'google_maps' ? 'Google Maps' : 'Reddit'}</option>)}
        </select>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-[#0ea5e9]/10 border border-[#0ea5e9]/30 rounded-xl">
          <span className="text-sm text-[#0ea5e9] font-semibold">{selected.size} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-slate-400">Mark as:</span>
            {['contacted', 'replied', 'converted', 'passed'].map(s => (
              <button key={s} onClick={() => bulkUpdateStatus(s)} disabled={bulkUpdating}
                className="px-2.5 py-1 text-xs font-semibold border border-white/10 rounded-lg text-slate-300 hover:bg-white/8 disabled:opacity-40 capitalize"
                style={{ transition: 'background 0.15s' }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className={`${card} overflow-hidden`}>
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading leads...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 w-8">
                    <input type="checkbox" checked={selected.size === sorted.length && sorted.length > 0} onChange={toggleSelectAll} className="accent-[#0ea5e9] cursor-pointer" />
                  </th>
                  <th className="px-4 py-3 text-left"><SortBtn k="business_name">Business</SortBtn></th>
                  <th className="px-4 py-3 text-left"><SortBtn k="city">City</SortBtn></th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Reviews</th>
                  <th className="px-4 py-3 text-left"><SortBtn k="score">Score</SortBtn></th>
                  <th className="px-4 py-3 text-left"><SortBtn k="status">Status</SortBtn></th>
                  <th className="px-4 py-3 w-8"></th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sorted.map(lead => (
                  <tr key={lead.id} className={`hover:bg-white/3 ${selected.has(lead.id) ? 'bg-[#0ea5e9]/5' : ''}`} style={{ transition: 'background 0.1s' }}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(lead.id)} onChange={() => toggleSelect(lead.id)} className="accent-[#0ea5e9] cursor-pointer" />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-medium text-white">{lead.business_name}</span>
                        {lead.website && (
                          <a href={lead.website} target="_blank" rel="noopener noreferrer" className="block text-xs text-slate-500 hover:text-[#0ea5e9] truncate max-w-[180px]" style={{ transition: 'color 0.15s' }}>
                            {lead.website.replace(/^https?:\/\//, '')}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{lead.city || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {lead.email && (
                          <a href={`mailto:${lead.email}`} title={lead.email} className="text-[#0ea5e9] hover:text-white" style={{ transition: 'color 0.15s' }}>
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {lead.instagram && (
                          <a href={lead.instagram} target="_blank" rel="noopener noreferrer" title="Instagram" className="text-pink-400 hover:text-white text-xs font-bold" style={{ transition: 'color 0.15s' }}>IG</a>
                        )}
                        {lead.facebook && (
                          <a href={lead.facebook} target="_blank" rel="noopener noreferrer" title="Facebook" className="text-blue-400 hover:text-white text-xs font-bold" style={{ transition: 'color 0.15s' }}>FB</a>
                        )}
                        {!lead.email && !lead.instagram && !lead.facebook && (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {lead.google_review_count != null ? (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400" />
                          <span className="text-xs text-white tabular-nums">{lead.google_rating?.toFixed(1)}</span>
                          <span className="text-xs text-slate-500">({lead.google_review_count})</span>
                        </div>
                      ) : <span className="text-slate-600 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">{scoreBadge(lead.score)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={lead.status}
                        onChange={e => updateStatus(lead.id, e.target.value)}
                        disabled={updatingId === lead.id}
                        className="bg-transparent text-xs font-semibold border-none outline-none cursor-pointer"
                        style={{ color: 'inherit' }}
                      >
                        {['new', 'contacted', 'replied', 'converted', 'passed'].map(s => (
                          <option key={s} value={s} className="bg-[#0a0f1a]">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStar(lead)}
                        title={lead.starred ? 'Remove from Promising' : 'Save to Promising'}
                        className={`${lead.starred ? 'text-yellow-400' : 'text-slate-600 hover:text-yellow-400'}`}
                        style={{ transition: 'color 0.15s' }}
                      >
                        <Star className={`w-4 h-4 ${lead.starred ? 'fill-yellow-400' : ''}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="px-2.5 py-1 text-xs text-[#0ea5e9] border border-[#0ea5e9]/30 rounded-lg hover:bg-[#0ea5e9]/10"
                        style={{ transition: 'background 0.15s' }}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sorted.length === 0 && (
              <div className="text-center py-16 text-slate-500 text-sm">No leads found. Run a scrape to find some.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
