import { useCallback, useMemo, useRef, useState } from 'react'
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
import useDebounceCallback from '@/components/use-debounce-callback'
import { NAV_SEARCH_POSTS, NAV_SEARCH_NAMES } from '@/fragments/search'
import { abbrNum, numWithUnits } from '@/lib/format'
import { cn } from '@/lib/cn'
import SearchIcon from '@/svgs/search-line.svg'
import CloseIcon from '@/svgs/close-line.svg'
import ClockCounterWiseIcon from '@/svgs/clock-counter-wise.svg'
import Moon from '@/svgs/moon-fill.svg'
import { BROWSE } from './search-mocks'
import styles from './search.module.css'

const MIN_QUERY = 2
const MAX_QUERY = 100 // same as searchSchema
const LIMIT = 3
const DEBOUNCE_MS = 500

// returns '' if the query is too short
function toQuery (value) {
  const q = value.trim().slice(0, MAX_QUERY)
  return q.length >= MIN_QUERY ? q : ''
}

// the server uses @nym and ~territory to filter posts (queryParts in
// api/resolvers/search.js), we also use them for the stacker and territory lookups
function splitQuery (q) {
  const words = q.split(/\s+/).filter(Boolean)
  const nym = words.find(w => /^@\w/.test(w))?.slice(1)
  const territory = words.find(w => /^~\w/.test(w))?.slice(1)
  const text = words.filter(w => !/^[@~]/.test(w)).join(' ')
  return { nym, territory, text }
}

