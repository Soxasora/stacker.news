import removeMd from 'remove-markdown'
import { MAX_SEO_TAGLINE_LENGTH } from '@/lib/constants'
import { truncateString } from '@/lib/format'

function truncateDesc (sub) {
  if (!sub?.desc) return null
  return truncateString(removeMd(sub.desc), MAX_SEO_TAGLINE_LENGTH)
}

export function getSeoWithFallback ({ domainSeo, sub }) {
  return {
    title: domainSeo?.title ?? sub?.name ?? null,
    tagline: domainSeo?.tagline ?? truncateDesc(sub),
    ogImageId: domainSeo?.ogImageId ?? null,
    faviconId: domainSeo?.faviconId ?? null
  }
}
