import { Form } from '@/components/form'
import { searchSchema } from '@/lib/validate'
import { Autocomplete } from '@base-ui/react'
import { useRouter } from 'next/router'
import { useCallback, useRef, useState, useMemo } from 'react'
import styles from './search.module.css'
import { cn } from '@/lib/cn'
import SearchIcon from '@/svgs/search-line.svg'
import CloseIcon from '@/svgs/close-line.svg'
import Badge from '@/components/ui/badge'
import { AutocompletePopup, AutocompleteList, AutocompleteGroupLabel, AutocompleteSeparatorInvisible, AutocompleteItem, autocompleteStatusClasses, AutocompleteTiles, AutocompleteTile } from '@/components/ui/autocomplete'
import Link from 'next/link'
import { BROWSE } from './search-mocks'
import SubPreviewCard from '@/components/sub-preview-card'
import ClockCounterWiseIcon from '@/svgs/clock-counter-wise.svg'
import Moon from '@/svgs/moon-fill.svg'
import useDebounceCallback from '@/components/use-debounce-callback'
import { useQuery } from '@apollo/client/react'
import { NAV_SEARCH_POSTS, NAV_SEARCH_NAMES } from '@/fragments/search'
import { abbrNum, numWithUnits } from '@/lib/format'
import { SearchTitle } from '@/components/item'

const MIN_QUERY = 2
const MAX_QUERY = 100 // searchSchema
const LIMIT = 3
const DEBOUNCE_MS = 500
const HOME = 'home'

// home and the search results are rows too, but only territories get a preview card
const isTerritory = item => item.type === 'territory'
const isRecent = item => item.type === 'recent'

// @nym and ~territory tokens narrow the post search server-side (queryParts in
// api/resolvers/search.js); here they also pick what the name lookups match on
function splitQuery (q) {
  const words = q.split(/\s+/).filter(Boolean)
  const nym = words.find(w => /^@\w/.test(w))?.slice(1)
  const territory = words.find(w => /^~\w/.test(w))?.slice(1)
  const text = words.filter(w => !/^[@~]/.test(w)).join(' ')
  return { nym, territory, text }
}

// rows are { value: href, label, meta }: the href doubles as the unique key and
// label is what Base UI reads when it needs a string for an item. territory rows
// carry name so they get the treatment the sections use (bold current, preview card)
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
  // a territory's post count only exists per time bucket, so the row is the name alone
  const territories = (data.subSuggestions ?? []).map(sub => ({
    value: `/~${sub.name}`,
    name: sub.name,
    label: `~${sub.name}`,
    meta: ''
  }))
  return [
    { value: 'posts', label: territory ? `posts in ~${territory}` : 'posts', items: posts },
    { value: 'stackers', label: 'stackers', items: stackers },
    { value: 'territories', label: 'territories', items: territories }
  ].filter(group => group.items.length > 0)
}

