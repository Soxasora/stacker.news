import { SN_MAIN_DOMAIN, getDomainMapping } from '@/lib/domains'
import { formatHost, parseSafeHost, safeRedirectPath } from '@/lib/safe-url'
import { AUTH_SYNC_NONCE_COOKIE, AUTH_SYNC_NONCE_PARAM, isValidSyncNonce } from '@/lib/domains/auth-sync'

// Next.js cannot redirect to an absolute localhost URL, it gets converted to a relative URL.
// https://github.com/vercel/next.js/issues/44482
// so we use this API route to handle custom domain redirects, keeping support for local dev env.
export default async function handler (req, res) {
  const { domain, callbackUrl, signup } = req.query
  const parsedDomain = parseSafeHost(domain)
  // restrict to ACTIVE custom domains so this endpoint cannot be used as an open redirect.
  const mapping = parsedDomain && await getDomainMapping(parsedDomain.hostname)
  if (!parsedDomain || !mapping) {
    return res.status(400).json({ status: 'ERROR', reason: 'domain not allowed' })
  }
  const canonicalDomain = formatHost(parsedDomain)
  const redirectUri = safeRedirectPath(callbackUrl, canonicalDomain)

  // the per-browser nonce is set as a cookie on the custom domain by middleware's redirectToAuth.
  // if it's missing, we bounce back to the custom domain to mint a fresh one.
  const nonce = req.cookies[AUTH_SYNC_NONCE_COOKIE]
  if (!isValidSyncNonce(nonce)) {
    const retry = new URL(signup ? '/signup' : '/login', `${SN_MAIN_DOMAIN.protocol}//${canonicalDomain}`)
    if (redirectUri) retry.searchParams.set('callbackUrl', redirectUri)
    return res.redirect(302, retry.href)
  }

  const syncUrl = new URL('/api/auth/sync', SN_MAIN_DOMAIN)
  syncUrl.searchParams.set('domain', canonicalDomain)
  syncUrl.searchParams.set('redirectUri', redirectUri)
  syncUrl.searchParams.set(AUTH_SYNC_NONCE_PARAM, nonce)

  const loginUrl = new URL(signup ? '/signup' : '/login', SN_MAIN_DOMAIN)
  loginUrl.searchParams.set('domain', canonicalDomain)
  loginUrl.searchParams.set('callbackUrl', syncUrl.pathname + syncUrl.search)

  res.redirect(302, loginUrl.href)
}
