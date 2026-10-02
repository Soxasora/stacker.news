import { useEffect } from 'react'
import { MAX_SEARCH_LENGTH } from '@/lib/constants'
import { joinScope, splitScope } from '@/lib/search'

const SUBS_KEY = 'recentTerritories'
const SEARCHES_KEY = 'recentSearches'
// more than the search shows
const MAX_ENTRIES = 8

// a list kept on this device, newest first
function read (key) {
  try {
    const entries = JSON.parse(window.localStorage.getItem(key))
    return Array.isArray(entries) ? entries : []
  } catch {
    return []
  }
}

function remember (key, entry) {
  try {
    const same = entry.toLowerCase()
    const entries = [entry, ...read(key).filter(other => other.toLowerCase() !== same)].slice(0, MAX_ENTRIES)
    window.localStorage.setItem(key, JSON.stringify(entries))
  } catch {}
}

// the names of the territories opened last
export const recentSubs = () => read(SUBS_KEY)

// the last searches, each is the whole q with its ~territory and @stacker
export const recentSearches = () => read(SEARCHES_KEY)

export function clearRecentSearches () {
  try {
    window.localStorage.removeItem(SEARCHES_KEY)
  } catch {}
}

export function useRememberSub (name) {
  useEffect(() => {
    if (name) remember(SUBS_KEY, name)
  }, [name])
}

export function useRememberSearch (q) {
  useEffect(() => {
    if (!q) return
    // written the way the bar would, so the same search isn't kept twice
    const { scope, text } = splitScope(q)
    const search = joinScope(scope, text)
    if (search && search.length <= MAX_SEARCH_LENGTH) remember(SEARCHES_KEY, search)
  }, [q])
}
