import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useQuery } from '@apollo/client/react'
import { Form } from '@/components/form'
import Badge from '@/components/ui/badge'
import {
  Autocomplete, AutocompletePopup, AutocompleteList, AutocompleteGroupLabel, AutocompleteSeparator,
  AutocompleteItem, AutocompleteTiles, AutocompleteTile, autocompleteStatusClasses
} from '@/components/ui/autocomplete'
import SubPreviewCard from '@/components/sub-preview-card'
import { SearchTitle } from '@/components/item'
import { NAV_SEARCH_POSTS, NAV_SEARCH_NAMES } from '@/fragments/search'
import { abbrNum, numWithUnits } from '@/lib/format'
import { cn } from '@/lib/cn'
import SearchIcon from '@/svgs/search-line.svg'
import CloseIcon from '@/svgs/close-line.svg'
import ClockCounterWiseIcon from '@/svgs/clock-counter-wise.svg'
import Moon from '@/svgs/moon-fill.svg'
import { BROWSE } from './search-mocks'
import { useSearchScope, parseSearch, toSearchQ } from './search-scope'
import styles from './search.module.css'
import { PUBLIC_MEDIA_URL } from '@/lib/constants'
import ItemPreviewCard from '@/components/item-preview-card'

const MIN_QUERY = 2
const MAX_QUERY = 100 // same as searchSchema
const LIMIT = 3
// when only stackers or only territories show
const NAMES_LIMIT = 8
const DEBOUNCE_MS = 500
const NO_ROWS = []

// returns '' if the query is too short
function toQuery (value) {
  const q = value.trim().slice(0, MAX_QUERY)
  return q.length >= MIN_QUERY ? q : ''
}

// typing @ or ~ looks up only stackers or only territories
const NAME_LOOKUPS = {
  '@': { mode: 'stackers', kind: 'stacker', scopeKey: 'user' },
  '~': { mode: 'territories', kind: 'territory', scopeKey: 'sub' }
}

// the word the cursor is in
function wordAt (value, caret) {
  let start = Math.min(caret, value.length)
  let end = start
  while (start > 0 && /\S/.test(value[start - 1])) start--
  while (end < value.length && /\S/.test(value[end])) end++
  return { start, end, word: value.slice(start, end) }
}

