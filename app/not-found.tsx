import Link from 'next/link'
import { EVENT } from './config'

export default function NotFound() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 24, background: '#0a0806', color: '#f4efe7', fontFamily: 'var(--vv-body),system-ui,sans-serif', textAlign: 'center' }}>
      <p style={{ margin: 0, color: '#E3AE45', letterSpacing: 4, textTransform: 'uppercase', fontSize: 13 }}>Page not found</p>
      <h1 style={{ margin: 0, fontFamily: 'var(--vv-display),Impact,sans-serif', fontWeight: 400, textTransform: 'uppercase', fontSize: 'clamp(36px,8vw,64px)', lineHeight: 1 }}>This page does not exist</h1>
      <Link href="/" style={{ color: '#0a0806', background: 'linear-gradient(180deg,#F7D27A,#E3AE45)', padding: '14px 26px', borderRadius: 2, textDecoration: 'none', fontWeight: 700 }}>Go to {EVENT.name}</Link>
    </main>
  )
}
