import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Navigation } from '../../components/Navigation'
import { CTASection } from '../../components/CTASection'
import { Footer } from '../../components/Footer'
import { ArrowLeft, Tag } from 'lucide-react'
import { projects } from '../projects'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const project = projects.find((p) => p.slug === slug)
  if (!project) return {}
  return {
    title: `${project.title} | Diaz Gardening Services Portfolio`,
    description: project.description + ' Serving Long Beach, CA and surrounding areas.',
    alternates: { canonical: `https://diazgardening.com/our-work/${slug}` },
    openGraph: {
      title: project.title,
      description: project.description,
      url: `https://diazgardening.com/our-work/${slug}`,
    },
  }
}

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }))
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = projects.find((p) => p.slug === slug)
  if (!project) notFound()

  return (
    <main className="min-h-screen bg-white">
      <Navigation />

      {/* Back link */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <Link
          href="/our-work"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-accent transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Our Work
        </Link>
      </div>

      {/* Hero image */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="rounded-3xl overflow-hidden aspect-[16/9]">
          <img
            src={project.image}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-12">

          {/* Main content */}
          <div className="lg:col-span-2">
            <p className="text-xs uppercase tracking-[0.2em] text-accent font-semibold mb-3">
              {project.category}
            </p>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-slate-950 mb-6 leading-tight">
              {project.title}
            </h1>
            <div className="prose prose-slate max-w-none">
              {project.body.split('\n\n').map((para, i) => (
                <p key={i} className="text-slate-600 leading-relaxed mb-5 text-base sm:text-lg">
                  {para}
                </p>
              ))}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-8">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-xs text-slate-700 font-medium"
                >
                  <Tag className="w-3 h-3 text-accent" />
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border-2 border-green-100 bg-green-50 p-6 sticky top-24">
              <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wide">Project Details</h3>
              <dl className="space-y-4">
                {project.details.map((d) => (
                  <div key={d.label}>
                    <dt className="text-xs text-slate-500 font-medium uppercase tracking-wide">{d.label}</dt>
                    <dd className="text-sm font-semibold text-slate-900 mt-0.5">{d.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6 pt-6 border-t border-green-200">
                <Link
                  href="/book"
                  className="block w-full text-center py-3 rounded-2xl bg-accent text-white font-semibold text-sm hover:bg-accent-dark transition"
                >
                  Book a Consultation
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      <CTASection />
      <Footer />
    </main>
  )
}
