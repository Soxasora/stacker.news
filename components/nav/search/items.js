import Link from 'next/link'
import { AutocompleteItem, AutocompleteTile } from '@/components/ui/autocomplete'
import ItemPreviewCard from '@/components/item-preview-card'
import SubPreviewCard from '@/components/sub-preview-card'
import { SearchTitle } from '@/components/item'
import userStyles from '@/components/user-header.module.css'
import { MEDIA_URL } from '@/lib/constants'
import { SCOPES, SEARCH_PATH } from '@/lib/search'
import { abbrNum, numWithUnits } from '@/lib/format'
import { cn } from '@/lib/cn'
import SearchIcon from '@/svgs/search-line.svg'
import HistoryIcon from '@/svgs/history-line.svg'
import ScopeArrow from '@/svgs/arrow-left-up-line.svg'
import { keepFocus } from './bar'
import styles from './search.module.css'

// an item is one row or tile of the results. value is its link and its key,
// label is its text for base ui, title is shown instead of label when set,
// meta is the small text after it

export function postItem (item) {
  return {
    value: `/items/${item.id}`,
    type: 'post',
    id: item.id,
    label: item.title,
    title: item.searchTitle ? <SearchTitle title={item.searchTitle} /> : undefined,
    meta: [
      item.sub?.name && `~${item.sub.name}`,
      numWithUnits(item.sats),
      numWithUnits(item.ncomments, { unitSingular: 'comment', unitPlural: 'comments' })
    ].filter(Boolean).join(' \\ ')
  }
}

export function userItem (user) {
  return {
    value: `/${user.name}`,
    type: 'user',
    name: user.name,
    label: `@${user.name}`,
    photoId: user.photoId,
    // stackers can hide what they stacked
    meta: user.optional?.stacked != null ? `${abbrNum(user.optional.stacked)} stacked` : ''
  }
}

export function subItem (sub, meta) {
  return { value: `/~${sub.name}`, type: 'sub', name: sub.name, label: `~${sub.name}`, meta, muted: sub.meMuteSub }
}

// a row that runs the search. after is what comes after the text, like 'in ~bitcoin'
export function searchItem (href, text, after) {
  return { value: href, type: 'search', label: `search ${text} ${after}`.trim(), title: <>search <b>{text}</b> {after}</> }
}

export function recentItem (q) {
  return { value: `${SEARCH_PATH}?${new URLSearchParams({ q })}`, type: 'recent', label: q }
}

export const isScopable = item => SCOPES.some(({ type }) => type === item.type)

// the width of the scope button, 44px on phones, and the room the row or tile
// leaves for it at its end
const SCOPE_BUTTON = {
  row: { width: 'w-11 md:w-9', room: 'pe-11 md:pe-9' },
  tile: { width: 'w-11 md:w-8', room: 'pe-11 md:pe-8' }
}

// adds the stacker or territory of a row to the scope, the row itself opens it
function ScopeButton ({ item, onScope, className }) {
  const label = `add ${item.label} to scope`
  return (
    <button
      type='button'
      // tab on the input does this for the keyboard
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

function RowIcon ({ item }) {
  const iconProps = { width: 16, height: 16, className: 'text-muted shrink-0 self-center', 'aria-hidden': true }
  if (item.type === 'recent') return <HistoryIcon {...iconProps} />
  if (item.type === 'search') return <SearchIcon {...iconProps} />
  if (item.type === 'user') {
    const src = item.photoId ? `${MEDIA_URL}/${item.photoId}` : '/dorian400.jpg'
    return <img src={src} alt='' width={16} height={16} className={cn(userStyles.userimg, 'shrink-0 self-center')} />
  }
  return null
}

function RowText ({ item }) {
  return (
    <>
      <span className='grow min-w-0 truncate'>{item.title ?? item.label}</span>
      {item.meta && <span className='shrink-0 text-xs text-muted'>{item.meta}</span>}
    </>
  )
}

// onScope is set when the row gets a scope button
export function Row ({ item, onPick, onScope }) {
  return (
    <AutocompleteItem
      value={item}
      render={<Link href={item.value} />}
      onClick={() => onPick(item)}
      className={onScope && SCOPE_BUTTON.row.room}
      action={onScope && <ScopeButton item={item} onScope={onScope} className={SCOPE_BUTTON.row.width} />}
    >
      <RowIcon item={item} />
      {item.type === 'post'
        ? (
          <ItemPreviewCard id={item.id} side='right' className='flex flex-col grow min-w-0'>
            <RowText item={item} />
          </ItemPreviewCard>
          )
        : <RowText item={item} />}
    </AutocompleteItem>
  )
}

// a territory
export function Tile ({ item, onPick, onScope }) {
  return (
    <AutocompleteTile
      value={item}
      render={<Link href={item.value} />}
      onClick={() => onPick(item)}
      className={item.muted && 'opacity-50'}
      action={onScope && <ScopeButton item={item} onScope={onScope} className={SCOPE_BUTTON.tile.width} />}
    >
      {/* the padding is on the preview card so hovering anywhere on the tile opens it */}
      <SubPreviewCard sub={item.name} className={cn('flex flex-col gap-0.5 min-w-0 py-2.5 px-3', onScope && SCOPE_BUTTON.tile.room)}>
        <span className='truncate text-sm font-bold'>{item.label}</span>
        <span className='text-xs text-muted'>{item.meta}</span>
      </SubPreviewCard>
    </AutocompleteTile>
  )
}
