import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { SEARCH_PATH, isSearchPath, splitScope } from '@/lib/search'
import { useRememberSearch, useRememberSub } from './recent'

const SearchStateContext = createContext()

// the chips (scope) and the text of the search bar, shared by every bar on the page
export function SearchStateProvider ({ sub, user, children }) {
  const router = useRouter()
  const q = isSearchPath(router.pathname) && typeof router.query.q === 'string' ? router.query.q : undefined
  // what the bar starts with: the current search on a search page, the page's
  // territory and stacker everywhere else
  const page = useMemo(() => q === undefined ? { scope: { sub, user }, text: '' } : splitScope(q), [q, sub, user])
  // the territory whose pages we're on. a post has a sub too, that doesn't count
  const pageSub = router.pathname.startsWith('/~') ? sub : undefined
  // every page passes its territory to this provider and every search ends up
  // on the search page, so both are remembered here. a recent search opens the
  // posts search, so the stackers search isn't remembered
  useRememberSub(pageSub)
  useRememberSearch(router.pathname === SEARCH_PATH ? q : undefined)

  const [state, setState] = useState({ page, ...page })
  // start over when the page's search changes
  if (state.page !== page) setState({ page, ...page })

  const setText = useCallback(text => setState(state => ({ ...state, text })), [])
  // pass undefined to remove a territory or stacker
  const setScope = useCallback(scope => setState(state => ({ ...state, scope: { ...state.scope, ...scope } })), [])
  const reset = useCallback(() => setState(state => ({ ...state, ...state.page })), [])

  const { scope, text } = state
  const value = useMemo(() => ({ scope, text, pageSub, setText, setScope, reset }), [scope, text, pageSub, setText, setScope, reset])
  return <SearchStateContext.Provider value={value}>{children}</SearchStateContext.Provider>
}

export function useSearchState () {
  return useContext(SearchStateContext)
}
