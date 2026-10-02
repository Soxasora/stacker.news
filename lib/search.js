export const SEARCH_PATH = '/search'
export const USER_SEARCH_PATH = '/stackers/search'

export const isSearchPath = pathname => pathname === SEARCH_PATH || pathname === USER_SEARCH_PATH

// the link to a search. from a search page it stays on that page and keeps its filters
export function searchHref (q, { pathname, query = {} } = {}) {
  if (pathname === USER_SEARCH_PATH) return `${USER_SEARCH_PATH}?${new URLSearchParams({ q })}`
  const { what, sort, when, from, to } = pathname === SEARCH_PATH ? query : {}
  const params = Object.entries({ q, what, sort, when, from, to }).filter(([, param]) => param && typeof param === 'string')
  return `${SEARCH_PATH}?${new URLSearchParams(params)}`
}

// the two filters the search bar shows as chips, and the prefix each has in q
export const SCOPES = [{ type: 'sub', prefix: '~' }, { type: 'user', prefix: '@' }]

const DOUBLE_QUOTE_VARIANTS = [
  '\u201C', // left double quotation mark
  '\u201D', // right double quotation mark
  '\u201E', // double low-9 quotation mark
  '\u201F', // double high-reversed-9 quotation mark
  '\u00AB', // left-pointing double angle quotation mark
  '\u00BB', // right-pointing double angle quotation mark
  '\uFF02', // fullwidth quotation mark
  '\u300C', // left corner bracket
  '\u300D', // right corner bracket
  '\u300E', // left white corner bracket
  '\u300F', // right white corner bracket
  '\u301D', // reversed double prime quotation mark
  '\u301E', // double prime quotation mark
  '\u301F' // low double prime quotation mark
]

const SMART_DOUBLE_QUOTES_REGEX = new RegExp(`[${DOUBLE_QUOTE_VARIANTS.join('')}]`, 'g')

function phraseRegex () {
  return /"([^"]*)"/gm
}

function normalizeSearchQuery (q = '') {
  if (typeof q !== 'string') return ''
  // Normalize common Unicode double-quote variants so phrase parsing can
  // treat them all like ASCII double quotes.
  return q.replace(SMART_DOUBLE_QUOTES_REGEX, '"')
}

// what the search resolver does with q: quoted phrases must match, the first
// @nym, ~territory and url: outside quotes are filters, the rest are the words
export function queryParts (q = '') {
  const normalized = normalizeSearchQuery(q)
  const quotes = [...normalized.matchAll(phraseRegex())]
    .map(m => m[1])
    .filter(quote => quote.trim().length > 0)
  const queryArr = normalized.replace(phraseRegex(), ' ').trim().split(/\s+/).filter(Boolean)
  const url = queryArr.find(word => word.startsWith('url:'))
  const nym = queryArr.find(word => word.startsWith('@'))
  const territory = queryArr.find(word => word.startsWith('~'))
  const exclude = [url, nym, territory]
  const query = queryArr.filter(word => !exclude.includes(word)).join(' ')

  return {
    quotes,
    nym,
    url,
    territory,
    query
  }
}

// takes the ~territory and @nym filters out of q, for the search bar to show
// them as chips. the rest keeps its order. a ~ or @ without a name is not a filter
export function splitScope (q = '') {
  const { nym, territory } = queryParts(q)
  const scope = { sub: territory?.slice(1) || undefined, user: nym?.slice(1) || undefined }
  const filters = [scope.sub && territory, scope.user && nym].filter(Boolean)
  // splitting on phrases puts them at the odd positions, they stay as they are
  const text = normalizeSearchQuery(q).split(/("[^"]*")/).map((part, i) => {
    if (i % 2) return part
    return part.split(/(\s+)/).filter(word => {
      const at = filters.indexOf(word)
      if (at >= 0) filters.splice(at, 1)
      return at < 0
    }).join('')
  }).join('').replace(/\s+/g, ' ').trim()
  return { scope, text }
}

// the opposite of splitScope. the scope goes first because the first
// ~territory and @nym are the ones that filter
export function joinScope (scope = {}, text = '') {
  return [...SCOPES.map(({ type, prefix }) => scope[type] && prefix + scope[type]), text.trim()].filter(Boolean).join(' ')
}
