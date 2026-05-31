import type { Metadata } from 'next'
import './globals.css'
import { business } from '../config/business'

export const metadata: Metadata = {
  metadataBase: new URL(business.domain),
  title: {
    default: `${business.name} | ${business.industryLabel} in ${business.serviceArea.city}, ${business.serviceArea.state}`,
    template: `%s | ${business.seo.titleSuffix}`,
  },
  description: business.seo.defaultDescription,
  keywords: business.seo.keywords,
  authors: [{ name: business.name }],
  creator: business.name,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: business.name,
    title: `${business.name} | ${business.industryLabel} in ${business.serviceArea.city}, ${business.serviceArea.state}`,
    description: business.seo.defaultDescription,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${business.name} | ${business.serviceArea.city}, ${business.serviceArea.state}`,
    description: business.seo.defaultDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${business.seo.faviconEmoji}</text></svg>`,
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    telephone: business.phone,
    email: business.email,
    ...(business.googlePlaceId && {
      sameAs: [`https://maps.google.com/?cid=${business.googlePlaceId}`],
    }),
  }

  const { colors } = business

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inject brand colors as CSS custom properties so Tailwind picks them up */}
        <style>{`
          :root {
            --color-accent: ${colors.accent};
            --color-accent-dark: ${colors.accentDark};
            --color-accent-light: ${colors.accentLight};
            --color-accent-border: ${colors.accentBorder};
            --color-accent-footer: ${colors.accentFooter};
            --color-accent-footer-border: ${colors.accentFooterBorder};
            --color-accent-footer-text: ${colors.accentFooterText};
            --color-accent-footer-heading: ${colors.accentFooterHeading};
          }
        `}</style>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
