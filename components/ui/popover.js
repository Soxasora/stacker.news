import { Popover as BasePopover } from '@base-ui/react/popover'
import { cn } from '@/lib/cn'
import styles from './popover.module.css'

/*
 * shared popover chrome (keystone 6: colors/border/motion in the module,
 * box metrics as utilities). Exported so preview-card consumers
 * (hoverable-popover.js) and future anchored popovers (ToC, link editor)
 * paint identically without importing Base UI's Popover parts.
 */
export const popoverStyles = styles
export const popupClasses = (className) => cn(styles.popup, 'text-sm max-w-80 rounded-lg', className)

/*
 * Portal > Positioner > Popup > Arrow with SN chrome; use inside a
 * Popover.Root. `anchor` supports the detached-anchor pattern (upvote
 * walkthrough: controlled Root with no Trigger, anchored to an element ref).
 */
export function PopoverContent ({ side = 'bottom', align = 'center', sideOffset = 8, anchor, className, children }) {
  return (
    <BasePopover.Portal>
      <BasePopover.Positioner side={side} align={align} sideOffset={sideOffset} anchor={anchor} className={styles.positioner}>
        <BasePopover.Popup className={popupClasses(className)}>
          <BasePopover.Arrow className={styles.arrow} />
          {children}
        </BasePopover.Popup>
      </BasePopover.Positioner>
    </BasePopover.Portal>
  )
}

/* .5rem 1rem = today's painted popover-header padding; text-base ≡ $font-size-base */
export function PopoverHeader ({ className, onClose, children, ...props }) {
  return (
    <div className={cn(styles.header, 'py-2 px-4 text-base font-medium flex justify-between items-center', className)} {...props}>
      {children}
      {onClose &&
        <button type='button' className={styles.close} onClick={onClose} aria-label='Close'>X</button>}
    </div>
  )
}

export function PopoverBody ({ className, ...props }) {
  return <div className={cn('py-2 px-4', className)} {...props} />
}

export const Root = BasePopover.Root
export const Trigger = BasePopover.Trigger

/**
 * SN Popover — click-toggled popover, drop-in for the old
 * OverlayTrigger(trigger='click', rootClose) + rb Popover pairs.
 * `trigger` must be a single element that spreads props and forwards ref;
 * pass `nativeButton` if it renders a real <button>.
 */
export default function Popover ({ trigger, side = 'bottom', nativeButton = false, className, children, ...rootProps }) {
  return (
    <BasePopover.Root {...rootProps}>
      <BasePopover.Trigger render={trigger} nativeButton={nativeButton} />
      <PopoverContent side={side} className={className}>
        {children}
      </PopoverContent>
    </BasePopover.Root>
  )
}

Popover.Root = BasePopover.Root
Popover.Trigger = BasePopover.Trigger
Popover.Content = PopoverContent
Popover.Header = PopoverHeader
Popover.Body = PopoverBody
