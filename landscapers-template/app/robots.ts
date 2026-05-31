import { MetadataRoute } from 'next'
import { business } from '../config/business'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/'],
      },
    ],
    sitemap: `${business.domain}/sitemap.xml`,
  }
}
