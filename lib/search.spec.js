/* eslint-env jest */

import { queryParts, splitScope, joinScope, isSearchPath, searchHref } from './search.js'

const partsCases = [
  ['bitcoin mining', { quotes: [], nym: undefined, url: undefined, territory: undefined, query: 'bitcoin mining' }],
  ['~bitcoin @k00b url:stacker.news "exact phrase" lightning', {
    quotes: ['exact phrase'], nym: '@k00b', url: 'url:stacker.news', territory: '~bitcoin', query: 'lightning'
  }],
  // only the first of each kind is a filter
  ['~bitcoin ~tech @a @b foo', { quotes: [], nym: '@a', url: undefined, territory: '~bitcoin', query: '~tech @b foo' }],
  // smart quotes count as quotes
  ['\u201Cexact phrase\u201D foo', { quotes: ['exact phrase'], nym: undefined, url: undefined, territory: undefined, query: 'foo' }],
  // filters inside quotes are part of the phrase
  ['"~bitcoin @k00b" foo', { quotes: ['~bitcoin @k00b'], nym: undefined, url: undefined, territory: undefined, query: 'foo' }],
  ['', { quotes: [], nym: undefined, url: undefined, territory: undefined, query: '' }]
]

describe('queryParts', () => {
  test.each(partsCases)('parses %p', (q, expected) => {
    expect(queryParts(q)).toEqual(expected)
  })
})

const splitCases = [
  ['', {}, ''],
  ['lightning', {}, 'lightning'],
  ['~bitcoin @k00b lightning', { sub: 'bitcoin', user: 'k00b' }, 'lightning'],
  // the rest keeps its order
  ['"exact phrase" channel ~bitcoin url:example.com', { sub: 'bitcoin' }, '"exact phrase" channel url:example.com'],
  ['channel @k00b jamming', { user: 'k00b' }, 'channel jamming'],
  // only the first of each kind is taken out
  ['~bitcoin ~tech foo ~bitcoin', { sub: 'bitcoin' }, '~tech foo ~bitcoin'],
  // not a filter inside quotes
  ['"~bitcoin @k00b" foo', {}, '"~bitcoin @k00b" foo'],
  ['\u201Ca ~bitcoin b\u201D ~tech', { sub: 'tech' }, '"a ~bitcoin b"'],
  // a prefix without a name is the first of its kind for the resolver, so nothing is a filter
  ['@ foo @k00b', {}, '@ foo @k00b'],
  ['~ foo', {}, '~ foo'],
  // a word right after a phrase is still a word
  ['"a b"@k00b foo', { user: 'k00b' }, '"a b" foo']
]

describe('splitScope', () => {
  test.each(splitCases)('splits %p', (q, scope, text) => {
    const result = splitScope(q)
    expect(result.text).toBe(text)
    expect(result.scope).toEqual({ sub: undefined, user: undefined, ...scope })
  })

  test.each(splitCases)('the resolver filters %p the same after a round trip', (q) => {
    const { scope, text } = splitScope(q)
    const before = queryParts(q)
    const after = queryParts(joinScope(scope, text))
    expect(after.territory?.slice(1) || undefined).toBe(before.territory?.slice(1) || undefined)
    expect(after.nym?.slice(1) || undefined).toBe(before.nym?.slice(1) || undefined)
    expect(after.quotes).toEqual(before.quotes)
    expect(after.url).toBe(before.url)
  })
})

describe('joinScope', () => {
  test.each([
    [{ sub: 'bitcoin', user: 'k00b' }, ' lightning ', '~bitcoin @k00b lightning'],
    [{ user: 'k00b' }, '', '@k00b'],
    [{}, 'lightning', 'lightning'],
    [undefined, undefined, '']
  ])('joins %p and %p', (scope, text, expected) => {
    expect(joinScope(scope, text)).toBe(expected)
  })
})

describe('isSearchPath', () => {
  test.each([
    ['/search', true],
    ['/stackers/search', true],
    ['/', false],
    ['/~/top/stackers/[when]', false]
  ])('%p is %p', (pathname, expected) => {
    expect(isSearchPath(pathname)).toBe(expected)
  })
})

describe('searchHref', () => {
  test.each([
    ['~bitcoin foo', undefined, '/search?q=%7Ebitcoin+foo'],
    ['foo', { pathname: '/', query: { sort: 'sats' } }, '/search?q=foo'],
    // a search page keeps its filters
    ['foo', { pathname: '/search', query: { q: 'bar', sort: 'sats', when: 'year', other: 'x' } }, '/search?q=foo&sort=sats&when=year'],
    ['foo', { pathname: '/stackers/search', query: { q: 'bar', what: 'stackers' } }, '/stackers/search?q=foo']
  ])('links %p from %p', (q, router, expected) => {
    expect(searchHref(q, router)).toBe(expected)
  })
})
