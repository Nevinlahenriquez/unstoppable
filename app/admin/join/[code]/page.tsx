import type { Metadata } from 'next'
import { openInvite, readInviteCode } from '../../../../lib/admin-auth'
import { EVENT } from '../../../config'
import JoinForm from './JoinForm'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: `Admin invite · ${EVENT.name}`, robots: { index: false, follow: false } }

// The page an invite link opens. No sign-in needed: the signed code is the key,
// and it only works once.
export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const code = (await params).code
  const id = readInviteCode(code)
  const inv = id ? await openInvite(id).catch(() => null) : null
  return <JoinForm code={code} valid={!!inv} name={EVENT.name} />
}
