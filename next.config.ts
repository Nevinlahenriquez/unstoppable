import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async redirects() {
    // The first address this event had, in case anyone shares it here.
    return [{ source: '/vision-voice', destination: '/', permanent: true }]
  },
}

export default nextConfig
