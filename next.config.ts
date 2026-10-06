import type { NextConfig } from 'next'

// Security headers on every page. Kept deliberately small so nothing the site
// needs (Stripe's embedded checkout, the door camera) is blocked:
//   frame-ancestors 'none' / X-Frame-Options   no other site can frame these pages
//   nosniff                                    files are read as what they say they are
//   Referrer-Policy                            a ticket link never leaks to another site
//   Permissions-Policy                         camera only for this site (the door scanner)
// A full Content-Security-Policy is not set: Stripe needs a long allowlist and
// a wrong one silently breaks checkout. Add it only with a test purchase.
const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(), payment=(self "https://js.stripe.com")' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: '/:path*', headers: SECURITY_HEADERS },
      // A ticket page and the admin never send the address on, not even the origin.
      { source: '/t/:path*', headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }] },
      { source: '/admin/:path*', headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }] },
    ]
  },
  async redirects() {
    // The first address this event had, in case anyone shares it here.
    return [{ source: '/vision-voice', destination: '/', permanent: true }]
  },
}

export default nextConfig
