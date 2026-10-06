import type { MetadataRoute } from 'next'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://unstoppable.events'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/checkout', '/thank-you', '/admin', '/api'] }],
    sitemap: `${SITE}/sitemap.xml`,
  }
}
