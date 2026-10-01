import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useQuery } from '@apollo/client/react'
import { Dialog } from '@base-ui/react/dialog'
import { Form } from '@/components/form'
import Badge from '@/components/ui/badge'
import {
  Autocomplete, AutocompletePopup, AutocompleteList, AutocompleteGroupLabel, AutocompleteSeparator,
  AutocompleteItem, AutocompleteTiles, AutocompleteTile, autocompleteStatusClasses
} from '@/components/ui/autocomplete'
import SubPreviewCard from '@/components/sub-preview-card'
import { SearchTitle } from '@/components/item'
import { NAV_SEARCH_POSTS, NAV_SEARCH_NAMES, NAV_POPULAR_SUBS } from '@/fragments/search'
import { ACTIVE_SUBS } from '@/fragments/subs'
import { abbrNum, numWithUnits } from '@/lib/format'
import { cn } from '@/lib/cn'
import SearchIcon from '@/svgs/search-line.svg'
import CloseIcon from '@/svgs/close-line.svg'
import ClockCounterWiseIcon from '@/svgs/clock-counter-wise.svg'
import BackArrow from '@/svgs/arrow-left-line.svg'
import ScopeArrow from '@/svgs/arrow-left-up-line.svg'
import Moon from '@/svgs/moon-fill.svg'
import { BROWSE } from './search-mocks'
import { useSearchScope, parseSearch, toSearchQ, recentSubs } from './search-scope'
import styles from './search.module.css'
import { PUBLIC_MEDIA_URL } from '@/lib/constants'
import ItemPreviewCard from '@/components/item-preview-card'

const MIN_QUERY = 2
const MAX_QUERY = 100 // same as searchSchema
const LIMIT = 3
// when only stackers or only territories show
const NAMES_LIMIT = 8
// territories in each group before anything is typed, phones show one per row
const JUMP_LIMIT = 4
const JUMP_LIMIT_PHONE = 3
// some of the popular ones may be in the other group or muted
const POPULAR_LIMIT = 12
const DEBOUNCE_MS = 500
const NO_ROWS = []
// recent searches are still mock data
const RECENT = BROWSE.find(group => group.value === 'recent')

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

// rows of these types can be added to the scope
const SCOPE_KEYS = { stacker: 'user', territory: 'sub' }

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
    label: `~${sub.name}`
  }))
  return [
    { value: 'posts', label: where ? `posts ${where}` : 'posts', items: posts },
    { value: 'stackers', label: 'stackers', items: stackers },
    { value: 'territories', layout: 'tiles', label: 'territories', items: territories }
  ].filter(group => group.items.length > 0)
}

function toTile (sub, meta) {
  return { value: `/~${sub.name}`, type: 'territory', name: sub.name, label: `~${sub.name}`, meta, muted: sub.meMuteSub }
}

// the territories to offer before anything is typed, without the one we're in:
// the ones opened last on this device, and the subscribed ones that aren't among them
function pickSubs (subs = [], visited, here, limit) {
  const byName = new Map(subs.map(sub => [sub.name, sub]))
  // a visited one may be gone by now
  const recent = visited.map(name => byName.get(name)).filter(sub => sub && sub.name !== here).slice(0, limit)
  const taken = new Set([here, ...recent.map(sub => sub.name)])
  const rest = subs.filter(sub => !taken.has(sub.name) && !sub.meMuteSub)
  return { recent, rest, subscribed: rest.filter(sub => sub.meSubscription) }
}

