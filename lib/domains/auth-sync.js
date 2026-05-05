import { createHmac, timingSafeEqual } from 'node:crypto'
import { encode as encodeJWT, decode as decodeJWT } from 'next-auth/jwt'

export const AUTH_SYNC_PROOF_HEADER = 'x-sn-auth-sync-proof'
export const AUTH_SYNC_LOGIN_FLOW_PROOF_PARAM = 'sync_proof'

// 10 minutes, plenty for login flow. JWT exp is in seconds.
const AUTH_SYNC_LOGIN_FLOW_TTL_S = 10 * 60
const AUTH_SYNC_LOGIN_FLOW_PURPOSE = 'auth-sync-login'

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

// short-lived JWT (JWE) that proves the request originated from our middleware
export async function createLoginFlowProof ({ domainName, secret }) {
  if (!secret) throw new Error('login flow proof: missing secret')
  if (!domainName) throw new Error('login flow proof: missing inputs')
  return await encodeJWT({
    token: {
      purpose: AUTH_SYNC_LOGIN_FLOW_PURPOSE,
      domain: domainName.toLowerCase()
    },
    secret,
    maxAge: AUTH_SYNC_LOGIN_FLOW_TTL_S
  })
}

export async function verifyLoginFlowProof ({ received, domainName, secret }) {
  if (!secret || !domainName || typeof received !== 'string') return false
  try {
    const decoded = await decodeJWT({ token: received, secret })
    if (!decoded) return false
    if (decoded.purpose !== AUTH_SYNC_LOGIN_FLOW_PURPOSE) return false
    if (decoded.domain !== domainName.toLowerCase()) return false
    // next-auth's decode does not enforce exp on its own; check it explicitly.
    if (typeof decoded.exp !== 'number' || decoded.exp * 1000 <= Date.now()) return false
    return true
  } catch {
    return false
  }
}
