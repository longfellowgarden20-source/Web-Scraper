import { MetadataRoute } from 'next'
import { projects } from './our-work/projects'
import { business } from '../config/business'

const BASE_URL = business.domain

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { url: BASE_URL, priority: 1.0, changeFrequency: 'weekly' as const },
    { url: `${BASE_URL}/about`, priority: 0.8, changeFrequency: 'monthly' as const },
    { url: `${BASE_URL}/services`, priority: 0.9, changeFrequency: 'monthly' as const },
    { url: `${BASE_URL}/why-us`, priority: 0.7, changeFrequency: 'monthly' as const },
    { url: `${BASE_URL}/our-work`, priority: 0.8, changeFrequency: 'weekly' as const },
    { url: `${BASE_URL}/pricing`, priority: 0.8, changeFrequency: 'monthly' as const },
    { url: `${BASE_URL}/reviews`, priority: 0.7, changeFrequency: 'weekly' as const },
    { url: `${BASE_URL}/faq`, priority: 0.8, changeFrequency: 'monthly' as const },
    { url: `${BASE_URL}/contact`, priority: 0.9, changeFrequency: 'monthly' as const },
    { url: `${BASE_URL}/book`, priority: 1.0, changeFrequency: 'monthly' as const },
  ]

  const projectPages = projects.map((p) => ({
    url: `${BASE_URL}/our-work/${p.slug}`,
    priority: 0.6,
    changeFrequency: 'monthly' as const,
  }))

  return [...staticPages, ...projectPages].map((page) => ({
    ...page,
    lastModified: new Date(),
  }))
}
