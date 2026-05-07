// custom domain calls POST /api/auth/domains/token
// receives code, redirectUri
// e.g. https://pizza.com/?code=1234567890&redirectUri=/settings
// grabs from cookies the `verifier`
// POSTs to /api/auth/domains/token
// with the following body:
// {
//   code,
//   domainName: domainName,
//   verifier: verifier
// }
//
// receives JWT
// redirects to redirectUri with the JWT in the response as Set-Cookie

import { parseSafeHost, safeRedirectPath } from '@/lib/safe-url'
import { SN_MAIN_DOMAIN } from '@/lib/domains'
import { DOMAINS_AUTH_VERIFIER_COOKIE } from '@/lib/domains/auth-sync'
import * as cookie from 'cookie'
import { cookieOptions, buildMultiAuthCookies, MULTI_AUTH_LIST, SESSION_COOKIE } from '@/lib/auth'

export default async function handler (req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'ERROR', reason: 'method not allowed' })
  }

  try {
    const { code, redirectUri: rawRedirectUri } = req.query
    if (!code || !rawRedirectUri) {
      return res.status(400).json({ status: 'ERROR', reason: 'code and redirectUri are required' })
    }

    const domain = req.headers.host
    const redirectUri = safeRedirectPath(rawRedirectUri, domain)
    const { hostname: domainName } = parseSafeHost(domain)

    // get the verifier from custom domain cookies
    const verifier = req.cookies[DOMAINS_AUTH_VERIFIER_COOKIE]

    // exchange the code for a session token
    const tokenData = await exchangeCode(domainName, code, verifier)
    // set the session cookie
    res.appendHeader('Set-Cookie', cookie.serialize(SESSION_COOKIE, tokenData.sessionToken, cookieOptions()))

    // mirror multi-auth state on the custom domain so the account picker also works here.
    // each per-user JWT is the domain-bound session token minted for THIS domain (not the
    // main-domain JWT), so when switchSessionCookie swaps it in, the [...nextauth] jwt
    // callback's domainName/tokenVersion check still passes.
    if (tokenData.user?.id != null) {
      const multiAuthCookies = buildMultiAuthCookies(
        req.cookies[MULTI_AUTH_LIST],
        {
          id: tokenData.user.id,
          jwt: tokenData.sessionToken,
          name: tokenData.user.name,
          photoId: tokenData.user.photoId
        }
      )
      for (const { name, value, options } of multiAuthCookies) {
        res.appendHeader('Set-Cookie', cookie.serialize(name, value, options))
      }
    }

    return res.redirect(302, redirectUri)
  } catch (error) {
    console.error('[domains-auth] cannot verify code', error)
    return res.status(500).json({ status: 'ERROR', reason: 'cannot verify code' })
  }
}

async function exchangeCode (domainName, code, verifier) {
  const body = JSON.stringify({
    code,
    domainName,
    verifier
  })
  const fetchHeaders = new Headers()
  fetchHeaders.set('Content-Type', 'application/json')

  const response = await fetch(`${SN_MAIN_DOMAIN.origin}/api/auth/domains/token`, {
    method: 'POST',
    headers: fetchHeaders,
    body,
    signal: AbortSignal.timeout(10000)
  })

  const data = await response.json()
  if (data.status === 'ERROR') {
    throw new Error(data.reason)
  }

  return data
}
