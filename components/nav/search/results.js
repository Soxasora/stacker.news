import Link from 'next/link'
import {
  Autocomplete, AutocompleteList, AutocompleteGroupLabel, AutocompleteTiles, autocompleteStatusClasses
} from '@/components/ui/autocomplete'
import { cn } from '@/lib/cn'
import Moon from '@/svgs/moon-fill.svg'
import { keepFocus } from './bar'
import { Row, Tile } from './items'
import styles from './search.module.css'

const NOUNS = { user: 'stacker', sub: 'territory' }

// a button at the end of a group's label
function GroupAction ({ label, onClick }) {
  return <button type='button' className='ms-auto font-normal pointer-coarse:hitbox-11' onMouseDown={keepFocus} onClick={onClick}>{label}</button>
}

function Kbd ({ children }) {
  return <kbd className={cn(styles.kbd, 'px-1 py-0.5')}>{children}</kbd>
}

// ~ territory or @ stackers in the footer, a click types the prefix
function PrefixHint ({ prefix, onPrefix, children }) {
  return (
    <button type='button' className='pointer-coarse:hitbox-11' onMouseDown={keepFocus} onClick={() => onPrefix(prefix)}>
      <Kbd>{prefix}</Kbd> {children}
    </button>
  )
}

// the groups come from the items of Autocomplete.Root
export function Results ({ lookup, searching, loading, groupLoading, onPick, canScope, onScope }) {
  return (
    <>
      <Autocomplete.Status>
        {searching && <div className={autocompleteStatusClasses()}>searching…</div>}
      </Autocomplete.Status>
      <Autocomplete.Empty>
        {lookup.mode === 'name' && !loading && (
          <div className={autocompleteStatusClasses()}>
            {lookup.name
              ? `no ${NOUNS[lookup.type]} called ${lookup.prefix}${lookup.name}`
              : `type the name of a ${NOUNS[lookup.type]}`}
          </div>
        )}
      </Autocomplete.Empty>
      <AutocompleteList>
        {(group, index) => (
          <Autocomplete.Group key={group.value} items={group.items} className={index > 0 ? 'mt-1.5' : undefined}>
            {group.label && (
              <AutocompleteGroupLabel className='flex items-center gap-2'>
                {group.label}
                {groupLoading[group.value] && <Moon className='spin shrink-0' width={12} height={12} aria-hidden />}
                {group.action && <GroupAction {...group.action} />}
              </AutocompleteGroupLabel>
            )}
            {group.layout === 'tiles'
              ? (
                <AutocompleteTiles className='grid-cols-1 md:grid-cols-4'>
                  <Autocomplete.Collection>
                    {item => <Tile key={item.value} item={item} onPick={onPick} onScope={canScope(item) ? onScope : undefined} />}
                  </Autocomplete.Collection>
                </AutocompleteTiles>
                )
              : (
                <Autocomplete.Collection>
                  {item => <Row key={item.value} item={item} onPick={onPick} onScope={canScope(item) ? onScope : undefined} />}
                </Autocomplete.Collection>
                )}
          </Autocomplete.Group>
        )}
      </AutocompleteList>
    </>
  )
}

// tabHint says what tab would do, when it would do something
export function Footer ({ lookup, tabHint, onPick, onPrefix, className }) {
  return (
    // side by side when there's room, stacked when not
    <div className={cn(styles.footer, 'flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-2 text-xs text-muted', className)}>
      {lookup.mode === 'browse' && <Link href='/territory' className='whitespace-nowrap text-muted' onClick={() => onPick()}>create a territory</Link>}
      {lookup.mode === 'search' && <span className='whitespace-nowrap'>press <Kbd>↵</Kbd> for all results</span>}
      {lookup.mode === 'name' && (
        <span className='whitespace-nowrap'>
          <Kbd>↵</Kbd> open {lookup.type === 'user' ? 'profile' : 'territory'}
          {tabHint && <> <Kbd>tab</Kbd> {tabHint}</>}
        </span>
      )}
      <span className='whitespace-nowrap'>
        <PrefixHint prefix='~' onPrefix={onPrefix}>territory</PrefixHint> <PrefixHint prefix='@' onPrefix={onPrefix}>stackers</PrefixHint>
      </span>
    </div>
  )
}
