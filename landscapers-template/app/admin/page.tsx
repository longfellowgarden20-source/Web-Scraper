'use client'

import { useState, useEffect, useCallback } from 'react'
import { business } from '../../config/business'
import {
  LogOut, RefreshCw, CheckCircle2, XCircle, Trash2,
  CalendarDays, Clock, User, Mail, Phone, Briefcase,
  ChevronDown, Search, Ban, Star,
} from 'lucide-react'

// ── types ─────────────────────────────────────────────────────

type Status = 'pending' | 'confirmed' | 'cancelled'
type AdminTab = 'appointments' | 'blocked' | 'reviews'

interface Review {
  id: string
  name: string
  email: string
  rating: number
  comment: string
  approved: boolean
  created_at: string
}

interface Appointment {
  id: string
  business_name: string
  service: string
  date: string
  time: string
  name: string
  email: string
  phone: string
  notes: string | null
  status: Status
  created_at: string
}

// ── helpers ───────────────────────────────────────────────────

const STATUS_STYLES: Record<Status, string> = {
  pending:   'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
}

function fmt(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

function supabaseHeaders(useServiceKey = false) {
  const key = useServiceKey ? business.supabaseServiceKey : business.supabaseAnonKey
  return {
    'Content-Type': 'application/json',
    apikey: key,
    Authorization: `Bearer ${key}`,
  }
}

// ── password gate ─────────────────────────────────────────────

function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pw === business.adminPassword) {
      onAuth()
    } else {
      setErr(true)
      setPw('')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
            🌿
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{business.name}</h1>
          <p className="text-slate-500 text-sm mt-1">Admin Dashboard</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border-2 border-slate-100 shadow-sm p-8 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              value={pw}
              onChange={(e) => { setPw(e.target.value); setErr(false) }}
              placeholder="Enter admin password"
              autoFocus
              className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 transition ${err ? 'border-red-400 focus:ring-red-200' : 'border-slate-300 focus:border-accent focus:ring-accent/20'}`}
            />
          </label>
          {err && <p className="text-red-600 text-xs">Incorrect password. Try again.</p>}
          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-accent text-white font-semibold hover:bg-accent-dark transition"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}

// ── main dashboard ────────────────────────────────────────────

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [activeTab, setActiveTab] = useState<AdminTab>('appointments')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // blocked dates state
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [blockInput, setBlockInput] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [blockLoading, setBlockLoading] = useState(false)
  const [blockError, setBlockError] = useState('')

  const fetchBlockedDates = useCallback(async () => {
    const res = await fetch('/api/blocked-dates')
    if (res.ok) {
      const data = await res.json()
      setBlockedDates(data.dates ?? [])
    }
  }, [])

  async function addBlockedDate() {
    if (!blockInput) return
    setBlockLoading(true)
    setBlockError('')
    const res = await fetch('/api/blocked-dates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: blockInput, reason: blockReason }),
    })
    if (res.ok) {
      setBlockInput('')
      setBlockReason('')
      await fetchBlockedDates()
    } else {
      const data = await res.json().catch(() => ({}))
      setBlockError(data.error === 'already_blocked' ? 'That date is already blocked.' : 'Failed to block date.')
    }
    setBlockLoading(false)
  }

  async function removeBlockedDate(date: string) {
    await fetch(`/api/blocked-dates?date=${date}`, { method: 'DELETE' })
    setBlockedDates((prev) => prev.filter((d) => d !== date))
  }

  // reviews state
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)

  const fetchReviews = useCallback(async () => {
    setReviewsLoading(true)
    try {
      const res = await fetch('/api/reviews', { method: 'PUT' })
      if (res.ok) {
        const data = await res.json()
        setReviews(data.reviews ?? [])
      }
    } finally {
      setReviewsLoading(false)
    }
  }, [])

  async function approveReview(id: string, approved: boolean) {
    await fetch('/api/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, approved }),
    })
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, approved } : r))
  }

  async function deleteReview(id: string) {
    if (!confirm('Delete this review? This cannot be undone.')) return
    await fetch(`/api/reviews?id=${id}`, { method: 'DELETE' })
    setReviews((prev) => prev.filter((r) => r.id !== id))
  }

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `${business.supabaseUrl}/rest/v1/appointments?select=*&order=date.asc,time.asc`,
        { headers: supabaseHeaders(true) }
      )
      const data = await res.json()
      setAppointments(Array.isArray(data) ? data : [])
    } catch {
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authed) {
      fetchAppointments()
      fetchBlockedDates()
      fetchReviews()
    }
  }, [authed, fetchAppointments, fetchBlockedDates, fetchReviews])

  async function updateStatus(id: string, status: Status) {
    await fetch(`${business.supabaseUrl}/rest/v1/appointments?id=eq.${id}`, {
      method: 'PATCH',
      headers: supabaseHeaders(true),
      body: JSON.stringify({ status }),
    })
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    )
  }

  async function deleteAppointment(id: string) {
    if (!confirm('Delete this appointment? This cannot be undone.')) return
    await fetch(`${business.supabaseUrl}/rest/v1/appointments?id=eq.${id}`, {
      method: 'DELETE',
      headers: supabaseHeaders(true),
    })
    setAppointments((prev) => prev.filter((a) => a.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />

  // ── filter + search ──
  const filtered = appointments.filter((a) => {
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      a.name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.service.toLowerCase().includes(q) ||
      a.phone.includes(q)
    return matchesStatus && matchesSearch
  })

  const counts = {
    all: appointments.length,
    pending: appointments.filter((a) => a.status === 'pending').length,
    confirmed: appointments.filter((a) => a.status === 'confirmed').length,
    cancelled: appointments.filter((a) => a.status === 'cancelled').length,
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center text-lg">🌿</div>
            <div>
              <p className="font-bold text-slate-900 text-sm leading-none">{business.name}</p>
              <p className="text-xs text-slate-400">Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAppointments}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => setAuthed(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex gap-1 bg-slate-100 rounded-2xl p-1 w-fit">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'appointments' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <CalendarDays className="w-4 h-4" />
            Appointments
          </button>
          <button
            onClick={() => setActiveTab('blocked')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'blocked' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Ban className="w-4 h-4" />
            Block Dates
            {blockedDates.length > 0 && (
              <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">{blockedDates.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'reviews' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Star className="w-4 h-4" />
            Reviews
            {reviews.filter((r) => !r.approved).length > 0 && (
              <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {reviews.filter((r) => !r.approved).length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Blocked Dates Tab ── */}
        {activeTab === 'blocked' && (
          <div className="max-w-xl">
            <p className="text-sm text-slate-500 mb-6">
              Blocked dates are hidden from the customer booking calendar. Use this for holidays, vacations, or days you are unavailable.
            </p>

            {/* Add date form */}
            <div className="bg-white rounded-2xl border-2 border-slate-100 p-6 mb-6">
              <h3 className="font-semibold text-slate-900 mb-4">Block a date</h3>
              <div className="space-y-3">
                <input
                  type="date"
                  value={blockInput}
                  onChange={(e) => setBlockInput(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                <input
                  type="text"
                  placeholder="Reason (optional) — e.g. Holiday"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                {blockError && <p className="text-sm text-red-600">{blockError}</p>}
                <button
                  onClick={addBlockedDate}
                  disabled={!blockInput || blockLoading}
                  className="w-full py-3 rounded-2xl bg-accent text-white font-semibold hover:bg-accent-dark transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {blockLoading ? 'Blocking...' : 'Block Date'}
                </button>
              </div>
            </div>

            {/* Blocked dates list */}
            {blockedDates.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Ban className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No dates blocked yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {blockedDates.map((date) => (
                  <div key={date} className="flex items-center justify-between bg-white rounded-2xl border-2 border-slate-100 px-5 py-4">
                    <span className="text-sm font-medium text-slate-900">
                      {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                    <button
                      onClick={() => removeBlockedDate(date)}
                      className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition"
                      title="Unblock"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Reviews Tab ── */}
        {activeTab === 'reviews' && (
          <div>
            <p className="text-sm text-slate-500 mb-6">
              Approve reviews to make them visible on the public reviews page. Pending reviews are shown first.
            </p>
            {reviewsLoading ? (
              <div className="text-center py-16 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3" />
                <p>Loading reviews...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                <Star className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="font-medium text-slate-500">No reviews yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...reviews].sort((a, b) => Number(a.approved) - Number(b.approved)).map((r) => (
                  <div key={r.id} className={`bg-white rounded-2xl border-2 p-5 ${r.approved ? 'border-green-100' : 'border-yellow-200'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="font-semibold text-slate-900 text-sm">{r.name}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${r.approved ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}`}>
                            {r.approved ? 'Approved' : 'Pending'}
                          </span>
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map((n) => (
                              <Star key={n} className={`w-3.5 h-3.5 ${n <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed mb-2">&ldquo;{r.comment}&rdquo;</p>
                        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{r.email}</span>
                          <span>{new Date(r.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {r.approved ? (
                          <button
                            onClick={() => approveReview(r.id, false)}
                            title="Unapprove"
                            className="p-2 rounded-xl text-yellow-600 hover:bg-yellow-50 transition"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => approveReview(r.id, true)}
                            title="Approve"
                            className="p-2 rounded-xl text-green-600 hover:bg-green-50 transition"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteReview(r.id)}
                          title="Delete"
                          className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'appointments' && <>
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {([['all', 'Total', 'bg-white'], ['pending', 'Pending', 'bg-yellow-50'], ['confirmed', 'Confirmed', 'bg-green-50'], ['cancelled', 'Cancelled', 'bg-red-50']] as const).map(([key, label, bg]) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`${bg} rounded-2xl border-2 p-5 text-left transition-all ${filterStatus === key ? 'border-accent shadow-sm' : 'border-slate-100 hover:border-slate-200'}`}
            >
              <p className="text-2xl font-bold text-slate-900">{counts[key]}</p>
              <p className="text-sm text-slate-500 mt-0.5">{label}</p>
            </button>
          ))}
        </div>

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone, or service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as Status | 'all')}
              className="appearance-none pl-4 pr-10 py-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Appointments list */}
        {loading ? (
          <div className="text-center py-24 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
            <p>Loading appointments...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-slate-400">
            <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium text-slate-600">No appointments found</p>
            <p className="text-sm mt-1">
              {search || filterStatus !== 'all' ? 'Try clearing your filters.' : 'Bookings will appear here once customers schedule.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((appt) => (
              <div key={appt.id} className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden hover:border-slate-200 transition">
                {/* Summary row */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === appt.id ? null : appt.id)}
                >
                  {/* Date block */}
                  <div className="hidden sm:flex flex-col items-center justify-center w-14 h-14 bg-slate-50 rounded-xl border border-slate-200 flex-shrink-0 text-center">
                    <span className="text-xs text-slate-400 font-medium uppercase leading-none">
                      {new Date(appt.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-xl font-bold text-slate-900 leading-none mt-0.5">
                      {new Date(appt.date + 'T00:00:00').getDate()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-900 text-sm">{appt.name}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLES[appt.status]}`}>
                        {appt.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{appt.service}</span>
                      <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{fmt(appt.date)}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{appt.time}</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {appt.status !== 'confirmed' && (
                      <button
                        onClick={() => updateStatus(appt.id, 'confirmed')}
                        title="Confirm"
                        className="p-2 rounded-xl text-green-600 hover:bg-green-50 transition"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    )}
                    {appt.status !== 'cancelled' && (
                      <button
                        onClick={() => updateStatus(appt.id, 'cancelled')}
                        title="Cancel"
                        className="p-2 rounded-xl text-yellow-600 hover:bg-yellow-50 transition"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteAppointment(appt.id)}
                      title="Delete"
                      className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedId === appt.id ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Expanded detail */}
                {expandedId === appt.id && (
                  <div className="px-5 pb-5 border-t border-slate-100 pt-4 grid sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-accent flex-shrink-0" />
                        <span className="text-slate-600">{appt.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-accent flex-shrink-0" />
                        <a href={`mailto:${appt.email}`} className="text-accent hover:underline">{appt.email}</a>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-accent flex-shrink-0" />
                        <a href={`tel:${appt.phone}`} className="text-accent hover:underline">{appt.phone}</a>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase className="w-4 h-4 text-accent flex-shrink-0" />
                        <span className="text-slate-600">{appt.service}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarDays className="w-4 h-4 text-accent flex-shrink-0" />
                        <span className="text-slate-600">{fmt(appt.date)} at {appt.time}</span>
                      </div>
                      {appt.notes && (
                        <div className="text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                          <span className="font-medium text-slate-700">Notes: </span>{appt.notes}
                        </div>
                      )}
                    </div>
                    <div className="sm:col-span-2 text-xs text-slate-400 pt-1">
                      Booked {new Date(appt.created_at).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        </>}
      </div>
    </div>
  )
}
