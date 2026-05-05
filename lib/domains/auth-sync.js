import { createHmac, timingSafeEqual } from 'node:crypto'

export const AUTH_SYNC_PROOF_HEADER = 'x-sn-auth-sync-proof'
export const AUTH_SYNC_LOGIN_FLOW_PROOF_PARAM = 'sync_proof'
export const AUTH_SYNC_LOGIN_FLOW_EXP_PARAM = 'sync_exp'
export const AUTH_SYNC_LOGIN_FLOW_TTL_MS = 10 * 60 * 1000 // 10 minutes, plenty for login flow

// HMAC-SHA256 of `message` keyed by `secret`, hex-encoded.
const sign = (secret, message) =>
  createHmac('sha256', secret).update(message).digest('hex')

// length-checked timing-safe string comparison; safely returns false for non-strings.
const safeEqual = (received, expected) => {
  if (typeof received !== 'string' || typeof expected !== 'string') return false
  if (received.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(received), Buffer.from(expected))
}

export function createAuthSyncProof ({ verificationToken, domainName, secret }) {
  if (!secret) throw new Error('auth sync proof: missing secret')
  if (!verificationToken || !domainName) throw new Error('auth sync proof: missing inputs')
  return sign(secret, `${verificationToken}:${domainName.toLowerCase()}`)
}

export function verifyAuthSyncProof ({ received, verificationToken, domainName, secret }) {
  if (!secret || !verificationToken || !domainName) return false
  return safeEqual(received, sign(secret, `${verificationToken}:${domainName.toLowerCase()}`))
}

export function createLoginFlowProof ({ domainName, expiration, secret }) {
  if (!secret) throw new Error('login flow proof: missing secret')
  if (!domainName || !expiration) throw new Error('login flow proof: missing inputs')
  return sign(secret, `${domainName.toLowerCase()}:${expiration}`)
}

export function verifyLoginFlowProof ({ received, domainName, expiration, secret }) {
  if (!secret || !domainName || typeof expiration !== 'string') return false
  if (Number(expiration) < Date.now()) return false
  return safeEqual(received, sign(secret, `${domainName.toLowerCase()}:${expiration}`))
}