// same shape as the mocks: value is the link and key, label is the text Base UI
// uses for the item, meta is the text on the right
function toSearchGroups (data, territory) {
  const posts = (data.search?.items ?? []).map(item => ({
    value: `/items/${item.id}`,
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
    label: `@${user.name}`,
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
    { value: 'posts', label: territory ? `posts in ~${territory}` : 'posts', items: posts },
    { value: 'stackers', label: 'stackers', items: stackers },
    { value: 'territories', label: 'territories', items: territories }
  ].filter(group => group.items.length > 0)
}

// keep focus in the input so the popup stays open
const keepFocus = event => event.preventDefault()

function LabelControl ({ onClick, children }) {
  return <button type='button' className='font-normal' onMouseDown={keepFocus} onClick={onClick}>{children}</button>
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

function Row ({ item, sub, onPick }) {
  const recent = item.type === 'recent'
  const territory = item.type === 'territory'
  return (
    <AutocompleteItem
      value={item}
      render={<Link href={item.value} />}
      onClick={onPick}
      // padding goes on the preview card trigger so hovering anywhere on the row opens it
      className={cn(item.muted && 'opacity-50', recent && 'items-center', territory && 'px-0', territory && item.name === sub && 'font-bold')}
    >
      {recent && <ClockCounterWiseIcon width={16} height={16} className='text-muted' aria-hidden />}
      {territory
        ? (
          <SubPreviewCard sub={item.name} side='right' className='flex flex-col gap-2 grow min-w-0 px-3'>
            <RowContent item={item} />
          </SubPreviewCard>
          )
        : <RowContent item={item} />}
    </AutocompleteItem>
  )
}

// sub is the current territory, shown in bold
export default function SearchBar ({ className, sub }) {
  const router = useRouter()
  const barRef = useRef(null)
  // on the search page, start with the current query
  const [value, setValue] = useState(() => (
    router.pathname.endsWith('/search') && typeof router.query.q === 'string' ? router.query.q : ''
  ))
  // debounced value, used for the queries
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const updateQuery = useDebounceCallback(next => setQuery(toQuery(next)), DEBOUNCE_MS)
  const onValueChange = useCallback(next => {
    setValue(next)
    updateQuery(next)
  }, [updateQuery])

  const { nym, territory, text } = splitQuery(query)
  const userQ = nym ?? text
  const subQ = territory ?? text
  // no-cache so these results don't end up in the search and stackers page caches
  const posts = useQuery(NAV_SEARCH_POSTS, {
    variables: { q: query, limit: LIMIT },
    skip: !query,
    fetchPolicy: 'no-cache'
  })
  const names = useQuery(NAV_SEARCH_NAMES, {
    variables: { userQ, withUsers: !!userQ, subQ, withSubs: !!subQ, limit: LIMIT },
    skip: !userQ && !subQ,
    fetchPolicy: 'no-cache'
  })

  const typed = toQuery(value)
  // too short to search, show recent searches and territories instead
  const browsing = !typed
  // keep showing the last results while the next ones load
  const postData = query ? (posts.data ?? posts.previousData) : undefined
  const nameData = userQ || subQ ? (names.data ?? names.previousData) : undefined
  const searchGroups = useMemo(() => toSearchGroups({ ...postData, ...nameData }, territory), [postData, nameData, territory])
  const groups = browsing ? BROWSE : searchGroups

  // count the debounce wait as loading too, so the popup doesn't open with only the footer
  const debouncing = query !== typed
  const postsPending = !browsing && (posts.loading || debouncing)
  const namesPending = !browsing && (names.loading || debouncing)
  const pending = postsPending || namesPending
  // names usually load first, so keep showing searching… until posts arrive
  const searching = pending && !postData?.search?.items?.length
  // each group shows a spinner until its query is done
  const groupPending = { posts: postsPending, stackers: namesPending, territories: namesPending }

  // rows are links and handle navigation, we just close and reset
  const onPick = useCallback(() => {
    setOpen(false)
    setValue('')
    setQuery('')
  }, [])

  return (
    <Form onSubmit={values => console.log(values)}>
      <Autocomplete.Root
        items={groups}
        value={value}
        onValueChange={onValueChange}
        open={open}
        onOpenChange={setOpen}
        openOnInputClick
        mode='none' // disables base ui filtering
      >
        <div ref={barRef} className={cn(styles.bar, 'relative grow min-w-0 flex items-center gap-2 px-2 rounded-md', className)}>
          <Autocomplete.Input name='q' placeholder='search whatever' className={cn(styles.input, 'grow min-w-0 text-base py-0.5')} />
          <span aria-hidden className={cn(styles.divider, 'shrink-0 w-px h-4', !value && 'invisible')} />
          <Autocomplete.Clear keepMounted aria-label='clear search' className={cn(styles.clear, 'shrink-0 flex')}>
            <CloseIcon width={14} height={14} />
          </Autocomplete.Clear>
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
            {!browsing && !pending && <div className={autocompleteStatusClasses()}>no matches for “{query}”</div>}
          </Autocomplete.Empty>
          <AutocompleteList>
            {(group, index) => (
              <Autocomplete.Group key={group.value} items={group.items}>
                {index > 0 && <AutocompleteSeparator invisible />}
                {group.label && (
                  <AutocompleteGroupLabel className='flex items-center justify-between gap-2'>
                    {group.label}
                    {groupPending[group.value] && <Moon className='spin shrink-0 me-auto' width={12} height={12} aria-hidden />}
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
                        {item => (
                          <AutocompleteTile key={item.value} value={item} render={<Link href={item.value} />} onClick={onPick}>
                            <span className='truncate text-sm font-bold'>{item.label}</span>
                            <span className='text-xs text-muted'>{item.meta}</span>
                          </AutocompleteTile>
                        )}
                      </Autocomplete.Collection>
                    </AutocompleteTiles>
                    )
                  : (
                    <Autocomplete.Collection>
                      {item => <Row key={item.value} item={item} sub={sub} onPick={onPick} />}
                    </Autocomplete.Collection>
                    )}
              </Autocomplete.Group>
            )}
          </AutocompleteList>
          {/* side by side when there's room, stacked when not */}
          <div className={cn(styles.footer, 'mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-2 text-xs text-muted')}>
            {browsing
              ? <Link href='/territory' className='whitespace-nowrap text-muted' onClick={onPick}>create a territory</Link>
              : <span className='whitespace-nowrap'>press <Kbd>↵</Kbd> for all results</span>}
            <span className='whitespace-nowrap'><Kbd>~</Kbd> territory <Kbd>@</Kbd> stackers</span>
          </div>
        </AutocompletePopup>
      </Autocomplete.Root>
    </Form>
  )
}
