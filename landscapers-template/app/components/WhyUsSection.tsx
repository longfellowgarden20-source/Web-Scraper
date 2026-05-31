import { business } from '../../config/business'

const { whyUs } = business

export function WhyUsSection() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-white">
      <div className="text-center mx-auto max-w-3xl">
        <p className="text-sm uppercase tracking-[0.3em] text-accent font-semibold mb-4">{whyUs.tagline}</p>
        <h1 className="text-4xl sm:text-5xl font-display font-bold text-slate-950 mb-6">
          {whyUs.headline}
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          {whyUs.intro}
        </p>
      </div>

      <div className="mt-16 grid gap-6 lg:grid-cols-2">
        {whyUs.points.map((item) => (
          <div
            key={item.title}
            className="rounded-3xl border-2 border-accent-border p-8 shadow-sm bg-white hover:border-accent hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.15)] transition-all duration-300"
          >
            <h2 className="text-2xl font-semibold text-slate-950 mb-3">{item.title}</h2>
            <p className="text-slate-600 leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto">
          {whyUs.outro}
        </p>
      </div>
    </section>
  )
}
