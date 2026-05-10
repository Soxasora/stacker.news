import { cachedFetcher } from '@/lib/fetch'
import prisma from '@/api/models'
import {
  CUSTOM_DOMAINS_DEBUG,
  CUSTOM_DOMAINS_CACHE_EXPIRY_MS,
  CUSTOM_DOMAINS_CACHE_FORCE_REFRESH_THRESHOLD_MS,
  MAX_SEO_TAGLINE_LENGTH
} from '@/lib/constants'
import { parseSafeHost } from '@/lib/safe-url'
import removeMd from 'remove-markdown'
import { getSubTheme } from '@/lib/domains/sub-theme'

// main domain
export const SN_MAIN_DOMAIN = new URL(process.env.NEXT_PUBLIC_URL)

export function resolveDomainSeo ({ domainSeo, sub }) {
  return {
    title: domainSeo?.title ?? sub?.name ?? null,
    // to fallback gracefully to sub.desc, markdown is removed and is truncated to MAX_SEO_TAGLINE_LENGTH
    tagline: domainSeo?.tagline ?? (sub?.desc ? removeMd(sub.desc).slice(0, MAX_SEO_TAGLINE_LENGTH) : null) ?? null,
    ogImageId: domainSeo?.ogImageId ?? null,
    faviconId: domainSeo?.faviconId ?? null
  }
}

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
        },
        sub: {
          select: {
            name: true,
            desc: true
          }
        }
      },
      where: {
        status: 'ACTIVE'
      }
    })

    if (!domains.length) return null

    return domains.reduce((acc, domain) => {
      acc[domain.domainName.toLowerCase()] = {
        id: domain.id,
        domainName: domain.domainName,
        subName: domain.subName,
        tokenVersion: domain.tokenVersion,
        seo: resolveDomainSeo({ domainSeo: domain.seo, sub: domain.sub })
      }
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

export const getDomainMapping = async (domain) => {
  const parsedDomain = parseSafeHost(domain)
  if (!parsedDomain) return null

  const domainsMappings = await domainsMappingsCache()
  return domainsMappings?.[parsedDomain.hostname] ?? null
}

/** returns the cached domain seo settings */
export const getDomainSeo = async (domain) => {
  const mapping = await getDomainMapping(domain)
  return mapping?.seo ?? null
}

export const getDomainCustomization = async (domain) => {
  const domainMapping = await getDomainMapping(domain)
  if (!domainMapping) return null

  const seo = domainMapping.seo ?? null
  const theme = await getSubTheme(domainMapping.subName)
  if (!theme) return null

  return { theme, seo }
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
