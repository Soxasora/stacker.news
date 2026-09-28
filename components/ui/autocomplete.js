import { Autocomplete as BaseAutocomplete } from '@base-ui/react/autocomplete'
import { cn } from '@/lib/cn'
import { popoverClasses } from './popover'
import popoverStyles from './popover.module.css'
import styles from './autocomplete.module.css'

// an input with suggestions, unlike Combobox nothing gets selected
export const Autocomplete = BaseAutocomplete

// same width as the input, or as anchor={ref} when passed
export function AutocompletePopup ({ side = 'bottom', align = 'start', sideOffset = 6, anchor, positionMethod, className, children, ...props }) {
  return (
    <BaseAutocomplete.Portal>
      <BaseAutocomplete.Positioner side={side} align={align} sideOffset={sideOffset} anchor={anchor} positionMethod={positionMethod} className={popoverStyles.positioner}>
        <BaseAutocomplete.Popup className={popoverClasses({ className: cn('w-(--anchor-width) max-w-none py-1.5 rounded-md text-base', className) })} {...props}>
          {children}
        </BaseAutocomplete.Popup>
      </BaseAutocomplete.Positioner>
    </BaseAutocomplete.Portal>
  )
}

export function AutocompleteList ({ className, ...props }) {
  return <BaseAutocomplete.List className={cn('list-none ps-0 mb-0', className)} {...props} />
}

export function AutocompleteGroupLabel ({ className, ...props }) {
  return <BaseAutocomplete.GroupLabel className={cn('px-3 pt-1.5 pb-0.5 text-xs text-muted font-bold', className)} {...props} />
}

// label on the left, meta on the right
export function AutocompleteItem ({ className, ...props }) {
  return <BaseAutocomplete.Item className={cn(styles.item, 'flex items-baseline gap-2 py-1 px-3 mx-1 mt-0.5 rounded-md', className)} {...props} />
}

// invisible: spacing only, no line
export function AutocompleteSeparator ({ invisible, className, ...props }) {
  return <BaseAutocomplete.Separator className={cn(!invisible && styles.separator, 'my-1.5', className)} {...props} />
}

// wrap a group's Collection to show its items as cards
export function AutocompleteTiles ({ className, ...props }) {
  return <div role='presentation' className={cn('grid grid-cols-1 md:grid-cols-4 gap-2 px-3 pt-0.5', className)} {...props} />
}

export function AutocompleteTile ({ className, ...props }) {
  return <BaseAutocomplete.Item className={cn(styles.item, styles.tile, 'flex flex-col gap-0.5 min-w-0 py-2.5 px-3 rounded-md', className)} {...props} />
}

// for the text inside Status and Empty. those are always rendered for screen
// readers, so padding them would show an empty box
export const autocompleteStatusClasses = ({ className } = {}) =>
  cn('px-3 py-1 text-xs text-muted', className)
