import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip'
import { cn } from '@/lib/cn'
import styles from './tooltip.module.css'

// popper parity: preferred side is kept even when it overflows the viewport
const COLLISIONS_OFF = { side: 'none', align: 'none', fallbackAxisSide: 'none' }

// _app.js mounts this once: delay 0/0 = parity with the old rb overlay
// defaults (Base UI's Trigger default is 600ms); grouping timeout keeps its
// 400ms native default
export function TooltipProvider ({ children }) {
  return <BaseTooltip.Provider delay={0} closeDelay={0}>{children}</BaseTooltip.Provider>
}

/**
 * SN Tooltip — children must be a single element that spreads props and
 * forwards ref (DOM tags qualify); it stays in place, only the popup portals
 */
export default function Tooltip ({ children, content, side = 'bottom', delay, closeDelay, disabled, className }) {
  if (!content) return children
  return (
    <BaseTooltip.Root disabled={disabled}>
      <BaseTooltip.Trigger render={children} delay={delay} closeDelay={closeDelay} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner side={side} sideOffset={6} collisionAvoidance={COLLISIONS_OFF} className={styles.positioner}>
          <BaseTooltip.Popup className={cn(styles.popup, 'px-2 py-1 text-sm leading-none text-center wrap-break-word max-w-48 rounded-md', className)}>
            <BaseTooltip.Arrow className={styles.arrow} />
            {content}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  )
}
