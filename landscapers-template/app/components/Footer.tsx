import Link from 'next/link'
import { Twitter, Linkedin, Mail } from 'lucide-react'
import { business } from '../../config/business'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full bg-accent-footer text-accent-footer-text border-t border-accent-footer-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-12 sm:mb-16">
          {/* Brand */}
          <div className="col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-bold text-sm">
                {business.logoEmoji || '◆'}
              </div>
              <span className="font-display text-white font-bold">{business.shortName}</span>
            </div>
            <p className="text-xs sm:text-sm text-accent-footer-text">
              Certified {business.proNoun} delivering beautiful, reliable service for homes and businesses.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-3 sm:mb-4">Quick Links</h4>
            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
              <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><Link href="/services" className="hover:text-white transition-colors">Services</Link></li>
              <li><Link href="/why-us" className="hover:text-white transition-colors">Why Us</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-3 sm:mb-4">Company</h4>
            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
              <li><Link href="/our-work" className="hover:text-white transition-colors">Our Work</Link></li>
              <li><Link href="/reviews" className="hover:text-white transition-colors">Reviews</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-3 sm:mb-4">Contact</h4>
            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
              <li>
                <a href={business.phoneHref} className="hover:text-white transition-colors">
                  {business.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${business.email}`} className="hover:text-white transition-colors">
                  {business.email}
                </a>
              </li>
              <li>
                <span className="text-accent-footer-text">
                  {business.serviceArea.city}, {business.serviceArea.state}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-accent-footer-border pt-8 sm:pt-12">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 sm:gap-8">
            <p className="text-xs sm:text-sm text-accent-footer-text text-center sm:text-left">
              © {currentYear} {business.name}. All rights reserved.
            </p>

            <div className="flex items-center gap-4 sm:gap-6">
              <a href="#" className="text-accent-footer-text hover:text-white transition-colors p-2" aria-label="Twitter">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="text-accent-footer-text hover:text-white transition-colors p-2" aria-label="LinkedIn">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href={`mailto:${business.email}`} className="text-accent-footer-text hover:text-white transition-colors p-2" aria-label="Email">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
