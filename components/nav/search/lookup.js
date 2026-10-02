import { useEffect, useState } from 'react'
import { MAX_SEARCH_LENGTH } from '@/lib/constants'
import { SCOPES, joinScope, splitScope } from '@/lib/search'

const MIN_LENGTH = 2
const DEBOUNCE_MS = 500

// '' when the text is too short to search
function toQuery (text) {
  const query = text.trim().slice(0, MAX_SEARCH_LENGTH)
  return query.length >= MIN_LENGTH ? query : ''
}

function wordAt (text, caret) {
  let start = Math.min(caret, text.length)
  let end = start
  while (start > 0 && /\S/.test(text[start - 1])) start--
  while (end < text.length && /\S/.test(text[end])) end++
  return { start, end, word: text.slice(start, end) }
}

// the words that could be the name of a stacker or territory
function nameWords (text) {
  return text.replace(/"/g, '').split(/\s+/).filter(word => word && !/^([@~]|url:)/.test(word)).join(' ')
}

// 'in ~territory by @stacker'
export function scopeWords ({ sub, user }) {
  return [sub && `in ~${sub}`, user && `by @${user}`].filter(Boolean).join(' ')
}

// what to look up for the text and the cursor in it. there are three modes:
// name: the cursor is in an @nym or ~territory, only stackers or territories show
// browse: the text is too short to search
// search: everything else
// key changes when the lookup does
export function toLookup (scope, text, caret) {
  const scopeQ = joinScope(scope)
  const { start, end, word } = wordAt(text, caret)
  const type = SCOPES.find(({ prefix }) => prefix === word[0])?.type
  if (type) {
    return { mode: 'name', type, prefix: word[0], name: word.slice(1), start, end, scopeQ, key: `name|${scopeQ}|${word}` }
  }

  const query = toQuery(text)
  if (!query) return { mode: 'browse', scopeQ, key: `browse|${scopeQ}` }
  // a ~territory or @nym left in the text filters too
  const typed = splitScope(query).scope
  return {
    mode: 'search',
    text: query,
    q: joinScope(scope, query).slice(0, MAX_SEARCH_LENGTH),
    nameQ: nameWords(query),
    scopeWords: scopeWords({ sub: scope.sub ?? typed.sub, user: scope.user ?? typed.user }),
    typedScope: !!(typed.sub || typed.user),
    scopeQ,
    key: `search|${scopeQ}|${query}`
  }
}

// the lookup after a pause in typing, the queries use this one
export function useDebouncedLookup (lookup) {
  const [debounced, setDebounced] = useState(lookup)
  useEffect(() => {
    // don't wait when there's nothing to look up or the scope changed
    if (lookup.mode === 'browse' || lookup.scopeQ !== debounced.scopeQ) {
      setDebounced(lookup)
      return
    }
    const timeout = setTimeout(() => setDebounced(lookup), DEBOUNCE_MS)
    return () => clearTimeout(timeout)
  }, [lookup.key])
  return debounced
}
