import { NextSeo } from 'next-seo'
import { useRouter } from 'next/router'
import removeMd from 'remove-markdown'
import { numWithUnits } from '@/lib/format'
import { useDomainSeo } from '@/components/domain-seo'
import { PUBLIC_MEDIA_URL } from '@/lib/constants'

export function SeoSearch ({ sub }) {
  const router = useRouter()
  const seo = useDomainSeo()
  const brandOgImageUrl = seo?.ogImageId ? `${PUBLIC_MEDIA_URL}/${seo.ogImageId}` : null
  const siteName = seo?.title || 'stacker news'
  const subStr = sub ? ` ~${sub}` : ''
  const title = `${router.query.q || 'search'} \\ ${siteName}${subStr}`
  const desc = `${seo?.title ? seo.title : 'SN'}${subStr} search: ${router.query.q || ''}`

  return (
    <NextSeo
      title={title}
      description={desc}
      openGraph={{
        title,
        description: desc,
        images: [
          {
            url: brandOgImageUrl || ('https://capture.stacker.news' + router.asPath)
          }
        ],
        site_name: seo?.title || 'Stacker News'
      }}
      // twitter is not supported for custom domains yet
      twitter={seo
        ? undefined
        : {
            site: '@stacker_news',
            cardType: 'summary_large_image'
          }}
    />
  )
}

// for a sub we need
// item seo
// index page seo
// recent page seo

export default function Seo ({ sub, item, user }) {
  const router = useRouter()
  const seo = useDomainSeo()
  const brandOgImageUrl = seo?.ogImageId ? `${PUBLIC_MEDIA_URL}/${seo.ogImageId}` : null
  // On a branded custom domain, swap "stacker news" for the owner-chosen
  // title in <title> + og:site_name. Falls back transparently elsewhere.
  const siteName = seo?.title || 'stacker news'
  const pathNoQuery = router.asPath.split('?')[0]
  const defaultTitle = pathNoQuery.slice(1)
  const snStr = `${siteName}${sub ? ` ~${sub}` : ''}`
  let fullTitle = `${defaultTitle && `${defaultTitle} \\ `}${siteName}`
  let desc = seo?.tagline || 'moderating forums with money'
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
            // precedence to `/item` capture over brand og:image
            url: item ? ('https://capture.stacker.news' + pathNoQuery) : (brandOgImageUrl || ('https://capture.stacker.news' + pathNoQuery))
          }
        ],
        site_name: siteName
      }}
      twitter={{
        site: '@stacker_news',
        cardType: 'summary_large_image'
      }}
    />
  )
}
