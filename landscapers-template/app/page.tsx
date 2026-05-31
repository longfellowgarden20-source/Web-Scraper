import type { Metadata } from 'next'
import Link from 'next/link'
import { Navigation } from './components/Navigation'
import { HeroSection } from './components/HeroSection'
import { ServiceAreaSection } from './components/ServiceAreaSection'
import { Footer } from './components/Footer'
import { ChevronDown } from 'lucide-react'
import { business } from '../config/business'

export const metadata: Metadata = {
  title: `${business.name} | ${business.industryLabel} in ${business.serviceArea.city}, ${business.serviceArea.state}`,
  description: business.seo.defaultDescription,
  alternates: { canonical: business.domain },
  openGraph: {
    title: `${business.name} | ${business.industryLabel} in ${business.serviceArea.city}, ${business.serviceArea.state}`,
    description: business.seo.defaultDescription,
    url: business.domain,
  },
}

export default function Home() {
  const { homeSection, homeNavCards, faqs } = business

  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <HeroSection />

      {/* Nav cards section */}
      <section className="py-20 bg-accent-light border-t border-accent-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <p className="text-sm uppercase tracking-[0.3em] text-accent font-semibold mb-4">{homeSection.tagline}</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-950">
              {homeSection.headline}
            </h2>
            <p className="mt-4 text-slate-600 text-base sm:text-lg leading-relaxed">
              {homeSection.intro}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {homeNavCards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="group block rounded-3xl border-2 border-accent-border bg-white p-8 hover:border-accent hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.15)] transition"
              >
                <h3 className="text-xl font-semibold text-slate-900 mb-3 group-hover:text-accent transition-colors">{card.title}</h3>
                <p className="text-slate-500">{card.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ServiceAreaSection />

      {/* FAQ preview */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-10">
          <p className="text-sm uppercase tracking-[0.28em] text-accent font-semibold mb-4">FAQ</p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-950">
            Common questions
          </h2>
        </div>
        <div className="space-y-3 mb-8">
          {faqs.slice(0, 2).map((faq) => (
            <details key={faq.question} className="group border-2 border-slate-100 rounded-2xl bg-white open:border-accent open:bg-accent-light transition-all">
              <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none font-semibold text-slate-900 text-base">
                {faq.question}
                <ChevronDown className="w-5 h-5 text-accent flex-shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <p className="px-6 pb-6 text-slate-600 leading-relaxed text-sm sm:text-base">{faq.answer}</p>
            </details>
          ))}
        </div>
        <div className="text-center">
          <Link href="/faq" className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline">
            See all frequently asked questions →
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
