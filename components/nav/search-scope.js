import { createContext, useCallback, useContext, useMemo, useState } from 'react'
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
  const page = usePageSearch(sub, user)
  const [state, setState] = useState({ page, ...page })
  // start over when the page's search changes
  if (state.page !== page) setState({ page, ...page })

  const setText = useCallback(text => setState(state => ({ ...state, text })), [])
  // pass undefined to remove a territory or stacker
  const setScope = useCallback(scope => setState(state => ({ ...state, scope: { ...state.scope, ...scope } })), [])
  const reset = useCallback(() => setState(state => ({ ...state, ...state.page })), [])

  const { scope, text } = state
  const value = useMemo(() => ({ scope, text, setText, setScope, reset }), [scope, text, setText, setScope, reset])
  return <SearchScopeContext.Provider value={value}>{children}</SearchScopeContext.Provider>
}

export function useSearchScope () {
  return useContext(SearchScopeContext)
}
