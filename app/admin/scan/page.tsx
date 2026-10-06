import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { currentAdmin } from '../../../lib/admin-auth'
import { EVENT } from '../../config'
import { ADMIN_CSS } from '../styles'
import Scanner from './Scanner'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: `Door · ${EVENT.name}`, robots: { index: false, follow: false } }

// /admin/scan · the door. Point the phone at a guest's QR code: one seat in per scan.
export default async function ScanPage() {
  if (!(await currentAdmin())) redirect('/admin')
  return (
    <div className="ad">
      <style>{ADMIN_CSS}</style>
      <Scanner />
    </div>
  )
}
