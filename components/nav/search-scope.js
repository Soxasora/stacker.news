import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'

// the first ~territory and @nym outside quotes filter the search, same as
// queryParts in api/resolvers/search.js. the rest is the text
export function parseSearch (q = '') {
  const scope = {}
  const text = q.replace(/"[^"]*"|\S+/g, word => {
    if (!scope.sub && /^~\w/.test(word)) {
      scope.sub = word.slice(1)
      return ''
    }
    if (!scope.user && /^@\w/.test(word)) {
      scope.user = word.slice(1)
      return ''
    }
    return word
  }).replace(/\s+/g, ' ').trim()
  return { scope, text }
}

// the scope goes first because the server uses the first ~territory and @nym
export function toSearchQ ({ sub, user } = {}, text = '') {
  return [sub && `~${sub}`, user && `@${user}`, text.trim()].filter(Boolean).join(' ')
}

const RECENT_SUBS_KEY = 'recentTerritories'
// more than the bar shows, some may be gone or be the one we're in
const RECENT_SUBS_MAX = 8

// the names of the territories opened last on this device, newest first
export function recentSubs () {
  try {
    const names = JSON.parse(window.localStorage.getItem(RECENT_SUBS_KEY))
    return Array.isArray(names) ? names : []
  } catch {
    return []
  }
}

function rememberSub (name) {
  try {
    const names = [name, ...recentSubs().filter(recent => recent !== name)].slice(0, RECENT_SUBS_MAX)
    window.localStorage.setItem(RECENT_SUBS_KEY, JSON.stringify(names))
  } catch {}
}

const SearchScopeContext = createContext()

// what the bar shows before anything is typed: the current search on a search
// page, the page's territory and stacker everywhere else
function usePageSearch (sub, user) {
  const router = useRouter()
  const q = router.pathname.endsWith('/search') && typeof router.query.q === 'string' ? router.query.q : undefined
  return useMemo(() => q === undefined ? { scope: { sub, user }, text: '' } : parseSearch(q), [q, sub, user])
}

// the scope and text of the search bar, shared by every bar on the page
export function SearchScopeProvider ({ sub, user, children }) {
  const router = useRouter()
  const page = usePageSearch(sub, user)
  // the territory whose pages we're on. posts also come with a sub, they don't count
  const pageSub = router.pathname.startsWith('/~') ? sub : undefined
  useEffect(() => {
    if (pageSub) rememberSub(pageSub)
  }, [pageSub])
  const [state, setState] = useState({ page, ...page })
  // start over when the page's search changes
  if (state.page !== page) setState({ page, ...page })

  const setText = useCallback(text => setState(state => ({ ...state, text })), [])
  // pass undefined to remove a territory or stacker
  const setScope = useCallback(scope => setState(state => ({ ...state, scope: { ...state.scope, ...scope } })), [])
  const reset = useCallback(() => setState(state => ({ ...state, ...state.page })), [])

  const { scope, text } = state
  const value = useMemo(() => ({ scope, text, pageSub, setText, setScope, reset }), [scope, text, pageSub, setText, setScope, reset])
  return <SearchScopeContext.Provider value={value}>{children}</SearchScopeContext.Provider>
}

export function useSearchScope () {
  return useContext(SearchScopeContext)
}
