import type { MetadataRoute } from 'next'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://unstoppable.events'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE}/`, changeFrequency: 'weekly', priority: 1 },
    ...['/terms', '/refunds', '/privacy'].map(p => ({ url: `${SITE}${p}`, changeFrequency: 'monthly' as const, priority: 0.3 })),
  ]
}
