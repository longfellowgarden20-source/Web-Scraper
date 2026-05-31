import type { Metadata } from 'next'
import { Navigation } from '../components/Navigation'
import { FeaturesSection } from '../components/FeaturesSection'
import { CTASection } from '../components/CTASection'
import { Footer } from '../components/Footer'
import { business } from '../../config/business'

const { name, domain, serviceArea, industryLabel, industry } = business

export const metadata: Metadata = {
  title: `${industryLabel} Services | ${serviceArea.city}, ${serviceArea.state}`,
  description: `${name} offers full-service ${industry} in ${serviceArea.city}, ${serviceArea.state}. ${business.services.map(s => s.title).join(', ')}.`,
  alternates: { canonical: `${domain}/services` },
  openGraph: {
    title: `${industryLabel} Services in ${serviceArea.city}, ${serviceArea.state} | ${name}`,
    description: `${industry} services in ${serviceArea.city}, ${serviceArea.state}.`,
    url: `${domain}/services`,
  },
}

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <FeaturesSection />
      <CTASection />
      <Footer />
    </main>
  )
}
