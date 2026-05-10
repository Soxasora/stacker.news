import { NextSeo } from 'next-seo'
import { useRouter } from 'next/router'
import removeMd from 'remove-markdown'
import { numWithUnits } from '@/lib/format'
import { useDomainSeo } from './territory-domains'
import { PUBLIC_MEDIA_URL } from '@/lib/constants'

// SEO for Stacker News or a custom domain
// path is the URL path used for the dynamic capture fallback image
function useSeoBranding (path) {
  const domainSeo = useDomainSeo()

  const brand = domainSeo?.title ?? 'stacker news'
  const siteName = domainSeo?.title ?? 'Stacker News'
  const tagline = domainSeo?.tagline ?? 'moderating forums with money'
  // fallback to capture.stacker.news for custom domains
  const ogImageUrl = domainSeo?.ogImageId
    ? `${PUBLIC_MEDIA_URL}/${domainSeo.ogImageId}`
    : 'https://capture.stacker.news' + path

  // domain seo doesn't support twitter yet
  const twitter = domainSeo
    ? { cardType: 'summary_large_image' }
    : { site: '@stacker_news', cardType: 'summary_large_image' }

  return { domainSeo, brand, siteName, tagline, ogImageUrl, twitter }
}

export function SeoSearch ({ sub }) {
  const router = useRouter()
  const { domainSeo, brand, siteName, ogImageUrl, twitter } = useSeoBranding(router.asPath)

  const subStr = !domainSeo && sub ? ` ~${sub}` : ''
  const query = router.query.q || ''
  const title = `${query || 'search'} \\ ${brand}${subStr}`
  const desc = domainSeo
    ? `${brand} search: ${query}`
    : `SN${subStr} search: ${query}`

  return (
    <NextSeo
      title={title}
      description={desc}
      openGraph={{
        title,
        description: desc,
        images: [
          {
            url: ogImageUrl
          }
        ],
        site_name: siteName
      }}
      twitter={twitter}
    />
  )
}

// for a sub we need
// item seo
// index page seo
// recent page seo

export default function Seo ({ sub, item, user }) {
  const router = useRouter()
  const pathNoQuery = router.asPath.split('?')[0]
  const { domainSeo, brand, siteName, tagline, ogImageUrl, twitter } = useSeoBranding(pathNoQuery)

  const defaultTitle = pathNoQuery.slice(1)
  const snStr = `${brand}${!domainSeo && sub ? ` ~${sub}` : ''}`

  let fullTitle = `${defaultTitle && `${defaultTitle} \\ `}${brand}`
  let desc = tagline

  if (item) {
    if (item.title) {
      fullTitle = `${item.title} \\ ${snStr}`
    } else if (item.root) {
      fullTitle = `reply on: ${item.root.title} \\ ${snStr}`
    }
    // at least for now subs (ie the only one is jobs) will always have text
    if (item.text) {
      desc = removeMd(item.text)
      if (desc) {
        desc = desc.replace(/\s+/g, ' ')
      }
    } else {
      desc = `@${item.user.name} stacked ${numWithUnits(item.sats)} ${item.url ? `posting ${item.url}` : 'with this discussion'}`
    }
    if (item.ncomments) {
      desc += ` [${numWithUnits(item.ncomments, { unitSingular: 'comment', unitPlural: 'comments' })}`
      if (item.boost) {
        desc += `, ${item.boost} boost`
      }
      desc += ']'
    } else if (item.boost) {
      desc += ` [${item.boost} boost]`
    }
  }
  if (user) {
    desc = `@${user.name} has [${user.optional.stacked ? `${user.optional.stacked} stacked,` : ''}${numWithUnits(user.nitems, { unitSingular: 'item', unitPlural: 'items' })}]`
  }

  return (
    <NextSeo
      title={fullTitle}
      description={desc}
      openGraph={{
        title: fullTitle,
        description: desc,
        images: [
          {
            url: ogImageUrl
          }
        ],
        site_name: siteName
      }}
      twitter={twitter}
    />
  )
}
