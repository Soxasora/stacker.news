import removeMd from 'remove-markdown'
import { MAX_SEO_TAGLINE_LENGTH } from '@/lib/constants'
import { truncateString } from '@/lib/format'

export function truncateDesc (desc, maxLength = MAX_SEO_TAGLINE_LENGTH) {
  if (!desc) return null
  return truncateString(removeMd(desc), maxLength)
}

export function getSeoWithFallback ({ domainSeo, subName, subDesc }) {
  return {
    title: domainSeo?.title ?? subName ? `~${subName}` : null,
    tagline: domainSeo?.tagline ?? subDesc ? truncateDesc(subDesc) : null,
    faviconId: domainSeo?.faviconId ?? null
  }
}
