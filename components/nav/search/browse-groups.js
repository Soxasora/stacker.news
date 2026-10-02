import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@apollo/client/react'
import { ACTIVE_SUBS } from '@/fragments/subs'
import { NAV_POPULAR_SUBS } from '@/fragments/search'
import { numWithUnits } from '@/lib/format'
import { recentItem, subItem } from './items'
import { clearRecentSearches, recentSearches, recentSubs } from './recent'
import { useSearchState } from './state'

// recent searches shown
const SEARCHES = 3
// territories in each group. on desktop one row of tiles, on phones a tile is a row
const TILES = 4
const TILES_PHONE = 3
// more than we show, some are already in the other group or muted
const POPULAR_LIMIT = 12

// the territories to offer, without the one we're in: the visited ones first,
// and what is left of the others
function pickSubs (subs, visitedNames, pageSub, limit) {
  const byName = new Map(subs.map(sub => [sub.name, sub]))
  // a visited one may be gone by now
  const visited = visitedNames.map(name => byName.get(name)).filter(sub => sub && sub.name !== pageSub).slice(0, limit)
  const shown = new Set([pageSub, ...visited.map(sub => sub.name)])
  const others = subs.filter(sub => !shown.has(sub.name) && !sub.meMuteSub)
  return { visited, others, subscribed: others.filter(sub => sub.meSubscription) }
}

// the group after the visited ones: the subscriptions, the most active
// territories when there are no subscriptions to show, or every territory
function otherSubs ({ subs, picks, popular, limit, expanded }) {
  if (expanded) {
    // muted ones last
    const all = [...subs].sort((a, b) => Number(a.meMuteSub) - Number(b.meMuteSub))
    return { label: 'all territories', items: all.map(sub => subItem(sub)) }
  }
  if (picks.subscribed.length > 0) {
    return { label: 'subscribed', items: picks.subscribed.slice(0, limit).map(sub => subItem(sub)) }
  }
  const posts = new Map(popular.map(sub => [sub.name, sub.nitems]))
  const items = picks.others
    .filter(sub => posts.has(sub.name))
    .sort((a, b) => posts.get(b.name) - posts.get(a.name))
    .slice(0, limit)
    .map(sub => subItem(sub, numWithUnits(posts.get(sub.name), { unitSingular: 'post', unitPlural: 'posts' })))
  return { label: 'popular', items }
}

// what shows before anything is typed: recent searches, the territories opened
// last on this device, and the subscribed or popular ones
export function useBrowseGroups ({ open, phone }) {
  const { pageSub } = useSearchState()
  const [expanded, setExpanded] = useState(false)
  // read again every time the search opens
  const [searches, setSearches] = useState([])
  const [visitedNames, setVisitedNames] = useState([])
  useEffect(() => {
    if (!open) return
    setSearches(recentSearches())
    setVisitedNames(recentSubs())
  }, [open])

  const clearSearches = useCallback(() => {
    clearRecentSearches()
    setSearches([])
  }, [])

  // the same query as the post form, so it's in the cache most of the time
  const subs = useQuery(ACTIVE_SUBS, { skip: !open }).data?.activeSubs
  const limit = phone ? TILES_PHONE : TILES
  const picks = useMemo(() => pickSubs(subs ?? [], visitedNames, pageSub, limit), [subs, visitedNames, pageSub, limit])

  // only needed when there are no subscriptions to show
  const popular = useQuery(NAV_POPULAR_SUBS, {
    variables: { limit: POPULAR_LIMIT },
    skip: !open || !subs || picks.subscribed.length > 0
  }).data?.topSubs?.subs

  return useMemo(() => {
    const total = subs?.length ?? 0
    return [
      {
        value: 'recent-searches',
        label: 'recent',
        items: searches.slice(0, SEARCHES).map(recentItem),
        action: { label: 'clear', onClick: clearSearches }
      },
      { value: 'recent-subs', label: 'recently visited', layout: 'tiles', items: picks.visited.map(sub => subItem(sub)) },
      {
        value: 'other-subs',
        layout: 'tiles',
        ...otherSubs({ subs: subs ?? [], picks, popular: popular ?? [], limit, expanded }),
        action: total > 0
          ? { label: expanded ? 'show less' : `show all (${total})`, onClick: () => setExpanded(expanded => !expanded) }
          : undefined
      }
    ].filter(group => group.items.length > 0)
  }, [searches, clearSearches, subs, picks, popular, limit, expanded])
}
