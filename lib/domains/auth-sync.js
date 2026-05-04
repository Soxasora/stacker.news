import { createHmac, timingSafeEqual } from 'node:crypto'

export const AUTH_SYNC_PROOF_HEADER = 'x-sn-auth-sync-proof'

export function createAuthSyncProof ({ verificationToken, domainName, secret }) {
  if (!secret) throw new Error('auth sync proof: missing secret')
  if (!verificationToken || !domainName) throw new Error('auth sync proof: missing inputs')
  const message = `${verificationToken}:${domainName.toLowerCase()}`
  return createHmac('sha256', secret).update(message).digest('hex')
}

export function verifyAuthSyncProof ({ received, verificationToken, domainName, secret }) {
  if (typeof received !== 'string') return false
  const expected = createAuthSyncProof({ verificationToken, domainName, secret })
  if (received.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(received), Buffer.from(expected))
}
