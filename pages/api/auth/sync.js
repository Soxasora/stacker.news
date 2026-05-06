import models from '@/api/models'
import { randomBytes } from 'node:crypto'
import { encode as encodeJWT, getToken } from 'next-auth/jwt'
import { validateSchema, customDomainSchema } from '@/lib/validate'
import { SN_MAIN_DOMAIN } from '@/lib/domains'
import { formatHost, parseSafeHost, safeRedirectPath } from '@/lib/safe-url'
import { VERIFICATION_TOKEN_EXPIRY_MS, AUTH_SYNC_TOKEN_TAG } from '@/lib/constants'
import { multiAuthMiddleware } from '@/lib/auth'
import {
  verifyAuthSyncProof,
  hashSyncNonce,
  isValidSyncNonce,
  safeEqual,
  AUTH_SYNC_PROOF_HEADER,
  AUTH_SYNC_NONCE_PARAM
} from '@/lib/domains/auth-sync'

export default async function handler (req, res) {
  try {
    if (req.method === 'POST') {
      const { verificationToken, domainName, nonce } = req.body || {}
      const parsedDomain = parseSafeHost(domainName)
      if (!verificationToken || !parsedDomain || !isValidSyncNonce(nonce)) {
        return res.status(400).json({ status: 'ERROR', reason: 'verification token, domain name and nonce are required' })
      }

      const nonceHash = hashSyncNonce(nonce)

      // verify the request came from our own middleware via proof header bound to the nonce
      const validProof = verifyAuthSyncProof({
        received: req.headers[AUTH_SYNC_PROOF_HEADER],
        verificationToken,
        domainName: parsedDomain.hostname,
        nonceHash,
        secret: process.env.NEXTAUTH_SECRET
      })
      if (!validProof) {
        return res.status(401).json({ status: 'ERROR', reason: 'invalid proof' })
      }

      const verificationResult = await consumeVerificationToken(verificationToken, parsedDomain.hostname, nonceHash)
      if (verificationResult.status === 'ERROR') {
        return res.status(400).json(verificationResult)
      }

      const sessionTokenResult = await createSessionToken({
        userId: verificationResult.userId,
        domainName: parsedDomain.hostname,
        domainId: verificationResult.domainId,
        tokenVersion: verificationResult.tokenVersion
      })
      if (sessionTokenResult.status === 'ERROR') {
        return res.status(500).json(sessionTokenResult)
      }

      // forward display fields so the proxy can populate the multi-auth list
      // cookie on the custom domain (the picker reads name/photoId from that list).
      // these were fetched in consumeVerificationToken's transaction, no extra round trip.
      return res.status(200).json({
        status: 'OK',
        sessionToken: sessionTokenResult.sessionToken,
        user: verificationResult.user
      })
    }

    if (req.method === 'GET') {
      const { domain, redirectUri: rawRedirectUri, signup } = req.query
      const parsedDomain = parseSafeHost(domain)
      if (!parsedDomain) {
        return res.status(400).json({ status: 'ERROR', reason: 'domain is required' })
      }

      const domainValidation = await checkDomainValidity(parsedDomain.hostname)
      if (domainValidation.status === 'ERROR') {
        return res.status(400).json(domainValidation)
      }

      const canonicalDomain = formatHost(parsedDomain)
      const redirectUri = safeRedirectPath(rawRedirectUri, canonicalDomain)
      if (signup) {
        return handleNoSession(res, canonicalDomain, redirectUri, signup)
      }

      // honor multi auth cookie
      req = await multiAuthMiddleware(req, res)
      const sessionToken = await getToken({ req })
      if (!sessionToken) {
        return handleNoSession(res, canonicalDomain, redirectUri)
      }

      // CSRF gate: the matching nonce cookie is set on the custom domain by the middleware
      // when it intercepts /login or /signup. If it's missing, we bounce back to the custom domain to mint a fresh one.
      const nonce = req.query[AUTH_SYNC_NONCE_PARAM]
      if (!isValidSyncNonce(nonce)) {
        return handleNoSession(res, canonicalDomain, redirectUri)
      }
      const nonceHash = hashSyncNonce(nonce)

      const newVerificationToken = await createVerificationToken(sessionToken, domainValidation.domainId, nonceHash)
      if (newVerificationToken.status === 'ERROR') {
        return res.status(500).json(newVerificationToken)
      }

      return redirectToDomain(res, parsedDomain, newVerificationToken.token, redirectUri)
    }
  } catch (error) {
    return res.status(500).json({ status: 'ERROR', reason: 'auth sync broke its legs' })
  }
}

