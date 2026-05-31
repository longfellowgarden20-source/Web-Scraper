import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { business } from '../../config/business'

const { cta } = business

export function CTASection() {
  return (
    <section className="w-full py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-accent">
      <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white leading-tight">
          {cta.headline}
        </h2>
        <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto">
          {cta.subheadline}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-2">
          <Link
            href="/contact"
            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white text-accent rounded-lg font-medium hover:bg-slate-50 transition-colors duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {cta.ctaPrimary}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/services"
            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 border-2 border-white text-white rounded-lg font-medium hover:bg-white/10 transition-colors duration-200 text-sm sm:text-base"
          >
            {cta.ctaSecondary}
          </Link>
        </div>
      </div>
    </section>
  )
}
