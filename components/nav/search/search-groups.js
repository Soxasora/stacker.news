import { useMemo, useState } from 'react'
import { useQuery } from '@apollo/client/react'
import { NAV_SEARCH_POSTS, NAV_SEARCH_NAMES } from '@/fragments/search'
import { postItem, userItem, subItem } from './items'

// posts, stackers and territories each, under a search
const SEARCH_LIMIT = 3
// when only stackers or only territories show
const NAMES_LIMIT = 8

function toGroups (data, scopeWords) {
  return [
    { value: 'post', label: scopeWords ? `posts ${scopeWords}` : 'posts', items: (data.search?.items ?? []).map(postItem) },
    { value: 'user', label: 'stackers', items: (data.searchUsers ?? []).map(userItem) },
    // territory post counts need a time range, so these tiles only have the name
    { value: 'sub', label: 'territories', layout: 'tiles', items: (data.subSuggestions ?? []).map(sub => subItem(sub)) }
  ].filter(group => group.items.length > 0)
}

// keeps the last results while the next ones load, as long as they are for the
// same kind of lookup. apollo's previousData doesn't work here: it survives
// skip, so results from before the input was cleared would show up again
function useLastData (data, kind) {
  const [last, setLast] = useState({ kind })
  const current = kind && data ? data : last.kind === kind ? last.data : undefined
  if (last.kind !== kind || last.data !== current) setLast({ kind, data: current })
  return current
}

// the results for what's typed, in groups with the item type as value. posts
// come from opensearch and names from the db, so names don't wait for posts
export function useSearchGroups ({ lookup, debounced, open }) {
  const nameQ = debounced.mode === 'name' ? debounced.name : debounced.nameQ
  const withPosts = debounced.mode === 'search'
  const withUsers = !!nameQ && debounced.type !== 'sub'
  // a ~ without a name lists every territory
  const withSubs = debounced.type === 'sub' || (withPosts && !!nameQ)
  const withNames = withUsers || withSubs

  // only the open bar runs the queries, there's more than one bar on the page.
  // no-cache: searchTitle is saved on the post in the cache, so a search here
  // would change the titles the search page shows
  const posts = useQuery(NAV_SEARCH_POSTS, {
    variables: { q: debounced.q, limit: SEARCH_LIMIT },
    skip: !open || !withPosts,
    fetchPolicy: 'no-cache'
  })
  const names = useQuery(NAV_SEARCH_NAMES, {
    variables: { q: nameQ ?? '', withUsers, withSubs, limit: debounced.mode === 'name' ? NAMES_LIMIT : SEARCH_LIMIT },
    skip: !open || !withNames
  })
  const postData = useLastData(posts.data, withPosts && 'search')
  const nameData = useLastData(names.data, withNames && (debounced.type ?? 'search'))

  // stackers that were looked up by name don't belong under a search, and the other way around
  const sameLookup = debounced.mode === lookup.mode && debounced.type === lookup.type
  const groups = useMemo(
    () => sameLookup ? toGroups({ ...postData, ...nameData }, debounced.scopeWords) : [],
    [sameLookup, postData, nameData, debounced.scopeWords])

  // the wait before the lookup counts as loading, so the popup doesn't open with only the footer
  const waiting = lookup.key !== debounced.key
  const postsLoading = lookup.mode === 'search' && (posts.loading || waiting)
  const namesLoading = lookup.mode !== 'browse' && (names.loading || waiting)
  return {
    groups,
    loading: postsLoading || namesLoading,
    // by group value, each group has a spinner until its query is done
    groupLoading: { post: postsLoading, user: namesLoading, sub: namesLoading }
  }
}
