import { createHmac, timingSafeEqual } from 'node:crypto'

export const AUTH_SYNC_PROOF_HEADER = 'x-sn-auth-sync-proof'
export const AUTH_SYNC_LOGIN_FLOW_PROOF_PARAM = 'sync_proof'
export const AUTH_SYNC_LOGIN_FLOW_EXP_PARAM = 'sync_exp'
export const AUTH_SYNC_LOGIN_FLOW_TTL_MS = 10 * 60 * 1000 // 10 minutes, plenty for login flow

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

export function createLoginFlowProof ({ domainName, expiration, secret }) {
  if (!secret) throw new Error('custom domain login flow proof: missing secret')
  if (!domainName || !expiration) throw new Error('custom domain login flow proof: missing inputs')
  const message = `${domainName.toLowerCase()}:${expiration}`
  return createHmac('sha256', secret).update(message).digest('hex')
}

export function verifyLoginFlowProof ({ received, domainName, expiration, secret }) {
  if (typeof received !== 'string' || typeof domainName !== 'string' || typeof expiration !== 'string') return false
  const expMs = Number(expiration)
  if (expMs < Date.now()) return false
  const expected = createLoginFlowProof({ domainName, expiration, secret })
  if (received.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(received), Buffer.from(expected))
}
