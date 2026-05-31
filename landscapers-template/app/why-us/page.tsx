import type { Metadata } from 'next'
import { Navigation } from '../components/Navigation'
import { WhyUsSection } from '../components/WhyUsSection'
import { CTASection } from '../components/CTASection'
import { Footer } from '../components/Footer'
import { business } from '../../config/business'

const { name, domain, serviceArea, industryLabel } = business

export const metadata: Metadata = {
  title: `Why Choose ${name} | Trusted ${industryLabel} in ${serviceArea.city}, ${serviceArea.state}`,
  description: `Find out why ${serviceArea.city} homeowners and businesses choose ${name} — certified professionals, transparent pricing, quality workmanship, and reliable scheduling.`,
  alternates: { canonical: `${domain}/why-us` },
  openGraph: {
    title: `Why Choose ${name} | ${serviceArea.city}, ${serviceArea.state}`,
    description: `Certified, reliable, and transparent. See why ${serviceArea.city} trusts ${name}.`,
    url: `${domain}/why-us`,
  },
}

export default function WhyUsPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <WhyUsSection />
      <CTASection />
      <Footer />
    </main>
  )
}