// what shows before anything is typed: recent searches, the recently visited
// territories, and a group that only changes when you do something about it:
// your subscriptions, or the most active territories when there are none
function toBrowseGroups ({ subs = [], picks, popular = [], limit, expanded }) {
  const stable = { value: 'jump', layout: 'tiles', toggle: subs.length > 0 ? { expanded, total: subs.length } : undefined }
  if (expanded) {
    // every territory by name, muted ones last
    const all = [...subs].sort((a, b) => Number(a.meMuteSub) - Number(b.meMuteSub))
    Object.assign(stable, { label: 'all territories', items: all.map(sub => toTile(sub)) })
  } else if (picks.subscribed.length > 0) {
    Object.assign(stable, { label: 'subscribed', items: picks.subscribed.slice(0, limit).map(sub => toTile(sub)) })
  } else {
    const counts = new Map(popular.map(sub => [sub.name, sub.nitems]))
    const items = picks.rest
      .filter(sub => counts.has(sub.name))
      .sort((a, b) => counts.get(b.name) - counts.get(a.name))
      .slice(0, limit)
      .map(sub => toTile(sub, numWithUnits(counts.get(sub.name), { unitSingular: 'post', unitPlural: 'posts' })))
    Object.assign(stable, { label: 'popular', items })
  }
  return [
    RECENT,
    { value: 'visited', label: 'recently visited', layout: 'tiles', items: picks.recent.map(sub => toTile(sub)) },
    stable
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
  return <button type='button' className='ms-auto font-normal pointer-coarse:hitbox-11' onMouseDown={keepFocus} onClick={onClick}>{children}</button>
}

// a territory or stacker the search is limited to
function Chip ({ prefix, name, onRemove }) {
  return (
    <span className={cn(styles.chip, 'flex items-center gap-1 min-w-0 max-w-40 h-6 ps-2 pe-1 -ms-1 rounded-sm text-xs font-bold')} onMouseDown={onRemove && keepFocus}>
      <span className='truncate' title={`${prefix}${name}`}><span className='text-muted font-normal'>{prefix}</span>{name}</span>
      {onRemove && (
        <button type='button' aria-label={`remove ${prefix}${name}`} className={cn(styles.clear, 'flex shrink-0 pointer-coarse:hitbox-8')} onClick={onRemove}>
          <CloseIcon width={12} height={12} />
        </button>
      )}
    </span>
  )
}

function Kbd ({ children }) {
  return <kbd className={cn(styles.kbd, 'px-1 py-0.5')}>{children}</kbd>
}

// ~ territory or @ stackers in the footer, it types the prefix for you
function PrefixHint ({ prefix, onAdd, children }) {
  return (
    <button type='button' className='pointer-coarse:hitbox-11' onMouseDown={keepFocus} onClick={() => onAdd(prefix)}>
      <Kbd>{prefix}</Kbd> {children}
    </button>
  )
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

// adds the stacker or territory of a row to the scope, the row itself opens it.
// the row is a link and can't have a button inside, so this goes next to it
function ScopeButton ({ item, onScope, className }) {
  const label = `add ${item.label} to scope`
  return (
    <button
      type='button'
      // tab on the input does the same for the keyboard
      tabIndex={-1}
      aria-label={label}
      title={label}
      className={cn(styles.scope, 'absolute inset-y-0 end-0 flex items-center justify-center', className)}
      onMouseDown={keepFocus}
      onClick={() => onScope(item)}
    >
      <ScopeArrow width={16} height={16} aria-hidden />
    </button>
  )
}

const userPhotoSrc = user => user.photoId ? `${PUBLIC_MEDIA_URL}/${user.photoId}` : '/dorian400.jpg'

function Row ({ item, onPick, onScope }) {
  const recent = item.type === 'recent'
  const post = item.type === 'post'
  const user = item.type === 'stacker'
  const search = item.type === 'search'
  const row = (
    <AutocompleteItem
      value={item}
      render={<Link href={item.value} />}
      onClick={() => onPick(item)}
      // with a scope button the margins are on the wrapper and the end is left free for the button
      className={cn(item.muted && 'opacity-50', recent && 'items-center', onScope && 'm-0 pe-11 md:pe-9')}
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
  if (!onScope) return row
  return (
    <div role='presentation' className='relative mx-1 mt-0.5'>
      {row}
      <ScopeButton item={item} onScope={onScope} className='w-11 md:w-9' />
    </div>
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

function Tile ({ item, onPick, onScope }) {
  const territory = item.type === 'territory'
  const tile = (
    <AutocompleteTile
      value={item}
      render={<Link href={item.value} />}
      onClick={() => onPick(item)}
      // padding goes on the preview card trigger so hovering anywhere on the tile opens it
      className={cn(item.muted && 'opacity-50', territory && 'p-0', onScope && 'h-full')}
    >
      {territory
        ? (
          <SubPreviewCard sub={item.name} className={cn('flex flex-col gap-0.5 min-w-0 py-2.5 px-3', onScope && 'pe-11 md:pe-8')}>
            <TileContent item={item} />
          </SubPreviewCard>
          )
        : <TileContent item={item} />}
    </AutocompleteTile>
  )
  if (!onScope) return tile
  return (
    <div role='presentation' className='relative min-w-0'>
      {tile}
      <ScopeButton item={item} onScope={onScope} className='w-11 md:w-8' />
    </div>
  )
}

// the bar and its results. the results drop down under the bar, or with inline
// they fill the rest of the full screen search that phones use
function Search ({ className, inline, open, setOpen, inputRef: outerInputRef, autoFocus }) {
  const router = useRouter()
  const barRef = useRef(null)
  const ownInputRef = useRef(null)
  const inputRef = outerInputRef ?? ownInputRef
  const highlighted = useRef()
  const { scope, text: value, pageSub, setText, setScope, reset } = useSearchScope()
  // where the cursor is in the text, null when the input isn't focused
  const [caret, setCaret] = useState(null)
  // show every territory to jump to
  const [expanded, setExpanded] = useState(false)
  // the territories opened last on this device, read again every time the search opens
  const [visited, setVisited] = useState([])
  useEffect(() => {
    if (open) setVisited(recentSubs())
  }, [open])

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

  // the same territories as the post form, so they come from the cache most of the time
  const subsQuery = useQuery(ACTIVE_SUBS, { skip: !open })
  const subs = subsQuery.data?.activeSubs
  const jumpLimit = inline ? JUMP_LIMIT_PHONE : JUMP_LIMIT
  const picks = useMemo(() => pickSubs(subs, visited, pageSub, jumpLimit), [subs, visited, pageSub, jumpLimit])
  // the most active territories stand in when there are no subscriptions to show.
  // once asked for they stay, so opening the search again doesn't fetch them again.
  // no-cache so they don't end up in the cache of the top territories page
  const wantPopular = open && !!subs && picks.subscribed.length === 0
  const [needPopular, setNeedPopular] = useState(false)
  if (wantPopular && !needPopular) setNeedPopular(true)
  const popularQuery = useQuery(NAV_POPULAR_SUBS, {
    variables: { limit: POPULAR_LIMIT },
    skip: !needPopular,
    fetchPolicy: 'no-cache'
  })
  const popular = popularQuery.data?.topSubs?.subs
  const browseGroups = useMemo(
    () => toBrowseGroups({ subs, picks, popular, limit: jumpLimit, expanded }),
    [subs, picks, popular, jumpLimit, expanded])

  // searching again from a search page stays there and keeps its filters
  const searchHref = useCallback(q => {
    if (router.pathname === '/stackers/search') return `/stackers/search?${new URLSearchParams({ q })}`
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
    ? browseGroups
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

  const onOpenChange = useCallback((next, details) => {
    // the inline list is always open, only escape closes the search
    if (inline) {
      if (!next && details.reason === 'escape-key') setOpen(false)
      return
    }
    // a press on a chip or its remove button is outside for base ui, stay open
    if (!next && details.reason === 'outside-press' && barRef.current?.contains(details.event.target)) return
    setOpen(next)
  }, [inline, setOpen])

  const onValueChange = useCallback(next => {
    setText(next)
    setCaret(inputRef.current?.selectionStart ?? next.length)
  }, [setText])

  // rows are links and handle navigation, we just close. a search shows up in
  // the bar of the search page, anything else starts over
  const onPick = useCallback(item => {
    setOpen(false)
    if (item?.type !== 'search' && item?.type !== 'recent') reset()
  }, [setOpen, reset])

  const search = useCallback(() => {
    const q = toSearchQ(scope, value).slice(0, MAX_QUERY)
    if (!q) return
    setOpen(false)
    router.push(searchHref(q))
  }, [scope, value, router, searchHref, setOpen])

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

  // put @ or ~ at the end of the text as a word of its own, in place of one
  // that's already there with nothing after it
  const addPrefix = prefix => {
    const text = value.replace(/(^|\s)[@~]?\s*$/, '')
    const next = text ? `${text} ${prefix}` : prefix
    setText(next)
    setCaret(next.length)
    inputRef.current?.focus()
  }

  // make a stacker or territory from the list a chip
  const addScope = item => {
    // when it's the one being typed the word becomes the chip, so take it out of the text
    if (live.kind === item.type) {
      const next = (value.slice(0, live.start) + value.slice(live.end)).replace(/\s+/g, ' ').trimStart()
      setText(next)
      setCaret(Math.min(live.start, next.length))
    }
    setScope({ [SCOPE_KEYS[item.type]]: item.name })
    setNoRows(true)
    inputRef.current?.focus()
  }

  // rows that aren't the scope already get a button for it
  const scopeButton = item => {
    const scopeKey = SCOPE_KEYS[item.type]
    return scopeKey && scope[scopeKey]?.toLowerCase() !== item.name.toLowerCase() ? addScope : undefined
  }

  const onKeyDown = event => {
    const input = event.currentTarget
    if (event.key === 'Tab' && !event.shiftKey && scopable.length > 0) {
      event.preventDefault()
      // the highlighted one, or the first when none is
      addScope(scopable.find(item => item.value === highlighted.current?.value) ?? scopable[0])
    } else if (event.key === 'Backspace' && input.selectionStart === 0 && input.selectionEnd === 0) {
      // backspace at the start of the text removes the last chip
      const last = scope.user ? 'user' : scope.sub ? 'sub' : undefined
      if (!last) return
      event.preventDefault()
      setScope({ [last]: undefined })
    }
  }

  const bar = (
    <div ref={barRef} className={cn(styles.bar, 'relative grow min-w-0 flex items-center gap-2 px-2 rounded-md', className)}>
      {scope.sub && <Chip prefix='~' name={scope.sub} onRemove={() => removeScope('sub')} />}
      {scope.user && <Chip prefix='@' name={scope.user} onRemove={() => removeScope('user')} />}
      <Autocomplete.Input
        ref={inputRef}
        name='q'
        placeholder='search whatever'
        enterKeyHint='search'
        autoFocus={autoFocus}
        // basis-0 so the chips keep their width and the input takes what's left
        className={cn(styles.input, 'grow basis-0 min-w-16 text-base max-md:text-touch py-0.5')}
        onKeyDown={onKeyDown}
        onSelect={event => setCaret(event.currentTarget.selectionStart)}
        onBlur={() => setCaret(null)}
      />
      {/* hidden instead of removed so the bar doesn't jump */}
      <span className={cn('shrink-0 flex items-center gap-2', !value && 'invisible')}>
        <span aria-hidden className={cn(styles.divider, 'w-px h-4')} />
        <Autocomplete.Clear keepMounted aria-label='clear search' className={cn(styles.clear, 'flex pointer-coarse:hitbox-8')}>
          <CloseIcon width={14} height={14} />
        </Autocomplete.Clear>
      </span>
      <button type='submit' aria-label='search' className={cn(styles.submit, 'shrink-0 flex')} onMouseDown={keepFocus}>
        <SearchIcon width={16} height={16} aria-hidden />
      </button>
    </div>
  )

  const results = (
    <>
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
                  <LabelControl onClick={() => setExpanded(expanded => !expanded)}>
                    {group.toggle.expanded ? 'show less' : `show all (${group.toggle.total})`}
                  </LabelControl>
                )}
              </AutocompleteGroupLabel>
            )}
            {group.layout === 'tiles'
              ? (
                <AutocompleteTiles>
                  <Autocomplete.Collection>
                    {item => <Tile key={item.value} item={item} onPick={onPick} onScope={scopeButton(item)} />}
                  </Autocomplete.Collection>
                </AutocompleteTiles>
                )
              : (
                <Autocomplete.Collection>
                  {item => <Row key={item.value} item={item} onPick={onPick} onScope={scopeButton(item)} />}
                </Autocomplete.Collection>
                )}
          </Autocomplete.Group>
        )}
      </AutocompleteList>
    </>
  )

  const footer = (
    // side by side when there's room, stacked when not
    <div className={cn(styles.footer, 'flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-2 text-xs text-muted', inline ? 'mt-auto' : 'mt-3')}>
      {live.mode === 'browse' && <Link href='/territory' className='whitespace-nowrap text-muted' onClick={() => onPick()}>create a territory</Link>}
      {live.mode === 'search' && <span className='whitespace-nowrap'>press <Kbd>↵</Kbd> for all results</span>}
      {live.kind && (
        <span className='whitespace-nowrap'>
          <Kbd>↵</Kbd> open {live.kind === 'stacker' ? 'profile' : 'territory'}
          {/* phones have no tab key, they use the arrow on the row */}
          {!inline && scopable.length > 0 && <> <Kbd>tab</Kbd> {scopeNow ? `replace ${scopeNow}` : 'add to scope'}</>}
        </span>
      )}
      <span className='whitespace-nowrap'>
        <PrefixHint prefix='~' onAdd={addPrefix}>territory</PrefixHint> <PrefixHint prefix='@' onAdd={addPrefix}>stackers</PrefixHint>
      </span>
    </div>
  )

  return (
    <Form initial={{}} onSubmit={search} className={inline ? 'flex flex-col h-full' : undefined}>
      <Autocomplete.Root
        // always: also highlight the first row when the rows change without typing
        autoHighlight={live.mode === 'browse' ? true : 'always'}
        keepHighlight
        items={noRows ? NO_ROWS : groups}
        value={value}
        onValueChange={onValueChange}
        onItemHighlighted={item => { highlighted.current = item }}
        inline={inline}
        open={open}
        onOpenChange={onOpenChange}
        openOnInputClick
        mode='none' // disables base ui filtering
      >
        {inline
          ? (
            <>
              <div className='flex items-center gap-2 px-safe-gutter py-2'>
                <Dialog.Close aria-label='close search' className={cn(styles.submit, 'shrink-0 flex')}>
                  <BackArrow width={24} height={24} />
                </Dialog.Close>
                {bar}
              </div>
              {/* only the results scroll, and reaching their end doesn't scroll the page behind */}
              <div className={cn(styles.results, 'grow min-h-0 overflow-y-auto overscroll-contain touch-pan-y')}>
                {/* the footer is at the bottom of what's visible, or after the results when they're longer */}
                <div className='min-h-full flex flex-col gap-3 pt-1.5'>
                  <div>{results}</div>
                  {footer}
                </div>
              </div>
            </>
            )
          : (
            <>
              {bar}
              {/* no bottom padding and overflow hidden so the footer background reaches the edges */}
              <AutocompletePopup anchor={barRef} positionMethod='fixed' className={cn(styles.popup, 'md:min-w-lg pb-0 overflow-hidden')}>
                {results}
                {footer}
              </AutocompletePopup>
            </>
            )}
      </Autocomplete.Root>
    </Form>
  )
}

export default function SearchBar ({ className, autoFocus }) {
  const [open, setOpen] = useState(false)
  return <Search className={className} open={open} setOpen={setOpen} autoFocus={autoFocus} />
}

// the keyboard and the browser's toolbar cover the bottom of the page instead of
// making it shorter. the full screen search stays full screen, this tells it
// how much of it is covered so the results can fade out there
function KeyboardInset ({ target }) {
  useEffect(() => {
    const viewport = window.visualViewport
    const element = target.current
    if (!viewport || !element) return
    // what's covered without the keyboard and with it
    let rest = Infinity
    let keyboard
    const set = inset => element.style.setProperty('--sn-keyboard-inset', `${inset}px`)
    const update = () => {
      const covered = Math.max(0, Math.round(element.getBoundingClientRect().bottom - viewport.offsetTop - viewport.height))
      // the least we've seen is without the keyboard
      rest = Math.min(rest, covered)
      if (element.contains(document.activeElement) && document.activeElement.tagName === 'INPUT') keyboard = covered
      set(covered)
    }
    // ios only tells us the new size once the keyboard has stopped moving, which
    // looks late. the keyboard comes and goes with the focus of the input, so we
    // use what we measured before and let the next resize correct it
    const onFocusIn = event => {
      if (event.target.tagName === 'INPUT' && keyboard !== undefined) set(keyboard)
    }
    const onFocusOut = event => {
      if (event.target.tagName === 'INPUT' && event.relatedTarget?.tagName !== 'INPUT') set(rest)
    }
    update()
    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    element.addEventListener('focusin', onFocusIn)
    element.addEventListener('focusout', onFocusOut)
    return () => {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
      element.removeEventListener('focusin', onFocusIn)
      element.removeEventListener('focusout', onFocusOut)
    }
  }, [target])
  return null
}

// phones get a button that looks like the bar and opens the search full screen
export function MobileSearchBar ({ className }) {
  const router = useRouter()
  const inputRef = useRef(null)
  const popupRef = useRef(null)
  const [open, setOpen] = useState(false)
  const { scope, text, setScope } = useSearchScope()

  // going to another page closes the search
  useEffect(() => {
    const close = () => setOpen(false)
    router.events.on('routeChangeStart', close)
    return () => router.events.off('routeChangeStart', close)
  }, [router.events])

  // ios only shows the keyboard when the input gets focus during the tap. base ui
  // focuses it a moment later, so we render the dialog right away and focus here
  const openNow = () => {
    flushSync(() => setOpen(true))
    inputRef.current?.focus()
  }

  // takes a chip off without opening the search
  const removeScope = scopeKey => event => {
    event.stopPropagation()
    setScope({ [scopeKey]: undefined })
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {/* a tap anywhere on the bar opens the search. the chips have a button of
          their own, so they are next to the trigger and not inside it */}
      <div className={cn(styles.bar, 'grow min-w-0 flex items-center gap-2 px-2 rounded-md', className)} onClick={openNow}>
        {scope.sub && <Chip prefix='~' name={scope.sub} onRemove={removeScope('sub')} />}
        {scope.user && <Chip prefix='@' name={scope.user} onRemove={removeScope('user')} />}
        {/* its click goes on to the bar, which does the opening */}
        <Dialog.Trigger aria-label='open search' onClick={event => event.preventBaseUIHandler()} className='grow basis-0 min-w-16 flex items-center gap-2 text-start'>
          <span className={cn('grow min-w-0 truncate text-touch py-0.5', !text && 'text-muted')}>{text || 'search whatever'}</span>
          <SearchIcon width={16} height={16} className={cn(styles.submit, 'shrink-0')} aria-hidden />
        </Dialog.Trigger>
      </div>
      <Dialog.Portal>
        {/* touch-none: dragging the bar or the footer must not move the page behind */}
        <Dialog.Popup ref={popupRef} aria-label='search' initialFocus={inputRef} className={cn(styles.dialog, 'flex flex-col touch-none')}>
          <KeyboardInset target={popupRef} />
          <Search inline open={open} setOpen={setOpen} inputRef={inputRef} />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
