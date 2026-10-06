import type { Metadata } from 'next'
import { isDoorStaff, doorConfigured } from '../../lib/door-auth'
import { EVENT } from '../config'
import { ADMIN_CSS } from '../admin/styles'
import Scanner from '../admin/scan/Scanner'
import DoorLogin from './DoorLogin'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: `Door · ${EVENT.name}`, robots: { index: false, follow: false } }

// /door · the scanner for the door team (Amavi staff, volunteers). One shared
// password, and it opens the scanner only. See lib/door-auth.ts.
export default async function DoorPage() {
  if (!(await isDoorStaff())) return <DoorLogin configured={doorConfigured()} />
  return (
    <div className="ad">
      <style>{ADMIN_CSS}</style>
      <Scanner api="/door/api/scan" home="/door" door />
    </div>
  )
}
