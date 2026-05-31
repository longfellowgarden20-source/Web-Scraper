import {
  Scissors, Home, Building2, Flower2, Trees, Headphones,
  Wrench, Zap, Star, Shield, Clock, DollarSign,
} from 'lucide-react'
import { business } from '../../config/business'

// Map icon name strings from config to actual Lucide components
const ICON_MAP: Record<string, React.ElementType> = {
  Scissors, Home, Building2, Flower2, Trees, Headphones,
  Wrench, Zap, Star, Shield, Clock, DollarSign,
}

export function FeaturesSection() {
  return (
    <section id="features" className="w-full py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 bg-white border-t border-accent-border">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-4 sm:space-y-6 mb-12 sm:mb-16 lg:mb-20">
          <p className="text-sm uppercase tracking-[0.28em] text-accent font-semibold">What We Do</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-slate-950">
            {business.industryLabel} Services
          </h2>
          <p className="max-w-2xl mx-auto text-slate-600 text-base sm:text-lg">
            Professional {business.industry} solutions for every need.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
          {business.services.map((service, index) => {
            const Icon = ICON_MAP[service.icon] ?? Star
            return (
              <div
                key={index}
                className="group p-6 sm:p-8 rounded-xl border-2 border-slate-200 hover:border-accent hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.15)] transition-all duration-300 bg-white hover:bg-accent-light"
              >
                <div className="w-12 h-12 rounded-lg bg-accent-light text-accent flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-white transition-colors duration-300">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">{service.title}</h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{service.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
