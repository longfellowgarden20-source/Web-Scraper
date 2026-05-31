import Link from 'next/link'
import { Check } from 'lucide-react'
import { business } from '../../config/business'

const { pricing } = business

export function PricingSection() {
  return (
    <section id="pricing" className="w-full py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 bg-accent-light border-t border-accent-border">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-4 sm:space-y-6 mb-12 sm:mb-16 lg:mb-20">
          <p className="text-sm uppercase tracking-[0.28em] text-accent font-semibold">{pricing.tagline}</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-slate-950">
            {pricing.headline}
          </h2>
          <p className="max-w-2xl mx-auto text-slate-600 text-base sm:text-lg">
            {pricing.intro}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {pricing.plans.map((plan, index) => (
            <div
              key={index}
              className={`rounded-2xl transition-all duration-300 ${
                plan.featured
                  ? 'border-2 border-accent bg-accent shadow-[0_8px_40px_-8px_rgba(0,0,0,0.3)] scale-100 md:scale-105'
                  : 'border-2 border-accent-border bg-white hover:border-accent hover:shadow-md'
              }`}
            >
              {plan.featured && (
                <div className="px-4 sm:px-6 py-2 bg-accent-dark text-white text-xs sm:text-sm font-semibold text-center rounded-t-2xl">
                  Most Popular
                </div>
              )}

              <div className="p-6 sm:p-8 flex flex-col h-full">
                <div className="mb-6">
                  <h3 className={`text-xl sm:text-2xl font-bold mb-2 ${plan.featured ? 'text-white' : 'text-slate-900'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm sm:text-base ${plan.featured ? 'text-white/80' : 'text-slate-600'}`}>
                    {plan.description}
                  </p>
                </div>

                <div className="mb-6">
                  <div className={`text-4xl sm:text-5xl font-bold ${plan.featured ? 'text-white' : 'text-slate-900'}`}>
                    {plan.price}
                  </div>
                </div>

                <Link
                  href="/contact"
                  className={`w-full py-3 sm:py-3.5 rounded-lg font-medium mb-8 transition-colors duration-200 transform hover:scale-105 active:scale-95 text-sm sm:text-base text-center block ${
                    plan.featured
                      ? 'bg-white text-accent hover:bg-slate-50'
                      : 'bg-accent text-white hover:bg-accent-dark'
                  }`}
                >
                  {plan.cta}
                </Link>

                <div className="space-y-3 sm:space-y-4 flex-1">
                  {plan.features.map((feature, fIndex) => (
                    <div key={fIndex} className="flex items-start gap-3 sm:gap-4">
                      <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.featured ? 'text-white/70' : 'text-accent'}`} />
                      <span className={`text-sm sm:text-base ${plan.featured ? 'text-white/90' : 'text-slate-600'}`}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12 sm:mt-16">
          <p className="text-slate-600 text-sm sm:text-base">
            {pricing.outro}
          </p>
        </div>
      </div>
    </section>
  )
}
