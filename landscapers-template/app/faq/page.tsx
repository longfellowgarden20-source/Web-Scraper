'use client'

import { useState } from 'react'
import { Navigation } from '../components/Navigation'
import { Footer } from '../components/Footer'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { business } from '../../config/business'

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`border-2 rounded-2xl transition-all duration-200 ${open ? 'border-accent bg-accent-light' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
        aria-expanded={open}
      >
        <span className="text-base font-semibold text-slate-900 leading-snug">{question}</span>
        <ChevronDown className={`w-5 h-5 text-accent flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-6 pb-6">
          <p className="text-slate-600 leading-relaxed text-sm sm:text-base">{answer}</p>
        </div>
      )}
    </div>
  )
}

export default function FaqPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: business.faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }

  return (
    <main className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Navigation />

      {/* Hero */}
      <section className="bg-accent py-14 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-white/70 text-sm uppercase tracking-widest font-semibold mb-3">FAQ</p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-white/80 text-base sm:text-lg">
            Everything you need to know about working with {business.name}.
          </p>
        </div>
      </section>

      {/* FAQ list */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="space-y-3">
          {business.faqs.map((faq) => (
            <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </div>

        <div className="mt-14 rounded-3xl bg-accent-light border-2 border-accent-border p-8 sm:p-10 text-center">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-3">Still have questions?</h2>
          <p className="text-slate-600 mb-6 text-sm sm:text-base">
            We are happy to help. Call us or book a free consultation and we will walk you through everything.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/book"
              className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-accent text-white font-semibold text-sm hover:bg-accent-dark transition-colors"
            >
              Book a Free Consultation
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-3 rounded-full border-2 border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
