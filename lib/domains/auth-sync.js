import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { secureCookie } from '@/lib/auth'

export const AUTH_SYNC_PROOF_HEADER = 'x-sn-auth-sync-proof'
export const AUTH_SYNC_NONCE_COOKIE = secureCookie('sync_nonce')
export const AUTH_SYNC_NONCE_PARAM = 'sync_nonce'
// 10 minutes is plenty for a login flow and matches the verification token TTL ceiling.
export const AUTH_SYNC_NONCE_TTL_S = 10 * 60
// nonces are 32 random bytes hex-encoded
export const AUTH_SYNC_NONCE_HEX_LENGTH = 64

const NONCE_HEX_RE = /^[0-9a-f]+$/

const sign = (secret, message) =>
  createHmac('sha256', secret).update(message).digest('hex')

// length-checked timing-safe string comparison; safely returns false for non-strings.
export const safeEqual = (received, expected) => {
  if (typeof received !== 'string' || typeof expected !== 'string') return false
  if (received.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(received), Buffer.from(expected))
}

export function hashSyncNonce (nonce) {
  return createHash('sha256').update(nonce).digest('hex')
}

export function isValidSyncNonce (nonce) {
  return typeof nonce === 'string' &&
    nonce.length === AUTH_SYNC_NONCE_HEX_LENGTH &&
    NONCE_HEX_RE.test(nonce)
}

// HMAC (verificationToken, domainName, nonceHash) keyed by NEXTAUTH_SECRET.
// Binding the nonce hash here means a leaked verificationToken cannot be exchanged without the matching nonce cookie.
export function createAuthSyncProof ({ verificationToken, domainName, nonceHash, secret }) {
  if (!secret) throw new Error('auth sync proof: missing secret')
  if (!verificationToken || !domainName || !nonceHash) throw new Error('auth sync proof: missing inputs')
  return sign(secret, `${verificationToken}:${domainName.toLowerCase()}:${nonceHash}`)
}

export function verifyAuthSyncProof ({ received, verificationToken, domainName, nonceHash, secret }) {
  if (!secret || !verificationToken || !domainName || !nonceHash) return false
  return safeEqual(received, sign(secret, `${verificationToken}:${domainName.toLowerCase()}:${nonceHash}`))
}