// words that could be the name of a stacker or territory
function plainWords (text) {
  return text.replace(/"/g, '').split(/\s+/).filter(word => word && !/^([@~]|url:)/.test(word)).join(' ')
}

function toWhere ({ sub, user }) {
  return [sub && `in ~${sub}`, user && `by @${user}`].filter(Boolean).join(' ')
}

// what to look up for the text and the cursor position. key changes when the lookup does
function toLookup (scope, value, caret) {
  const { start, end, word } = wordAt(value, caret)
  const names = NAME_LOOKUPS[word[0]]
  if (names) return { ...names, prefix: word[0], name: word.slice(1), start, end, key: names.mode + word }

  const text = toQuery(value)
  if (!text) return { mode: 'browse', key: 'browse' }
  // the server also filters by a ~territory or @nym left in the text
  const typed = parseSearch(text).scope
  const q = toSearchQ(scope, text).slice(0, MAX_QUERY)
  return {
    mode: 'search',
    text,
    q,
    names: plainWords(text),
    where: toWhere({ sub: scope.sub ?? typed.sub, user: scope.user ?? typed.user }),
    key: `search ${q}`
  }
}

// same shape as the mocks: value is the link and key, label is the text Base UI
// uses for the item, meta is the text on the right
function toSearchGroups (data, where) {
  const posts = (data.search?.items ?? []).map(item => ({
    value: `/items/${item.id}`,
    type: 'post',
    id: item.id,
    label: item.title,
    title: item.searchTitle ? <SearchTitle title={item.searchTitle} /> : item.title,
    meta: [
      item.sub?.name && `~${item.sub.name}`,
      numWithUnits(item.sats),
      numWithUnits(item.ncomments, { unitSingular: 'comment', unitPlural: 'comments' })
    ].filter(Boolean).join(' \\ ')
  }))
  const stackers = (data.searchUsers ?? []).map(user => ({
    value: `/${user.name}`,
    type: 'stacker',
    name: user.name,
    label: `@${user.name}`,
    photoId: user.photoId,
    meta: user.optional?.stacked != null ? `${abbrNum(user.optional.stacked)} stacked` : ''
  }))
  // territory post counts need a time range, so we only show the name
  const territories = (data.subSuggestions ?? []).map(sub => ({
    value: `/~${sub.name}`,
    type: 'territory',
    name: sub.name,
    label: `~${sub.name}`,
    meta: numWithUnits(sub.nitems, { unitSingular: 'post', unitPlural: 'posts' })
  }))
  return [
    { value: 'posts', label: where ? `posts ${where}` : 'posts', items: posts },
    { value: 'stackers', label: 'stackers', items: stackers },
    { value: 'territories', layout: 'tiles', label: 'territories', items: territories }
  ].filter(group => group.items.length > 0)
}

// keep showing the last results while the next ones load, as long as they are
// for the same kind of lookup. we don't use Apollo's previousData because it
// survives skip, so results from before the input was cleared would show up again
function useLastData (result, kind) {
  const last = useRef({})
  if (last.current.kind !== kind) last.current = { kind }
  if (kind && result.data) last.current.data = result.data
  return last.current.data
}

// keep focus in the input so the popup stays open
const keepFocus = event => event.preventDefault()

function LabelControl ({ onClick, children }) {
  return <button type='button' className='ms-auto font-normal' onMouseDown={keepFocus} onClick={onClick}>{children}</button>
}

// a territory or stacker the search is limited to
function Chip ({ prefix, name, onRemove }) {
  return (
    <span className={cn(styles.chip, 'flex items-center gap-1 min-w-0 max-w-40 h-6 ps-2 pe-1 -ms-1 rounded-sm text-xs font-bold')} onMouseDown={keepFocus}>
      <span className='truncate' title={`${prefix}${name}`}><span className='text-muted font-normal'>{prefix}</span>{name}</span>
      <button type='button' aria-label={`remove ${prefix}${name}`} className={cn(styles.clear, 'flex shrink-0')} onClick={onRemove}>
        <CloseIcon width={12} height={12} />
      </button>
    </span>
  )
}

function Kbd ({ children }) {
  return <kbd className={cn(styles.kbd, 'px-1 py-0.5')}>{children}</kbd>
}

function RowContent ({ item }) {
  return (
    <>
      <span className='grow min-w-0 truncate'>
        {item.title ?? item.label}
        {item.nsfw && <Badge variant='secondary' className='ms-1'>nsfw</Badge>}
      </span>
      {item.meta && <span className='shrink-0 text-xs text-muted'>{item.meta}</span>}
    </>
  )
}

const userPhotoSrc = user => user.photoId ? `${PUBLIC_MEDIA_URL}/${user.photoId}` : '/dorian400.jpg'

function Row ({ item, onPick }) {
  const recent = item.type === 'recent'
  const post = item.type === 'post'
  const user = item.type === 'stacker'
  const search = item.type === 'search'
  return (
    <AutocompleteItem
      value={item}
      render={<Link href={item.value} />}
      onClick={() => onPick(item)}
      className={cn(item.muted && 'opacity-50', recent && 'items-center')}
    >
      {recent && <ClockCounterWiseIcon width={16} height={16} className='text-muted' aria-hidden />}
      {user && <img src={userPhotoSrc(item)} width={16} height={16} className={cn(styles.userimg, 'shrink-0 self-center')} />}
      {search && <SearchIcon width={16} height={16} className='text-muted shrink-0 self-center' aria-hidden />}
      {post
        ? (
          <ItemPreviewCard id={item.id} side='right' className='flex flex-col grow min-w-0'>
            <RowContent item={item} />
          </ItemPreviewCard>
          )
        : <RowContent item={item} />}
    </AutocompleteItem>
  )
}

function TileContent ({ item }) {
  return (
    <>
      <span className='truncate text-sm font-bold'>{item.label}</span>
      <span className='text-xs text-muted'>{item.meta}</span>
    </>
  )
}

function Tile ({ item, onPick }) {
  const territory = item.type === 'territory'
  return (
    <AutocompleteTile
      value={item}
      render={<Link href={item.value} />}
      onClick={() => onPick(item)}
      // padding goes on the preview card trigger so hovering anywhere on the tile opens it
      className={cn(territory && 'p-0')}
    >
      {territory
        ? (
          <SubPreviewCard sub={item.name} className='flex flex-col gap-0.5 min-w-0 py-2.5 px-3'>
            <TileContent item={item} />
          </SubPreviewCard>
          )
        : <TileContent item={item} />}
    </AutocompleteTile>
  )
}

export default function SearchBar ({ className }) {
  const router = useRouter()
  const barRef = useRef(null)
  const inputRef = useRef(null)
  const highlighted = useRef()
  const { scope, text: value, setText, setScope, reset } = useSearchScope()
  // where the cursor is in the text, null when the input isn't focused
  const [caret, setCaret] = useState(null)
  const [open, setOpen] = useState(false)

  const live = useMemo(() => toLookup(scope, value, caret ?? value.length), [scope, value, caret])
  // live after the debounce, used for the queries
  const [settled, setSettled] = useState(live)
  const lastScope = useRef(scope)
  useEffect(() => {
    const scopeChanged = lastScope.current !== scope
    lastScope.current = scope
    if (live.key === settled.key) return
    // don't wait when there's nothing to look up or the scope changed
    if (live.mode === 'browse' || scopeChanged) {
      setSettled(live)
      return
    }
    const timeout = setTimeout(() => setSettled(live), DEBOUNCE_MS)
    return () => clearTimeout(timeout)
  }, [live.key, scope])

  // typing moves the cursor by itself, this is for when we change the text
  useEffect(() => {
    const input = inputRef.current
    if (caret !== null && document.activeElement === input && input.selectionStart !== caret) {
      input.setSelectionRange(caret, caret)
    }
  }, [value, caret])

  const names = settled.mode === 'search' ? settled.names : settled.name
  const withUsers = settled.mode !== 'territories' && !!names
  const withSubs = settled.mode === 'territories' || (settled.mode === 'search' && !!names)
  const postsOff = settled.mode !== 'search'
  const namesOff = !withUsers && !withSubs
  // only the open bar runs the queries, there's more than one bar on the page.
  // no-cache so these results don't end up in the search and stackers page caches
  const postsQuery = useQuery(NAV_SEARCH_POSTS, {
    variables: { q: settled.q, limit: LIMIT },
    skip: !open || postsOff,
    fetchPolicy: 'no-cache'
  })
  const namesQuery = useQuery(NAV_SEARCH_NAMES, {
    variables: { userQ: names ?? '', withUsers, subQ: names ?? '', withSubs, limit: settled.kind ? NAMES_LIMIT : LIMIT },
    skip: !open || namesOff,
    fetchPolicy: 'no-cache'
  })

  const postData = useLastData(postsQuery, !postsOff && settled.mode)
  const nameData = useLastData(namesQuery, !namesOff && settled.mode)
  // results for stackers don't belong under a search and the other way around
  const sameMode = settled.mode === live.mode
  const searchGroups = useMemo(
    () => toSearchGroups(sameMode ? { ...postData, ...nameData } : {}, settled.where),
    [sameMode, postData, nameData, settled.where])

  // keep the filters when searching again from the search page
  const searchHref = useCallback(q => {
    const { what, sort, when, from, to } = router.pathname === '/search' ? router.query : {}
    const params = Object.entries({ q, what, sort, when, from, to }).filter(([, param]) => param && typeof param === 'string')
    return `/search?${new URLSearchParams(params)}`
  }, [router.pathname, router.query])

  const searchRows = useMemo(() => {
    if (live.mode !== 'search') return []
    const { text } = live
    const where = toWhere(scope)
    return [
      where && { value: searchHref(live.q), type: 'search', label: `search ${text} ${where}`, title: <>search <b>{text}</b> {where}</> },
      { value: searchHref(text), type: 'search', label: `search ${text} everywhere`, title: <>search <b>{text}</b> everywhere</> }
    ].filter(Boolean)
  }, [live, scope, searchHref])

  // too short to search shows recent searches and territories instead,
  // a cursor in an @nym or ~territory shows only stackers or only territories
  const groups = live.mode === 'browse'
    ? BROWSE
    : live.mode === 'search'
      ? [{ value: 'search', items: searchRows }, ...searchGroups]
      : searchGroups.filter(group => group.value === live.mode)

  // count the debounce wait as loading too, so the popup doesn't open with only the footer
  const waiting = live.key !== settled.key
  const postsPending = live.mode === 'search' && (postsQuery.loading || waiting)
  const namesPending = live.mode !== 'browse' && (namesQuery.loading || waiting)
  const pending = postsPending || namesPending
  // names usually load first, so a search keeps showing searching… until posts arrive
  const found = live.mode === 'search' ? searchGroups.some(group => group.value === 'posts') : groups.length > 0
  const searching = pending && !found
  // each group shows a spinner until its query is done
  const groupPending = { posts: postsPending, stackers: namesPending, territories: namesPending }

  // a press on a chip or its remove button is outside for base ui, stay open
  const onOpenChange = useCallback((next, details) => {
    if (!next && details.reason === 'outside-press' && barRef.current?.contains(details.event.target)) return
    setOpen(next)
  }, [])

  const onValueChange = useCallback(next => {
    setText(next)
    setCaret(inputRef.current?.selectionStart ?? next.length)
  }, [setText])

  // rows are links and handle navigation, we just close. a search shows up in
  // the bar of the search page, anything else starts over
  const onPick = useCallback(item => {
    setOpen(false)
    if (item?.type !== 'search' && item?.type !== 'recent') reset()
  }, [reset])

  const search = useCallback(() => {
    const q = toSearchQ(scope, value).slice(0, MAX_QUERY)
    if (!q) return
    setOpen(false)
    router.push(searchHref(q))
  }, [scope, value, router, searchHref])

  const removeScope = useCallback(scopeKey => {
    setScope({ [scopeKey]: undefined })
    inputRef.current?.focus()
  }, [setScope])

  // base ui keeps the number of the highlighted row when the rows change, so
  // after tab on the second stacker the second search row would be highlighted.
  // it forgets the number when there are no rows, so we show none for one render
  const [noRows, setNoRows] = useState(false)
  useLayoutEffect(() => {
    if (noRows) setNoRows(false)
  }, [noRows])

  // tab adds a stacker or territory from the list to the scope
  const scopable = live.kind && open ? groups[0]?.items ?? [] : []
  // what it would replace
  const scopeNow = live.kind && scope[live.scopeKey] && live.prefix + scope[live.scopeKey]

  const onKeyDown = event => {
    const input = event.currentTarget
    if (event.key === 'Tab' && !event.shiftKey && scopable.length > 0) {
      event.preventDefault()
      // the highlighted one, or the first when none is
      const item = scopable.find(item => item.value === highlighted.current?.value) ?? scopable[0]
      // the word becomes a chip, so take it out of the text
      const next = (value.slice(0, live.start) + value.slice(live.end)).replace(/\s+/g, ' ').trimStart()
      setScope({ [live.scopeKey]: item.name })
      setText(next)
      setCaret(Math.min(live.start, next.length))
      setNoRows(true)
    } else if (event.key === 'Backspace' && input.selectionStart === 0 && input.selectionEnd === 0) {
      // backspace at the start of the text removes the last chip
      const last = scope.user ? 'user' : scope.sub ? 'sub' : undefined
      if (!last) return
      event.preventDefault()
      setScope({ [last]: undefined })
    }
  }

  return (
    <Form initial={{}} onSubmit={search}>
      <Autocomplete.Root
        // always: also highlight the first row when the rows change without typing
        autoHighlight={live.mode === 'browse' ? true : 'always'}
        keepHighlight
        items={noRows ? NO_ROWS : groups}
        value={value}
        onValueChange={onValueChange}
        onItemHighlighted={item => { highlighted.current = item }}
        open={open}
        onOpenChange={onOpenChange}
        openOnInputClick
        mode='none' // disables base ui filtering
      >
        <div ref={barRef} className={cn(styles.bar, 'relative grow min-w-0 flex items-center gap-2 px-2 rounded-md', className)}>
          {scope.sub && <Chip prefix='~' name={scope.sub} onRemove={() => removeScope('sub')} />}
          {scope.user && <Chip prefix='@' name={scope.user} onRemove={() => removeScope('user')} />}
          <Autocomplete.Input
            ref={inputRef}
            name='q'
            placeholder='search whatever'
            className={cn(styles.input, 'grow min-w-0 text-base py-0.5')}
            onKeyDown={onKeyDown}
            onSelect={event => setCaret(event.currentTarget.selectionStart)}
            onBlur={() => setCaret(null)}
          />
          {/* hidden instead of removed so the bar doesn't jump */}
          <span className={cn('shrink-0 flex items-center gap-2', !value && 'invisible')}>
            <span aria-hidden className={cn(styles.divider, 'w-px h-4')} />
            <Autocomplete.Clear keepMounted aria-label='clear search' className={cn(styles.clear, 'flex')}>
              <CloseIcon width={14} height={14} />
            </Autocomplete.Clear>
          </span>
          <button type='submit' aria-label='search' className={cn(styles.submit, 'shrink-0 flex')} onMouseDown={keepFocus}>
            <SearchIcon width={16} height={16} aria-hidden />
          </button>
        </div>

        {/* no bottom padding and overflow hidden so the footer background reaches the edges */}
        <AutocompletePopup anchor={barRef} positionMethod='fixed' className={cn(styles.popup, 'md:min-w-lg pb-0 overflow-hidden')}>
          <Autocomplete.Status>
            {searching && <div className={autocompleteStatusClasses()}>searching…</div>}
          </Autocomplete.Status>
          <Autocomplete.Empty>
            {live.kind && !pending && (
              <div className={autocompleteStatusClasses()}>
                {live.name ? `no ${live.kind} called ${live.prefix}${live.name}` : `type the name of a ${live.kind}`}
              </div>
            )}
          </Autocomplete.Empty>
          <AutocompleteList>
            {(group, index) => (
              <Autocomplete.Group key={group.value} items={group.items}>
                {index > 0 && <AutocompleteSeparator invisible />}
                {group.label && (
                  <AutocompleteGroupLabel className='flex items-center gap-2'>
                    {group.label}
                    {groupPending[group.value] && <Moon className='spin shrink-0' width={12} height={12} aria-hidden />}
                    {group.value === 'recent' && <LabelControl onClick={() => console.log('clear')}>clear</LabelControl>}
                    {group.toggle && (
                      <LabelControl onClick={() => console.log('toggle')}>
                        {group.toggle.expanded ? 'show less' : `show all (${group.toggle.total})`}
                      </LabelControl>
                    )}
                  </AutocompleteGroupLabel>
                )}
                {group.layout === 'tiles'
                  ? (
                    <AutocompleteTiles>
                      <Autocomplete.Collection>
                        {item => <Tile key={item.value} item={item} onPick={onPick} />}
                      </Autocomplete.Collection>
                    </AutocompleteTiles>
                    )
                  : (
                    <Autocomplete.Collection>
                      {item => <Row key={item.value} item={item} onPick={onPick} />}
                    </Autocomplete.Collection>
                    )}
              </Autocomplete.Group>
            )}
          </AutocompleteList>
          {/* side by side when there's room, stacked when not */}
          <div className={cn(styles.footer, 'mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-2 text-xs text-muted')}>
            {live.mode === 'browse' && <Link href='/territory' className='whitespace-nowrap text-muted' onClick={() => onPick()}>create a territory</Link>}
            {live.mode === 'search' && <span className='whitespace-nowrap'>press <Kbd>↵</Kbd> for all results</span>}
            {live.kind && (
              <span className='whitespace-nowrap'>
                <Kbd>↵</Kbd> open {live.kind === 'stacker' ? 'profile' : 'territory'}
                {scopable.length > 0 && <> <Kbd>tab</Kbd> {scopeNow ? `replace ${scopeNow}` : 'add to scope'}</>}
              </span>
            )}
            <span className='whitespace-nowrap'><Kbd>~</Kbd> territory <Kbd>@</Kbd> stackers</span>
          </div>
        </AutocompletePopup>
      </Autocomplete.Root>
    </Form>
  )
}
