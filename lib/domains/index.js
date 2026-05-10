import { cachedFetcher } from '@/lib/fetch'
import prisma from '@/api/models'
import {
  CUSTOM_DOMAINS_DEBUG,
  CUSTOM_DOMAINS_CACHE_EXPIRY_MS,
  CUSTOM_DOMAINS_CACHE_FORCE_REFRESH_THRESHOLD_MS
} from '@/lib/constants'
import { parseSafeHost } from '@/lib/safe-url'

// main domain
export const SN_MAIN_DOMAIN = new URL(process.env.NEXT_PUBLIC_URL)

// hot path: hit by middleware on every request. seo rides along inline
// (a few small string/int fields per active domain) so SSR can serve the
// per-domain head tags without a second cache lookup. middleware never
// touches the seo fields.
export const domainsMappingsCache = cachedFetcher(async function fetchDomainsMappings () {
  try {
    const domains = await prisma.domain.findMany({
      select: {
        id: true, // pins JWTs to a specific Domain row across delete/recreate cycles
        domainName: true,
        subName: true,
        tokenVersion: true, // jwt revocability within a single row lifetime
        seo: {
          select: {
            title: true,
            tagline: true,
            ogImageId: true,
            faviconId: true
          }
        }
      },
      where: {
        status: 'ACTIVE'
      }
    })

    if (!domains.length) return null

    return domains.reduce((acc, domain) => {
      acc[domain.domainName.toLowerCase()] = domain
      return acc
    }, {})
  } catch (error) {
    console.error('[domains] error fetching domain mappings', error)
    return null
  }
}, {
  forceRefreshThreshold: CUSTOM_DOMAINS_CACHE_FORCE_REFRESH_THRESHOLD_MS,
  cacheExpiry: CUSTOM_DOMAINS_CACHE_EXPIRY_MS,
  debug: CUSTOM_DOMAINS_DEBUG,
  keyGenerator: () => 'domain_mappings'
})

// per-sub theme cache. visual identity (colors, logo, default mode) only.
// today still gated by an active custom domain at the call site, but the row
// is keyed by sub so it can be served everywhere with a single one-line change.
export const subThemeCache = cachedFetcher(async function fetchSubTheme (subName) {
  if (!subName) return null

  try {
    return await prisma.subTheme.findUnique({
      select: {
        primaryColor: true,
        secondaryColor: true,
        linkColor: true,
        brandColor: true,
        defaultMode: true,
        logoId: true
      },
      where: { subName }
    })
  } catch (error) {
    console.error('[domains] error fetching sub theme', error)
    return null
  }
}, {
  forceRefreshThreshold: CUSTOM_DOMAINS_CACHE_FORCE_REFRESH_THRESHOLD_MS,
  cacheExpiry: CUSTOM_DOMAINS_CACHE_EXPIRY_MS,
  debug: CUSTOM_DOMAINS_DEBUG,
  keyGenerator: subName => `sub_theme:${subName.toLowerCase()}`
})

export const getDomainMapping = async (domain) => {
  const parsedDomain = parseSafeHost(domain)
  if (!parsedDomain) return null

  const domainsMappings = await domainsMappingsCache()
  return domainsMappings?.[parsedDomain.hostname] ?? null
}

export const getSubTheme = async (subName) => {
  if (!subName) return null
  return await subThemeCache(subName)
}

// domain SEO is denormalized into the mapping cache, so resolving it from a
// host is a single in-memory lookup
export const getDomainSeoForHost = async (host) => {
  const mapping = await getDomainMapping(host)
  return mapping?.seo ?? null
}

export function createDomainsDebugLogger (domainName, debug = CUSTOM_DOMAINS_DEBUG) {
  const noop = () => {}

  if (!debug) {
    return {
      log: noop,
      errorLog: noop
    }
  }

  const log = (message, ...args) => console.log(`[DOMAINS:${domainName}] ${message}`, ...args)
  const errorLog = (message, ...args) => console.error(`[DOMAINS:${domainName}] ${message}`, ...args)

  return {
    log,
    errorLog
  }
}
