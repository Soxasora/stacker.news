import { Drawer as BaseDrawer } from '@base-ui/react/drawer'
import { cn } from '@/lib/cn'
import styles from './drawer.module.css'

/**
 * SN Drawer — Offcanvas drop-in on Base UI Drawer. Placements: end (right
 * panel) | bottom (sheet). Controlled (`show`/`onHide`). Native
 * swipe-to-dismiss is ON (deviation D12: Base UI has no swipe-off switch —
 * their guidance for gesture-free panels is a positioned Dialog — and
 * swipe-dismiss is a strict mobile upgrade in the D8/D9 family).
 */
export default function Drawer ({ show, onHide, placement = 'end', className, children }) {
  const bottom = placement === 'bottom'
  return (
    <BaseDrawer.Root
      open={show}
      onOpenChange={open => { if (!open) onHide?.() }}
      swipeDirection={bottom ? 'down' : 'right'}
    >
      <BaseDrawer.Portal>
        <BaseDrawer.Backdrop className={styles.backdrop} />
        <BaseDrawer.Viewport className={cn(styles.viewport, bottom ? styles.viewportBottom : styles.viewportEnd)}>
          <BaseDrawer.Popup className={cn(styles.popup, bottom ? styles.bottom : styles.end, className)}>
            {children}
          </BaseDrawer.Popup>
        </BaseDrawer.Viewport>
      </BaseDrawer.Portal>
    </BaseDrawer.Root>
  )
}

function DrawerHeader ({ closeButton, className, children, ...props }) {
  return (
    <div className={cn('flex items-center justify-between p-4', className)} {...props}>
      {children}
      {closeButton &&
        <BaseDrawer.Close className={styles.close} aria-label='Close'>X</BaseDrawer.Close>}
    </div>
  )
}

function DrawerTitle ({ className, ...props }) {
  return <BaseDrawer.Title className={cn('m-0 text-lg leading-normal', className)} {...props} />
}

function DrawerBody ({ className, ...props }) {
  return <div className={cn('grow overflow-y-auto p-4', className)} {...props} />
}

Drawer.Header = DrawerHeader
Drawer.Title = DrawerTitle
Drawer.Body = DrawerBody
