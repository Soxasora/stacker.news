import removeMd from 'remove-markdown'
import { MAX_SEO_TAGLINE_LENGTH } from '@/lib/constants'
import { truncateString } from '@/lib/format'

export function truncateDesc (sub, maxLength = MAX_SEO_TAGLINE_LENGTH) {
  if (!sub?.desc) return null
  return truncateString(removeMd(sub.desc), maxLength)
}

export function getSeoWithFallback ({ domainSeo, sub }) {
  return {
    title: domainSeo?.title ?? `~${sub?.name}` ?? null,
    tagline: domainSeo?.tagline ?? truncateDesc(sub),
    faviconId: domainSeo?.faviconId ?? null
  }
}
