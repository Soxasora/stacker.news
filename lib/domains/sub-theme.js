import { cachedFetcher } from '@/lib/fetch'
import { prisma } from '@/lib/prisma'
import { CUSTOM_DOMAINS_CACHE_FORCE_REFRESH_THRESHOLD_MS, CUSTOM_DOMAINS_CACHE_EXPIRY_MS, CUSTOM_DOMAINS_DEBUG } from '@/lib/constants'

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

export const getSubTheme = async (subName) => {
  if (!subName) return null
  return await subThemeCache(subName)
}
