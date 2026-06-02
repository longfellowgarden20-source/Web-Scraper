import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { business } from '../../config/business'

const { hero } = business

export function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden min-h-[620px] sm:min-h-[700px] lg:min-h-[780px] flex items-center">
      <Image
        priority
        src={hero.bgImage}
        alt={hero.bgImageAlt}
        fill
        sizes="100vw"
        quality={85}
        className="object-cover object-center"
      />

      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/50" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
        <div className="max-w-2xl space-y-6 sm:space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm border border-white/20 text-white rounded-full text-xs sm:text-sm font-medium">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            {hero.badgeText}
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
            {hero.headline}
            <br className="hidden sm:block" />
            <span className="text-green-300">{hero.headlineAccent}</span>
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg text-white/90 leading-relaxed max-w-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
            {hero.subheadline}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
            <Link
              href="/contact"
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-accent text-white rounded-lg font-semibold hover:bg-accent-dark transition-colors duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-sm sm:text-base shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
            >
              {hero.ctaPrimary}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/services"
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white/15 backdrop-blur-sm border border-white/40 text-white rounded-lg font-medium hover:bg-white/25 transition-colors duration-200 text-sm sm:text-base text-center"
            >
              {hero.ctaSecondary}
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 pt-2 text-xs sm:text-sm text-white/80">
            <span>{hero.socialProof}</span>
            <div className="hidden sm:block w-px h-4 bg-white/30"></div>
            <span>{hero.socialProof2}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
