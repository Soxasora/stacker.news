import { createContext, useContext } from 'react'
import { cn } from '@/lib/cn'
import styles from './nav.module.css'

const NavContext = createContext({})

/* for raw nav-link-shaped links (footer, cancel button) — colors ride the
   module; the data attr is the stable hook consumer modules key off */
export const navLinkClasses = (className) => cn(styles.navLink, className)

/**
 * SN Nav — plain markup + active-key context, drop-in for react-bootstrap's
 * Nav. Consumer modules customize instances via the [data-nav-link] /
 * [data-active] attributes (never by racing our module classes).
 */
export default function Nav ({ className, activeKey, children, ...props }) {
  return (
    <NavContext.Provider value={{ activeKey }}>
      <div className={cn('flex flex-wrap', className)} {...props}>
        {children}
      </div>
    </NavContext.Provider>
  )
}

function NavItem ({ className, ...props }) {
  return <div className={cn(styles.navItem, className)} {...props} />
}

function NavLink ({ as: As = 'a', eventKey, active, className, ...props }) {
  const { activeKey } = useContext(NavContext)
  const isActive = active ?? (eventKey != null && eventKey === activeKey)
  return (
    <As
      data-nav-link=''
      data-active={isActive || undefined}
      className={cn(styles.navLink, isActive && styles.active, className)}
      {...props}
    />
  )
}

export function Navbar ({ className, children, ...props }) {
  return <nav className={cn(styles.navbar, className)} {...props}>{children}</nav>
}

function NavbarBrand ({ as: As = 'a', className, ...props }) {
  return <As className={cn(styles.brand, className)} {...props} />
}

Nav.Item = NavItem
Nav.Link = NavLink
Navbar.Brand = NavbarBrand