// clear and show all, at the right end of a group's label row; mousedown is
// prevented so the input keeps focus and the popup stays open
function LabelControl ({ onClick, children }) {
  return (
    <button
      type='button'
      className={cn(styles.control, 'p-0 bg-transparent border-0 font-normal normal-case tracking-normal')}
      onMouseDown={event => event.preventDefault()}
      onClick={onClick}
    >
      {children}
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

function SubCard ({ item }) {
  return (
    <SubPreviewCard sub={item.name} side='right' className='flex grow min-w-0 items-baseline gap-2 px-3'>
      <div className='flex flex-col gap-2'>
        <div className='flex items-center gap-2'>
          <span className='grow min-w-0 truncate'>
            {item.label}
            {item.nsfw && <Badge variant='secondary' className='ms-1'>nsfw</Badge>}
          </span>
        </div>
        {item.meta && (
          <div className='flex items-center gap-2'>
            <span className='shrink-0 text-xs text-muted'>{item.meta}</span>
          </div>
        )}
      </div>
    </SubPreviewCard>
  )
}

export default function SearchBar ({ className, sub, ...props }) {
  const router = useRouter()
  const barRef = useRef(null)
  // the bar holds the query on the search page
  const [value, setValue] = useState(() => (
    router.pathname.endsWith('/search') && typeof router.query.q === 'string' ? router.query.q : ''
  ))
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const normalized = value.trim().slice(0, MAX_QUERY)
  const active = normalized.length >= MIN_QUERY
  // below the search threshold the dropdown browses territories, narrowed by what was typed
  const browsing = !active
  const current = sub ?? HOME

  const updateQuery = useDebounceCallback(next => {
    const q = next.trim().slice(0, MAX_QUERY)
    setQuery(q.length >= MIN_QUERY ? q : '')
  }, DEBOUNCE_MS)

  const onValueChange = useCallback(next => {
    setValue(next)
    updateQuery(next)
  }, [updateQuery])

  const { nym, territory, text } = useMemo(() => splitQuery(query), [query])
  const userQ = nym ?? text
  const subQ = territory ?? text
  const posts = useQuery(NAV_SEARCH_POSTS, {
    variables: { q: query, limit: LIMIT },
    skip: !query,
    // throwaway results: keep them out of the search and stackers page caches
    fetchPolicy: 'no-cache'
  })
  const names = useQuery(NAV_SEARCH_NAMES, {
    variables: { userQ, withUsers: !!userQ, subQ, withSubs: !!subQ, limit: LIMIT },
    skip: !userQ && !subQ,
    fetchPolicy: 'no-cache'
  })

  // keep the last results on screen while the next query loads
  const postData = query ? (posts.data ?? posts.previousData) : undefined
  const nameData = userQ || subQ ? (names.data ?? names.previousData) : undefined
  const searchGroups = useMemo(() => toSearchGroups({ ...postData, ...nameData }, territory), [postData, nameData, territory])
  const groups = browsing ? BROWSE : searchGroups

  // we count the debounce window as searching too, so the popup never opens just with footer
  const debouncing = query !== normalized
  const postsPending = active && (posts.loading || debouncing)
  const namesPending = active && (names.loading || debouncing)
  const pending = postsPending || namesPending
  // the names land first, so the status stays up until there are posts to show
  const searching = !browsing && pending && !postData?.search?.items?.length
  // rows of the last query stay up while the next one loads: each group spins until its own query lands
  const groupPending = { posts: postsPending, stackers: namesPending, territories: namesPending }

  const clearRecent = useCallback(() => {
    setQuery('')
  }, [])

  // rows are links, so Base UI leaves navigation to them and we only tidy up
  const onPick = useCallback(() => {
    setOpen(false)
    setValue('')
    setQuery('')
    // collapse()
  }, [])

  return (
    <Form
      onSubmit={values => console.log(values)}
      schema={searchSchema}
      enableReinitialize
    >
      <Autocomplete.Root
        items={groups}
        value={value}
        onValueChange={onValueChange}
        filter={null}
        openOnInputClick
        open={open}
        onOpenChange={setOpen}
        mode='none'
        modal={false}
      >
        <div ref={barRef} className={cn(styles.bar, 'relative grow min-w-0 flex items-center gap-2 px-2', className)} {...props}>
          <Autocomplete.Input name='q' placeholder='search whatever' className={cn(styles.input, 'grow min-w-0 text-base py-0.5')} />
          <span aria-hidden className={cn(styles.divider, 'shrink-0 w-px h-4', !value && 'invisible')} />
          <Autocomplete.Clear keepMounted className={cn(styles.clear, 'shrink-0 flex p-0 bg-transparent border-0')} aria-label='clear search'>
            <CloseIcon width={14} height={14} />
          </Autocomplete.Clear>
          <button
            type='submit' aria-label='search' className={cn(styles.submit, 'shrink-0 flex p-0 bg-transparent border-0')}
            onMouseDown={event => event.preventDefault()}
          >
            <SearchIcon width={16} height={16} aria-hidden />
          </button>
        </div>

        {/* the footer's background runs to the popup's edges: no bottom padding, corners clipped */}
        <AutocompletePopup className={cn(styles.popup, 'md:min-w-lg max-w-full max-h-full pb-0 overflow-hidden')} anchor={barRef} positionMethod='fixed'>
          <Autocomplete.Status>
            {/*             {browsing
                          ? !territories.loaded && <div>loading territories…</div>
                          : pending && groups.length === 0 && <div>searching…</div>} */}
            {searching && <div className={autocompleteStatusClasses()}>searching…</div>}
          </Autocomplete.Status>
          <Autocomplete.Empty>
            {/*             {browsing
                          ? territories.loaded && normalized && <div>no territories match “{normalized}”</div>
                          : !pending && query && <div>no matches for “{query}”</div>} */}
            {!browsing && !pending && query && <div className={autocompleteStatusClasses()}>no matches for “{query}”</div>}
          </Autocomplete.Empty>
          <AutocompleteList className={styles.list}>
            {(group, index) => (
              <Autocomplete.Group key={group.value} items={group.items}>
                {index > 0 && <AutocompleteSeparatorInvisible />}
                {group.label && (
                  <AutocompleteGroupLabel className='flex items-center justify-between gap-2'>
                    {group.label}
                    {groupPending[group.value] && <Moon className='spin fill-muted shrink-0 me-auto' width={12} height={12} aria-hidden />}
                    {group.value === 'recent' && <LabelControl onClick={clearRecent}>clear</LabelControl>}
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
                      {item => (
                        <AutocompleteItem
                          key={item.value}
                          value={item}
                          render={<Link href={item.value} />}
                          onClick={onPick}
                          className={cn(item.muted && 'opacity-50', item.name === current && 'font-bold', isTerritory(item) && 'px-0', isRecent(item) && 'items-center')}
                        >
                          {isRecent(item)
                            ? (
                              <>
                                <ClockCounterWiseIcon width={16} height={16} aria-hidden className='text-muted' />
                                <RowContent item={item} />
                              </>
                              )
                            : isTerritory(item)
                              ? (
                                <SubCard item={item} />
                                )
                              : <RowContent item={item} />}
                        </AutocompleteItem>
                      )}
                    </Autocomplete.Collection>
                    )}
              </Autocomplete.Group>
            )}
          </AutocompleteList>
          {/* each piece keeps to one line: side by side when the popup is wide enough, stacked when not */}
          <div className={cn(styles.footer, 'mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-2 text-xs text-muted')}>
            {browsing
              ? <Link href='/territory' className={cn(styles.control, 'whitespace-nowrap text-muted')} onClick={onPick}>create a territory</Link>
              : <span className='whitespace-nowrap'>press <kbd className={cn(styles.kbd, 'font-mono rounded px-1')}>↵</kbd> for all results</span>}
            <span className='whitespace-nowrap'><kbd className={cn(styles.kbd, 'font-mono rounded px-1')}>~</kbd> territory <kbd className={cn(styles.kbd, 'font-mono rounded px-1')}>@</kbd> stackers</span>
          </div>
        </AutocompletePopup>
      </Autocomplete.Root>
    </Form>
  )
}
