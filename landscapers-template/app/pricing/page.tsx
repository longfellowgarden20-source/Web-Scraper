import type { Metadata } from 'next'
import { Navigation } from '../components/Navigation'
import { PricingSection } from '../components/PricingSection'
import { CTASection } from '../components/CTASection'
import { Footer } from '../components/Footer'
import { business } from '../../config/business'

const { name, domain, serviceArea, industryLabel } = business

export const metadata: Metadata = {
  title: `${industryLabel} Pricing | ${serviceArea.city}, ${serviceArea.state}`,
  description: `Transparent ${industryLabel.toLowerCase()} pricing from ${name} in ${serviceArea.city}, ${serviceArea.state}. No surprise fees.`,
  alternates: { canonical: `${domain}/pricing` },
  openGraph: {
    title: `${industryLabel} Pricing in ${serviceArea.city}, ${serviceArea.state} | ${name}`,
    description: `Clear, upfront pricing for ${industryLabel.toLowerCase()} services in ${serviceArea.city}, ${serviceArea.state}.`,
    url: `${domain}/pricing`,
  },
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  )
}
