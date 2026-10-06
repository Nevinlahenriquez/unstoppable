import type { Metadata, Viewport } from 'next'
import { Anton, Inter } from 'next/font/google'
import { EVENT } from './config'

// I Am Unstoppable · unstoppable.events
// Anton: heavy, condensed, uppercase. Black and gold, built to feel like a stadium event.
const display = Anton({ subsets: ['latin'], weight: '400', variable: '--vv-display', display: 'swap' })
const body = Inter({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700', '800'], variable: '--vv-body', display: 'swap' })

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://unstoppable.events'

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: EVENT.name,
  // The landing page is the one page that should be found. /tickets and
  // /thank-you carry their own noindex. Vercel preview links are kept out of
  // search by Vercel itself.
  robots: { index: true, follow: true },
}

export const viewport: Viewport = { themeColor: '#000000' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body style={{ margin: 0, background: '#000' }}>{children}</body>
    </html>
  )
}
