'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Navigation } from '../components/Navigation'
import { Footer } from '../components/Footer'
import { business } from '../../config/business'
import { CalendarDays, Clock, CheckCircle2 } from 'lucide-react'

// ── helpers ──────────────────────────────────────────────────

function getDatesInWindow(windowDays: number, availableDays: number[]) {
  const dates: Date[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = 1; i <= windowDays; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    if (availableDays.includes(d.getDay())) dates.push(d)
  }
  return dates
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatDateValue(d: Date) {
  return d.toISOString().split('T')[0]
}

// ── step indicator ────────────────────────────────────────────

function StepIndicator({ step }: { step: number }) {
  const steps = ['Service', 'Date & Time', 'Your Info']
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map((label, i) => {
        const num = i + 1
        const active = step === num
        const done = step > num
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${done ? 'bg-accent border-accent text-white' : active ? 'bg-white border-accent text-accent' : 'bg-white border-slate-200 text-slate-400'}`}>
                {done ? <CheckCircle2 className="w-5 h-5" /> : num}
              </div>
              <span className={`text-xs mt-1.5 font-medium ${active ? 'text-accent' : done ? 'text-slate-600' : 'text-slate-400'}`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-16 sm:w-24 h-0.5 mx-2 mb-5 transition-all ${done ? 'bg-accent' : 'bg-slate-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── main page ─────────────────────────────────────────────────

export default function BookPage() {
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // form state
  const [service, setService] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState('')
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' })

  // booked slots for the selected date
  const [bookedTimes, setBookedTimes] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // blocked dates (hidden from calendar)
  const [blockedDates, setBlockedDates] = useState<string[]>([])

  const fetchBookedSlots = useCallback(async (date: Date) => {
    setLoadingSlots(true)
    try {
      const dateStr = formatDateValue(date)
      const res = await fetch(`/api/booked-slots?date=${dateStr}`)
      if (res.ok) {
        const data = await res.json()
        setBookedTimes(data.times ?? [])
      }
    } finally {
      setLoadingSlots(false)
    }
  }, [])

  useEffect(() => {
    fetch('/api/blocked-dates')
      .then((r) => r.json())
      .then((data) => setBlockedDates(data.dates ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (selectedDate) fetchBookedSlots(selectedDate)
    else setBookedTimes([])
  }, [selectedDate, fetchBookedSlots])

  const availableDates = useMemo(
    () => getDatesInWindow(business.bookingWindowDays, business.availableDays),
    []
  )

  // group dates by month, excluding blocked ones
  const datesByMonth = useMemo(() => {
    const map: Record<string, Date[]> = {}
    availableDates
      .filter((d) => !blockedDates.includes(formatDateValue(d)))
      .forEach((d) => {
        const key = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        if (!map[key]) map[key] = []
        map[key].push(d)
      })
    return map
  }, [availableDates, blockedDates])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      business_name: business.name,
      service,
      date: formatDateValue(selectedDate!),
      time: selectedTime,
      name: form.name,
      email: form.email,
      phone: form.phone,
      notes: form.notes,
    }

    try {
      // Supabase insert — swap in real client when keys are added
      const res = await fetch(`${business.supabaseUrl}/rest/v1/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: business.supabaseAnonKey,
          Authorization: `Bearer ${business.supabaseAnonKey}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        if (body?.code === '23505' || body?.message?.includes('unique')) {
          setError('That time slot was just taken. Please go back and pick a different time.')
          await fetchBookedSlots(selectedDate!)
        } else {
          throw new Error('Booking failed')
        }
        return
      }
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again or call us directly.')
    } finally {
      setLoading(false)
    }
  }

  // ── success screen ──
  if (submitted) {
    return (
      <main className="min-h-screen bg-white">
        <Navigation />
        <section className="max-w-xl mx-auto px-4 py-24 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-accent" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-slate-950 mb-4">
            You are booked!
          </h1>
          <p className="text-slate-600 text-lg mb-2">
            <span className="font-semibold text-slate-900">{service}</span> on{' '}
            <span className="font-semibold text-slate-900">{formatDate(selectedDate!)}</span> at{' '}
            <span className="font-semibold text-slate-900">{selectedTime}</span>
          </p>
          <p className="text-slate-500 mb-8">
            We will send a confirmation to <span className="font-medium text-slate-700">{form.email}</span>. If you need to make changes, call us at{' '}
            <a href={`tel:${business.phone}`} className="text-accent font-medium hover:underline">{business.phone}</a>.
          </p>
          <a href="/" className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent-dark transition">
            Back to Home
          </a>
        </section>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <Navigation />

      {/* Hero */}
      <section className="bg-gradient-to-br from-green-800 via-green-700 to-green-900 py-14 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-green-200 text-sm uppercase tracking-widest font-semibold mb-3">Online Booking</p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-3">
            Book an Appointment
          </h1>
          <p className="text-green-100 text-base sm:text-lg">
            Schedule your service with {business.name} in just a few steps.
          </p>
        </div>
      </section>

      {/* Card */}
      <section className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
        <StepIndicator step={step} />

        {/* ── Step 1: Service ── */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 mb-6">What service do you need?</h2>
            <div className="grid gap-3">
              {business.services.map((s) => (
                <button
                  key={s.title}
                  onClick={() => setService(s.title)}
                  className={`w-full text-left px-5 py-4 rounded-2xl border-2 font-medium transition-all duration-200 ${service === s.title ? 'border-accent bg-green-50 text-accent' : 'border-slate-200 text-slate-700 hover:border-accent/50 hover:bg-slate-50'}`}
                >
                  {s.title}
                </button>
              ))}
            </div>
            <div className="pt-6">
              <button
                disabled={!service}
                onClick={() => setStep(2)}
                className="w-full py-4 rounded-2xl bg-accent text-white font-semibold text-base hover:bg-accent-dark transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Date & Time ── */}
        {step === 2 && (
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-5">
                <CalendarDays className="w-5 h-5 text-accent" />
                <h2 className="text-xl font-bold text-slate-900">Pick a date</h2>
              </div>
              <div className="space-y-6">
                {Object.entries(datesByMonth).map(([month, dates]) => (
                  <div key={month}>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">{month}</p>
                    <div className="flex flex-wrap gap-2">
                      {dates.map((d) => {
                        const isSelected = selectedDate?.toDateString() === d.toDateString()
                        return (
                          <button
                            key={d.toISOString()}
                            onClick={() => { setSelectedDate(d); setSelectedTime('') }}
                            className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${isSelected ? 'border-accent bg-accent text-white' : 'border-slate-200 text-slate-700 hover:border-accent/50'}`}
                          >
                            {formatDate(d)}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedDate && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-accent" />
                  <h2 className="text-xl font-bold text-slate-900">Pick a time</h2>
                  {loadingSlots && <span className="text-xs text-slate-400 ml-1">Checking availability...</span>}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {business.timeSlots.map((t) => {
                    const isBooked = bookedTimes.includes(t)
                    const isSelected = selectedTime === t
                    return (
                      <button
                        key={t}
                        disabled={isBooked}
                        onClick={() => setSelectedTime(t)}
                        className={`py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          isBooked
                            ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed line-through'
                            : isSelected
                            ? 'border-accent bg-accent text-white'
                            : 'border-slate-200 text-slate-700 hover:border-accent/50'
                        }`}
                      >
                        {t}
                      </button>
                    )
                  })}
                </div>
                {bookedTimes.length > 0 && (
                  <p className="text-xs text-slate-400 mt-3">Strikethrough times are already booked.</p>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(1)} className="w-1/3 py-4 rounded-2xl border-2 border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition">
                Back
              </button>
              <button
                disabled={!selectedDate || !selectedTime}
                onClick={() => setStep(3)}
                className="flex-1 py-4 rounded-2xl bg-accent text-white font-semibold hover:bg-accent-dark transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Contact Info ── */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Your information</h2>

            {/* Booking summary */}
            <div className="rounded-2xl bg-green-50 border-2 border-green-100 p-5 mb-6 space-y-1">
              <p className="text-sm font-semibold text-slate-700">{service}</p>
              <p className="text-sm text-slate-500">{formatDate(selectedDate!)} at {selectedTime}</p>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-slate-800">Full Name</span>
              <input
                type="text"
                required
                placeholder="Jane Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-800">Email</span>
              <input
                type="email"
                required
                placeholder="jane@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-800">Phone</span>
              <input
                type="tel"
                required
                placeholder="(555) 123-4567"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-800">Notes <span className="text-slate-400 font-normal">(optional)</span></span>
              <textarea
                rows={4}
                placeholder="Any details about your property or project we should know..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep(2)} className="w-1/3 py-4 rounded-2xl border-2 border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition">
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-4 rounded-2xl bg-accent text-white font-semibold hover:bg-accent-dark transition disabled:opacity-60"
              >
                {loading ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </form>
        )}
      </section>

      <Footer />
    </main>
  )
}
