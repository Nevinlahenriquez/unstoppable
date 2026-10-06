import Link from 'next/link'
import { EVENT, LEGAL, formatDate } from '../app/config'

// The shell for /terms, /refunds and /privacy: black and gold like the event
// page, but quiet, because a legal page has to read as a document.

export type Section = { h: string; p: (string | React.ReactNode)[] }

export function LegalPage({ title, intro, sections }: { title: string; intro: string; sections: Section[] }) {
  return (
    <main className="lg">
      <header className="lg-top">
        <Link href="/" className="lg-brand">{EVENT.name}<i>.</i></Link>
        <nav>
          <Link href="/terms">Terms</Link>
          <Link href="/refunds">Refunds</Link>
          <Link href="/privacy">Privacy</Link>
        </nav>
      </header>
      <article className="lg-doc">
        {LEGAL.draft && (
          <p className="lg-draft">Draft. This page is being reviewed and may still change before tickets go on sale.</p>
        )}
        <h1>{title}</h1>
        <p className="lg-meta">Last updated {formatDate(LEGAL.updated, { year: true })}</p>
        <p className="lg-intro">{intro}</p>
        {sections.map((s, i) => (
          <section key={s.h}>
            <h2><span>{i + 1}.</span> {s.h}</h2>
            {s.p.map((t, j) => <p key={j}>{t}</p>)}
          </section>
        ))}
        <p className="lg-contact">Questions? Email <a href={`mailto:${EVENT.contactEmail}`}>{EVENT.contactEmail}</a>.</p>
        <p><Link href="/" className="lg-back">Back to the event</Link></p>
      </article>
      <style>{CSS}</style>
    </main>
  )
}

const CSS = `
.lg{min-height:100vh;background:#0a0806;color:#e8e1d4;font-family:var(--vv-body),system-ui,sans-serif}
.lg a{color:#F7D27A}
.lg-top{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;padding:20px 24px;border-bottom:1px solid rgba(227,174,69,.18)}
.lg-brand{font-family:var(--vv-display),Impact,sans-serif;text-transform:uppercase;font-size:22px;letter-spacing:.02em;text-decoration:none;color:#f4efe7!important}
.lg-brand i{color:#E3AE45;font-style:normal}
.lg-top nav{display:flex;gap:18px;font-size:14px}
.lg-top nav a{color:rgba(244,239,231,.7);text-decoration:none}
.lg-top nav a:hover{color:#F7D27A}
.lg-doc{max-width:720px;margin:0 auto;padding:44px 24px 90px;font-size:16.5px;line-height:1.7}
.lg-doc h1{font-family:var(--vv-display),Impact,sans-serif;text-transform:uppercase;font-weight:400;font-size:clamp(36px,7vw,56px);line-height:1;margin:0 0 10px;color:#f4efe7}
.lg-meta{color:rgba(244,239,231,.55);font-size:14px;margin:0 0 26px}
.lg-intro{font-size:18px;color:#f4efe7}
.lg-doc h2{font-size:19px;margin:36px 0 8px;color:#f4efe7}
.lg-doc h2 span{color:#E3AE45;margin-right:4px}
.lg-doc p{margin:0 0 12px}
.lg-draft{border:1px dashed rgba(227,174,69,.6);background:rgba(227,174,69,.08);color:#F7D27A;padding:10px 14px;border-radius:4px;font-size:14px;margin-bottom:28px!important}
.lg-contact{margin-top:40px!important;padding-top:20px;border-top:1px solid rgba(227,174,69,.18)}
.lg-back{font-size:14px}
`