async function checkDomainValidity (receivedDomain) {
  try {
    await validateSchema(customDomainSchema, { domainName: receivedDomain })
    const domain = await models.domain.findUnique({
      where: { domainName: receivedDomain, status: 'ACTIVE' },
      select: { id: true }
    })

    if (!domain) {
      return { status: 'ERROR', reason: 'domain not allowed' }
    }

    return { status: 'OK', domainId: domain.id }
  } catch (error) {
    console.error('[auth sync] domain is not valid', error)
    return { status: 'ERROR', reason: 'domain is not valid' }
  }
}

function handleNoSession (res, domainName, redirectUri, signup = false) {
  // bounce to /login (or /signup) on the *custom* domain, not the main one,
  // so the request passes through the custom-domain middleware
  // which mints a fresh nonce cookie and re-enters the flow.
  const customDomainLoginUrl = new URL(
    signup ? '/signup' : '/login',
    `${SN_MAIN_DOMAIN.protocol}//${domainName}`
  )
  if (redirectUri) {
    customDomainLoginUrl.searchParams.set('callbackUrl', redirectUri)
  }

  res.redirect(302, customDomainLoginUrl.href)
}

async function createVerificationToken (token, domainId, nonceHash) {
  try {
    const verificationToken = await models.verificationToken.create({
      data: {
        // bind the token to the user, the domain, and the per-browser nonce hash
        identifier: `${AUTH_SYNC_TOKEN_TAG}:${token.id}:${domainId}:${nonceHash}`,
        token: randomBytes(32).toString('hex'),
        expires: new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_MS)
      }
    })
    return { status: 'OK', token: verificationToken.token }
  } catch (error) {
    return { status: 'ERROR', reason: 'failed to create verification token' }
  }
}

function redirectToDomain (res, domain, verificationToken, redirectUri) {
  try {
    const target = new URL(`${SN_MAIN_DOMAIN.protocol}//${formatHost(domain)}`)

    target.searchParams.set('sync_token', verificationToken)
    target.searchParams.set('redirectUri', redirectUri)

    return res.redirect(302, target.href)
  } catch (error) {
    console.error('[auth sync] cannot construct redirect URL', error)
    return res.status(500).json({ status: 'ERROR', reason: 'cannot construct the URL' })
  }
}

async function consumeVerificationToken (verificationToken, expectedDomainName, expectedNonceHash) {
  try {
    await validateSchema(customDomainSchema, { domainName: expectedDomainName })

    const result = await models.$transaction(async tx => {
      // lock the Domain row in order to avoid minting a session against a stale tokenVersion.
      const domains = await tx.$queryRaw`
        SELECT id, "tokenVersion"
        FROM "Domain"
        WHERE "domainName" = ${expectedDomainName}
          AND status = 'ACTIVE'
        FOR UPDATE
      `
      const domain = domains[0]
      if (!domain) throw new Error('domain not allowed')

      const token = await tx.verificationToken.findUnique({
        where: { token: verificationToken }
      })
      if (!token || token.expires <= new Date()) throw new Error('invalid verification token')

      const identifier = token.identifier || ''
      const [tag, userIdStr, domainIdStr, storedNonceHash] = identifier.split(':')
      if (tag !== AUTH_SYNC_TOKEN_TAG || Number(domainIdStr) !== domain.id) {
        throw new Error('invalid verification token domain')
      }

      // nonce-hash binding: the cookie that travelled back with this request must
      // hash to the value we stored at mint time.
      // mismatch throws before the delete so the transaction rolls back and the token survives
      // for a legitimate retry (e.g. cookie overwritten by a concurrent tab flow).
      if (!safeEqual(storedNonceHash, expectedNonceHash)) {
        throw new Error('invalid verification token nonce')
      }

      const userId = Number(userIdStr)
      // pull display fields in the same transaction so the proxy can seed
      // MULTI_AUTH_LIST without an additional round trip.
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, photoId: true }
      })
      if (!user) throw new Error('invalid verification token user')

      await tx.verificationToken.delete({ where: { id: token.id } })

      return {
        userId,
        domainId: domain.id,
        tokenVersion: domain.tokenVersion,
        user
      }
    })

    return { status: 'OK', ...result }
  } catch (error) {
    return { status: 'ERROR', reason: 'cannot validate verification token' }
  }
}

async function createSessionToken ({ userId, domainName, domainId, tokenVersion }) {
  try {
    const sessionToken = await encodeJWT({
      token: {
        id: userId,
        sub: userId,
        domainName,
        domainId,
        tokenVersion
      },
      secret: process.env.NEXTAUTH_SECRET
    })

    return { status: 'OK', sessionToken }
  } catch (error) {
    return { status: 'ERROR', reason: 'failed to create ephemeral session token' }
  }
}
