import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { Dialog } from '@base-ui/react/dialog'
import { Autocomplete, AutocompletePopup } from '@/components/ui/autocomplete'
import { MAX_SEARCH_LENGTH } from '@/lib/constants'
import { joinScope, searchHref } from '@/lib/search'
import { cn } from '@/lib/cn'
import SearchIcon from '@/svgs/search-line.svg'
import CloseIcon from '@/svgs/close-line.svg'
import BackArrow from '@/svgs/arrow-left-line.svg'
import { ScopeChips, barClasses, keepFocus } from './bar'
import { useBrowseGroups } from './browse-groups'
import { isScopable, searchItem } from './items'
import { scopeWords, toLookup, useDebouncedLookup } from './lookup'
import { Footer, Results } from './results'
import { useSearchGroups } from './search-groups'
import { useSearchState } from './state'
import styles from './search.module.css'

const NO_GROUPS = []

// the bar and its results. the results are a popup under the bar, or with
// inline the rest of the full screen search on phones
export default function Search ({ className, inline, open, setOpen, inputRef: outerInputRef }) {
  const router = useRouter()
  const barRef = useRef(null)
  const ownInputRef = useRef(null)
  const inputRef = outerInputRef ?? ownInputRef
  const highlighted = useRef()
  const { scope, text, setText, setScope, reset } = useSearchState()
  // where the cursor is in the text, null when the input isn't focused
  const [caret, setCaret] = useState(null)

  const lookup = useMemo(() => toLookup(scope, text, caret ?? text.length), [scope, text, caret])
  const debounced = useDebouncedLookup(lookup)
  const browseGroups = useBrowseGroups({ open, phone: inline })
  const { groups: searchGroups, loading, groupLoading } = useSearchGroups({ lookup, debounced, open })

  // typing moves the cursor by itself, this is for when we change the text
  useEffect(() => {
    const input = inputRef.current
    if (caret !== null && document.activeElement === input && input.selectionStart !== caret) {
      input.setSelectionRange(caret, caret)
    }
  }, [text, caret])

  // the rows that run the search: with the chips, and without them
  const searchRows = useMemo(() => {
    if (lookup.mode !== 'search') return []
    const chips = scopeWords(scope)
    return [
      chips && searchItem(searchHref(lookup.q, router), lookup.text, chips),
      // a ~territory or @nym in the text still filters, so that's not everywhere
      searchItem(searchHref(lookup.text, router), lookup.text, lookup.typedScope ? '' : 'everywhere')
    ].filter(Boolean)
  }, [lookup, scope, router.pathname, router.query])

  const groups = lookup.mode === 'browse'
    ? browseGroups
    : lookup.mode === 'search'
      ? [{ value: 'search', items: searchRows }, ...searchGroups]
      : searchGroups.filter(group => group.value === lookup.type)

  // names usually load first, so a search keeps showing searching… until posts arrive
  const hasResults = lookup.mode === 'search' ? searchGroups.some(group => group.value === 'post') : groups.length > 0
  const searching = loading && !hasResults

  const onOpenChange = (nextOpen, details) => {
    // the inline list is always open, only escape closes the search
    if (inline) {
      if (!nextOpen && details.reason === 'escape-key') setOpen(false)
      return
    }
    // a press on a chip or its remove button is outside for base ui, stay open
    if (!nextOpen && details.reason === 'outside-press' && barRef.current?.contains(details.event.target)) return
    setOpen(nextOpen)
  }

  const onValueChange = value => {
    setText(value)
    setCaret(inputRef.current?.selectionStart ?? value.length)
  }

  // rows are links and do the navigation, we only close. a search shows up in
  // the bar of the search page, after anything else the bar starts over
  const onPick = item => {
    setOpen(false)
    if (item?.type !== 'search' && item?.type !== 'recent') reset()
  }

  const submit = event => {
    event.preventDefault()
    const q = joinScope(scope, text).slice(0, MAX_SEARCH_LENGTH)
    if (!q) return
    setOpen(false)
    router.push(searchHref(q, router))
  }

  const removeScope = type => {
    setScope({ [type]: undefined })
    inputRef.current?.focus()
  }

  // base ui keeps the index of the highlighted row when the rows change, so
  // after tab on the second stacker the second search row would be highlighted.
  // an empty list resets it, so we pass no rows for one render
  const [resetHighlight, setResetHighlight] = useState(false)
  useLayoutEffect(() => {
    if (resetHighlight) setResetHighlight(false)
  }, [resetHighlight])

  const addScope = item => {
    // when it's the one being typed, the word turns into the chip
    if (lookup.mode === 'name' && lookup.type === item.type) {
      const rest = (text.slice(0, lookup.start) + text.slice(lookup.end)).replace(/\s+/g, ' ').trimStart()
      setText(rest)
      setCaret(Math.min(lookup.start, rest.length))
    }
    setScope({ [item.type]: item.name })
    setResetHighlight(true)
    inputRef.current?.focus()
  }

  const canScope = item => isScopable(item) && scope[item.type]?.toLowerCase() !== item.name.toLowerCase()

  // puts @ or ~ at the end of the text as a word of its own. it replaces one
  // that's already there with nothing after it
  const addPrefix = prefix => {
    const before = text.replace(/(^|\s)[@~]?\s*$/, '')
    const next = before ? `${before} ${prefix}` : prefix
    setText(next)
    setCaret(next.length)
    inputRef.current?.focus()
  }

  // the stackers or territories for the name being typed, tab adds one to the scope
  const tabItems = lookup.mode === 'name' && open ? groups[0]?.items ?? [] : []
  const replaced = lookup.mode === 'name' && scope[lookup.type] && lookup.prefix + scope[lookup.type]
  // phones have no tab key, they use the arrow on the row
  const tabHint = !inline && tabItems.length > 0 ? (replaced ? `replace ${replaced}` : 'add to scope') : undefined

  const onKeyDown = event => {
    const input = event.currentTarget
    if (event.key === 'Tab' && !event.shiftKey && tabItems.length > 0) {
      event.preventDefault()
      addScope(tabItems.find(item => item.value === highlighted.current?.value) ?? tabItems[0])
    } else if (event.key === 'Backspace' && input.selectionStart === 0 && input.selectionEnd === 0) {
      // backspace at the start of the text removes the last chip
      const last = scope.user ? 'user' : scope.sub ? 'sub' : undefined
      if (!last) return
      event.preventDefault()
      setScope({ [last]: undefined })
    }
  }

  const bar = (
    <div ref={barRef} className={barClasses({ className: cn('relative', className) })}>
      <ScopeChips scope={scope} onRemove={removeScope} />
      <Autocomplete.Input
        ref={inputRef}
        name='q'
        placeholder='search whatever'
        enterKeyHint='search'
        // basis-0 so the chips keep their width and the input takes what's left
        className={cn(styles.input, 'grow basis-0 min-w-16 text-base max-md:text-touch py-0.5')}
        onKeyDown={onKeyDown}
        onSelect={event => setCaret(event.currentTarget.selectionStart)}
        onBlur={() => setCaret(null)}
      />
      {/* hidden instead of removed so the bar doesn't jump */}
      <span className={cn('shrink-0 flex items-center gap-2', !text && 'invisible')}>
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
    <Results
      lookup={lookup} searching={searching} loading={loading} groupLoading={groupLoading}
      onPick={onPick} canScope={canScope} onScope={addScope}
    />
  )
  const footer = <Footer lookup={lookup} tabHint={tabHint} onPick={onPick} onPrefix={addPrefix} className={inline ? 'mt-auto' : 'mt-3'} />

  return (
    <form onSubmit={submit} className={inline ? 'flex flex-col h-full' : undefined}>
      <Autocomplete.Root
        // always: also highlight the first row when the rows change without typing
        autoHighlight={lookup.mode === 'browse' ? true : 'always'}
        keepHighlight
        items={resetHighlight ? NO_GROUPS : groups}
        value={text}
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
    </form>
  )
}
