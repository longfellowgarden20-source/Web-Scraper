import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Fast Websites — Lead Scraper',
  description: 'Private lead generation dashboard for Fast Websites agency',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
