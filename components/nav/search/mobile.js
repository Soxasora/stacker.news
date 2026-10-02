import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useRouter } from 'next/router'
import { Dialog } from '@base-ui/react/dialog'
import { cn } from '@/lib/cn'
import SearchIcon from '@/svgs/search-line.svg'
import { ScopeChips, barClasses } from './bar'
import Search from './search'
import { useSearchState } from './state'
import styles from './search.module.css'

// a ref for the full screen search. the keyboard and the browser's toolbar
// cover the bottom of the page instead of making it shorter, this sets
// --sn-keyboard-inset on the element to how much of it is covered
function useKeyboardInset () {
  return useCallback(element => {
    const viewport = window.visualViewport
    if (!element || !viewport) return
    let withoutKeyboard = Infinity
    let withKeyboard
    const set = inset => element.style.setProperty('--sn-keyboard-inset', `${inset}px`)
    const measure = () => {
      const covered = Math.max(0, Math.round(element.getBoundingClientRect().bottom - viewport.offsetTop - viewport.height))
      // the least we've seen is without the keyboard
      withoutKeyboard = Math.min(withoutKeyboard, covered)
      if (element.contains(document.activeElement) && document.activeElement.tagName === 'INPUT') withKeyboard = covered
      set(covered)
    }
    // ios only tells us the new size once the keyboard has stopped moving, which
    // looks late. the keyboard comes and goes with the focus of the input, so we
    // use what we measured before and let the next resize correct it
    const onFocusIn = event => {
      if (event.target.tagName === 'INPUT' && withKeyboard !== undefined) set(withKeyboard)
    }
    const onFocusOut = event => {
      if (event.target.tagName === 'INPUT' && event.relatedTarget?.tagName !== 'INPUT') set(withoutKeyboard)
    }
    measure()
    viewport.addEventListener('resize', measure)
    viewport.addEventListener('scroll', measure)
    element.addEventListener('focusin', onFocusIn)
    element.addEventListener('focusout', onFocusOut)
    return () => {
      viewport.removeEventListener('resize', measure)
      viewport.removeEventListener('scroll', measure)
      element.removeEventListener('focusin', onFocusIn)
      element.removeEventListener('focusout', onFocusOut)
    }
  }, [])
}

// phones get a button that looks like the bar and opens the search full screen
export function MobileSearchBar ({ className }) {
  const router = useRouter()
  const inputRef = useRef(null)
  const insetRef = useKeyboardInset()
  const [open, setOpen] = useState(false)
  const { scope, text, setScope } = useSearchState()

  // going back or forward changes the page and would leave the search open on top of it
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

  const removeScope = (type, event) => {
    // the bar would open the search
    event.stopPropagation()
    setScope({ [type]: undefined })
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {/* a tap anywhere on the bar opens the search. the chips have a button of
          their own, so they are next to the trigger and not inside it */}
      <div className={barClasses({ className })} onClick={openNow}>
        <ScopeChips scope={scope} onRemove={removeScope} />
        {/* base ui would open it too late for ios, the click bubbles to the bar instead */}
        <Dialog.Trigger aria-label='open search' onClick={event => event.preventBaseUIHandler()} className='grow basis-0 min-w-16 flex items-center gap-2 text-start'>
          <span className={cn('grow min-w-0 truncate text-touch py-0.5', !text && 'text-muted')}>{text || 'search whatever'}</span>
          <SearchIcon width={16} height={16} className={cn(styles.submit, 'shrink-0')} aria-hidden />
        </Dialog.Trigger>
      </div>
      <Dialog.Portal>
        {/* touch-none: dragging the bar or the footer must not move the page behind */}
        <Dialog.Popup ref={insetRef} aria-label='search' initialFocus={inputRef} className={cn(styles.dialog, 'flex flex-col touch-none')}>
          <Search inline open={open} setOpen={setOpen} inputRef={inputRef} />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
