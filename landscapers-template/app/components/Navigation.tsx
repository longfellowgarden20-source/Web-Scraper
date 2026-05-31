'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { business } from '../../config/business'

const links = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/services', label: 'Services' },
  { href: '/why-us', label: 'Why Us' },
  { href: '/our-work', label: 'Our Work' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/reviews', label: 'Reviews' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
]

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const closeNav = () => setIsOpen(false)

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <Link href="/" onClick={closeNav} className="flex-shrink-0 flex items-center gap-2">
              {business.logoImagePath ? (
                <Image src={business.logoImagePath} alt={business.name} width={36} height={36} className="rounded-lg" />
              ) : (
                <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center text-white font-bold text-base">
                  {business.logoEmoji}
                </div>
              )}
              <span className="font-display text-lg font-bold text-slate-900">
                {business.shortName}
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-5 xl:gap-7">
              {links.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-sm text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap"
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center">
              <Link
                href="/book"
                className="px-4 py-2.5 text-sm bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors font-medium whitespace-nowrap"
              >
                Book Appointment
              </Link>
            </div>

            {/* Hamburger */}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
              aria-expanded={isOpen}
            >
              {isOpen
                ? <X className="w-6 h-6 text-slate-900" />
                : <Menu className="w-6 h-6 text-slate-900" />
              }
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-white flex flex-col"
          style={{ top: '64px' }}
        >
          <div className="flex-1 overflow-y-auto px-4 py-4" style={{ scrollbarColor: '#cbd5e1 #f1f5f9', scrollbarWidth: 'thin' }}>
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={closeNav}
                className="flex items-center px-4 py-4 text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors border-b border-slate-100 last:border-0"
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="flex-shrink-0 px-4 py-3 border-t border-slate-200 bg-white flex flex-col gap-2">
            <Link
              href="/contact"
              onClick={closeNav}
              className="w-full py-3 text-sm text-center font-semibold text-slate-700 border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Request a Quote
            </Link>
            <Link
              href="/book"
              onClick={closeNav}
              className="w-full py-3 text-sm text-center font-semibold text-white bg-accent rounded-xl hover:bg-accent-dark transition-colors"
            >
              Book Appointment
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
