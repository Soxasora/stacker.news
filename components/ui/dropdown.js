import { createContext, useContext } from 'react'
import { Menu } from '@base-ui/react/menu'
import { Separator } from '@base-ui/react/separator'
import { cn } from '@/lib/cn'
import styles from './dropdown.module.css'

/* chrome shared with the popover-shaped menus (table-of-contents) and the
   caret-anchored listboxes (mentions, BaseSuggest) that deliberately aren't
   Base UI Menus (deviations D3/D4/D5) */
export const dropdownStyles = styles
export const menuClasses = (className) => cn(styles.menu, 'py-2 rounded-md min-w-40 text-base', className)

const AlignContext = createContext('start')
const InMenuContext = createContext(false)

/**
 * SN Dropdown — drop-in for react-bootstrap's Dropdown on Base UI Menu.
 * Menus are modal={false} everywhere: no scroll-lock, no outside-pointer
 * blocking (locked decision, master plan risk 5).
 */
export default function Dropdown ({ children, className, align = 'start', as: As = 'div', autoClose, ...rootProps }) {
  return (
    <Menu.Root modal={false} {...rootProps}>
      <AlignContext.Provider value={align}>
        <As className={className}>{children}</As>
      </AlignContext.Provider>
    </Menu.Root>
  )
}

/* `variant` is accepted-and-dropped: rb only painted it through Button, and
   every SN toggle either passed as='a' (no btn classes at all) or
   variant='custom' (a class Bootstrap never generated) */
function DropdownToggle ({ as, className, children, variant, ...props }) {
  return (
    <Menu.Trigger
      render={as === 'a' ? <a role='button' tabIndex={0} /> : <button type='button' />}
      nativeButton={as !== 'a'}
      className={cn(styles.toggle, 'whitespace-nowrap', className)}
      {...props}
    >
      {children}
    </Menu.Trigger>
  )
}

function DropdownMenu ({ className, roomy, children, ...props }) {
  const align = useContext(AlignContext)
  return (
    <Menu.Portal>
      <Menu.Positioner side='bottom' align={align} sideOffset={2} className={styles.positioner}>
        <Menu.Popup className={cn(menuClasses(className), roomy && styles.roomy)} {...props}>
          <InMenuContext.Provider value>
            {children}
          </InMenuContext.Provider>
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  )
}

/**
 * Dual-mode item: inside a Dropdown.Menu it's a Base UI Menu.Item/LinkItem
 * (keyboard nav, highlight, close-on-click); outside one (mobile offcanvas
 * list) it renders the same skin as a plain element. `eventKey` is accepted
 * for rb API compatibility and dropped (active state comes via `active`).
 */
function DropdownItem ({ as: As, href, active, eventKey, className, children, disabled, ...props }) {
  const inMenu = useContext(InMenuContext)
  const cls = cn(styles.item, active && styles.active, className)

  if (inMenu) {
    if (href != null) {
      return (
        <Menu.LinkItem
          render={As ? <As href={href} /> : undefined}
          href={As ? undefined : href}
          closeOnClick
          className={cls}
          {...props}
        >
          {children}
        </Menu.LinkItem>
      )
    }
    return (
      <Menu.Item disabled={disabled} className={cls} {...props}>
        {children}
      </Menu.Item>
    )
  }

  if (href != null) {
    const LinkEl = As || 'a'
    return <LinkEl href={href} className={cls} {...props}>{children}</LinkEl>
  }
  return <button type='button' disabled={disabled} className={cls} {...props}>{children}</button>
}

function DropdownDivider ({ className, ...props }) {
  const inMenu = useContext(InMenuContext)
  if (inMenu) {
    return <Separator className={cn(styles.divider, className)} {...props} />
  }
  return <hr className={cn(styles.divider, className)} {...props} />
}

Dropdown.Toggle = DropdownToggle
Dropdown.Menu = DropdownMenu
Dropdown.Item = DropdownItem
Dropdown.Divider = DropdownDivider
