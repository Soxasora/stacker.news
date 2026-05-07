import { createHash } from 'node:crypto'
import { secureCookie } from '@/lib/auth'
import { validateSchema, customDomainSchema } from '@/lib/validate'

export const DOMAINS_AUTH_VERIFIER_COOKIE = secureCookie('domains_auth_verifier')
// 10 minutes is plenty for a login flow and matches the verification token TTL ceiling.
export const DOMAINS_AUTH_VERIFIER_TTL_S = 10 * 60
// verifiers are 32 random bytes hex-encoded
export const DOMAINS_AUTH_VERIFIER_BYTES = 32

const VERIFIER_HEX_RE = /^[0-9a-f]+$/

export function isValidVerifier (verifier) {
  return typeof verifier === 'string' &&
    verifier.length === (DOMAINS_AUTH_VERIFIER_BYTES * 2) &&
    VERIFIER_HEX_RE.test(verifier)
}

export function hashVerifier (verifier) {
  return createHash('sha256').update(verifier).digest('hex')
}

export async function isValidDomain (domainName) {
  try {
    await validateSchema(customDomainSchema, { domainName })
    return true
  } catch (error) {
    console.error('[domains-auth] domain is not valid')
    return false
  }
}
