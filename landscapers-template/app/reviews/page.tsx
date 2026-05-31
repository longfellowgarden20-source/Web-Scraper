'use client'

import { useState, useEffect } from 'react'
import { Navigation } from '../components/Navigation'
import { Footer } from '../components/Footer'
import { Star, ExternalLink, CheckCircle2 } from 'lucide-react'
import { business } from '../../config/business'

interface Review {
  id: string
  name: string
  rating: number
  comment: string
  created_at: string
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-4 h-4 ${n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`}
        />
      ))}
    </div>
  )
}

function StarPicker({ rating, onSelect }: { rating: number; onSelect: (r: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onSelect(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              n <= (hovered || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', rating: 0, comment: '' })

  const hasGoogle = !!business.googleReviewUrl

  useEffect(() => {
    fetch('/api/reviews')
      .then((r) => r.json())
      .then((data) => setReviews(data.reviews ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.rating === 0) { setError('Please select a star rating.'); return }
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setSubmitted(true)
    } else {
      setError('Something went wrong. Please try again.')
    }
    setSubmitting(false)
  }

  const avg = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null

  return (
    <main className="min-h-screen bg-white">
      <Navigation />

      {/* Hero */}
      <section className="bg-gradient-to-br from-green-800 via-green-700 to-green-900 py-14 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-green-200 text-sm uppercase tracking-widest font-semibold mb-3">Customer Reviews</p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-3">
            What our clients say
          </h1>
          {avg && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <span className="text-4xl font-bold text-white">{avg}</span>
              <div className="flex flex-col items-start">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((n) => (
                    <Star key={n} className={`w-5 h-5 ${n <= Math.round(Number(avg)) ? 'fill-yellow-400 text-yellow-400' : 'text-green-600'}`} />
                  ))}
                </div>
                <span className="text-green-200 text-xs mt-0.5">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">

        {/* ── Google Reviews CTA (shown when googleReviewUrl is set) ── */}
        {hasGoogle && (
          <section className="rounded-3xl border-2 border-green-100 bg-green-50 p-8 sm:p-10 flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center">
              {/* Google G icon */}
              <svg viewBox="0 0 24 24" className="w-8 h-8">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Happy with our service?</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Leave us a Google review — it takes 30 seconds and helps other homeowners find us.
              </p>
            </div>
            <a
              href={business.googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-2xl font-semibold text-sm hover:bg-accent-dark transition"
            >
              Leave a Google Review
              <ExternalLink className="w-4 h-4" />
            </a>
          </section>
        )}

        {/* ── Custom review form (always shown) ── */}
        <section>
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">Leave a review</h2>
          {hasGoogle && (
            <p className="text-sm text-slate-500 mb-6">
              Prefer to write directly on our site? Fill in the form below — reviews are approved before they appear publicly.
            </p>
          )}
          {submitted ? (
            <div className="rounded-2xl bg-green-50 border-2 border-green-100 p-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-accent mx-auto mb-3" />
              <p className="font-semibold text-slate-900 text-lg mb-1">Thank you for your review!</p>
              <p className="text-slate-500 text-sm">It will appear once approved by our team.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border-2 border-green-100 p-8 space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <label className="block">
                  <span className="text-sm font-medium text-slate-800">Your Name</span>
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
                  <span className="text-sm font-medium text-slate-800">Email <span className="text-slate-400 font-normal">(not shown publicly)</span></span>
                  <input
                    type="email"
                    required
                    placeholder="jane@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </label>
              </div>

              <div>
                <span className="text-sm font-medium text-slate-800 block mb-2">Rating</span>
                <StarPicker rating={form.rating} onSelect={(r) => setForm({ ...form, rating: r })} />
              </div>

              <label className="block">
                <span className="text-sm font-medium text-slate-800">Your Review</span>
                <textarea
                  required
                  rows={4}
                  placeholder={`Tell others about your experience with ${business.name}...`}
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>

              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-2xl bg-accent text-white font-semibold hover:bg-accent-dark transition disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}
        </section>

        {/* ── Approved reviews grid ── */}
        <section>
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-6">
            {reviews.length > 0 ? `${reviews.length} Review${reviews.length !== 1 ? 's' : ''}` : 'Reviews'}
          </h2>
          {loading ? (
            <div className="text-center py-16 text-slate-400">Loading reviews...</div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
              <Star className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-slate-500">No reviews yet.</p>
              <p className="text-sm mt-1">Be the first to leave one above.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {reviews.map((r) => (
                <div key={r.id} className="bg-white rounded-2xl border-2 border-green-100 p-6">
                  <div className="flex items-center justify-between mb-3">
                    <StarDisplay rating={r.rating} />
                    <span className="text-xs text-slate-400">
                      {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed text-sm mb-4">&ldquo;{r.comment}&rdquo;</p>
                  <p className="text-sm font-semibold text-slate-900">{r.name}</p>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      <Footer />
    </main>
  )
}
