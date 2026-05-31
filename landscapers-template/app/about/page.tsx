import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Navigation } from '../components/Navigation'
import { Footer } from '../components/Footer'
import { business } from '../../config/business'

const { about, owner, name, domain } = business

export const metadata: Metadata = {
  title: `About Us | ${owner.name} & ${name}`,
  description: `Meet ${owner.name}, founder of ${name} with ${owner.yearsExperience} years of experience in ${business.industry}. Quality craftsmanship you can trust.`,
  alternates: { canonical: `${domain}/about` },
  openGraph: {
    title: `About ${name} | ${owner.name}, Founder`,
    description: `Meet ${owner.name} — ${owner.yearsExperience} years of ${business.industry} experience serving ${business.serviceArea.city} and surrounding areas.`,
    url: `${domain}/about`,
  },
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.28em] text-accent font-semibold mb-4">{about.tagline}</p>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-slate-950 mb-6 leading-tight">
            {about.headline}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            {about.intro}
          </p>
        </div>
      </section>

      {/* Owner section */}
      <section className="border-t border-accent-border bg-accent-light py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Photo */}
            <div className="relative">
              <div className="rounded-3xl overflow-hidden aspect-[4/5] max-w-sm mx-auto lg:mx-0 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] relative">
                <Image
                  src={owner.photo}
                  alt={owner.photoAlt}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 1024px) 90vw, 400px"
                  priority
                />
              </div>
              <div className="absolute -bottom-4 -right-4 sm:right-auto sm:-left-4 lg:-left-6 bg-accent text-white rounded-2xl px-5 py-4 shadow-lg max-w-[160px]">
                <p className="text-2xl font-bold leading-none">{owner.yearsExperience}</p>
                <p className="text-xs font-medium text-white/80 mt-1 leading-snug">Years of experience</p>
              </div>
            </div>

            {/* Content */}
            <div className="pt-6 lg:pt-0">
              <p className="text-xs uppercase tracking-[0.2em] text-accent font-semibold mb-3">Meet the Owner</p>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-950 mb-1 leading-tight">
                {owner.name}
              </h2>
              <p className="text-base text-accent font-medium mb-6">{owner.title}, {name}</p>

              <div className="space-y-4 text-slate-600 leading-relaxed">
                {owner.bio.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/book"
                  className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-accent text-white text-sm font-semibold hover:bg-accent-dark transition-colors"
                >
                  Book a Consultation
                </Link>
                <Link
                  href="/our-work"
                  className="inline-flex items-center justify-center px-8 py-3 rounded-full border border-slate-300 text-slate-900 text-sm font-semibold hover:bg-white transition-colors"
                >
                  See Our Work
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-12">
          <p className="text-sm uppercase tracking-[0.28em] text-accent font-semibold mb-4">What We Stand For</p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-950">
            The values behind every job
          </h2>
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
          {about.values.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border-2 border-accent-border p-8 bg-white hover:border-accent hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] transition-all duration-300"
            >
              <h3 className="text-xl font-semibold text-slate-950 mb-3">{item.title}</h3>
              <p className="text-slate-600 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  )
}
