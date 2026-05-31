import type { Metadata } from 'next'
import Link from 'next/link'
import { Navigation } from '../components/Navigation'
import { CTASection } from '../components/CTASection'
import { Footer } from '../components/Footer'
import { projects } from './projects'
import { business } from '../../config/business'

const { ourWork, name, domain, serviceArea, testimonials } = business

export const metadata: Metadata = {
  title: `Our Work | ${business.industryLabel} Projects in ${serviceArea.city} & Surrounding Areas`,
  description: `Browse real ${business.industry} projects completed by ${name} — transformations for homeowners and businesses across ${serviceArea.city}, ${serviceArea.state}.`,
  alternates: { canonical: `${domain}/our-work` },
  openGraph: {
    title: `${business.industryLabel} Projects in ${serviceArea.city}, ${serviceArea.state} | ${name} Portfolio`,
    description: `See real before-and-after ${business.industry} projects from ${name} across ${serviceArea.city} and surrounding areas.`,
    url: `${domain}/our-work`,
  },
}

export default function OurWorkPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.28em] text-accent font-semibold mb-4">{ourWork.tagline}</p>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-slate-950 mb-6 leading-tight">
            {ourWork.headline}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            {ourWork.intro}
          </p>
        </div>
      </section>

      {/* Category filter */}
      <section className="border-t border-accent-border bg-accent-light py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2">
            {ourWork.categories.map((cat, i) => (
              <span
                key={cat}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  i === 0
                    ? 'bg-accent text-white border-accent'
                    : 'bg-white text-slate-600 border-accent-border hover:border-accent hover:text-accent'
                }`}
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Project grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.slug}
              href={`/our-work/${project.slug}`}
              className="group rounded-2xl overflow-hidden border-2 border-accent-border bg-white hover:border-accent hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.2)] transition-all duration-300"
            >
              <div className="overflow-hidden aspect-[4/3]">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-accent font-semibold mb-2">{project.category}</p>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 group-hover:text-accent transition-colors">
                  {project.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">{project.description}</p>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-accent-light border border-accent-border text-xs text-slate-700 font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-accent font-semibold mt-4 group-hover:underline">View project &rarr;</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-accent-border bg-accent-light py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm uppercase tracking-[0.28em] text-accent font-semibold mb-4">What Clients Say</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-950">
              {ourWork.testimonialHeadline}
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl bg-white border-2 border-accent-border p-8 shadow-sm">
                <p className="text-slate-700 leading-relaxed mb-6 text-sm sm:text-base">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTASection />
      <Footer />
    </main>
  )
}
