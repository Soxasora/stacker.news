import { cn } from '@/lib/cn'
import styles from './badge.module.css'

// devnotes: bootstrap used em values that are relative to the parent font size, let's keep it why not?
// see: playground badge section
const BASE = 'inline-block px-[0.65em] py-[0.35em] text-[0.75em] font-bold leading-none text-center whitespace-nowrap rounded-md'

/**
 * generates the class names for a badge based on the variant
 * @param {string} variant - The variant of the badge (omit for a skin-only badge)
 * @param {string} className - The extra class name(s) for the badge
 * @returns {string} The class names for the badge
 */
export function badgeClasses ({ variant, className } = {}) {
  return cn(styles.badge, variant && styles[variant], BASE, className)
}

/**
 * SN Badge component
 * @param {string} variant - The variant of the badge
 * @param {string} className - The extra class name for the badge
 */
export default function Badge ({ variant, className, ...props }) {
  return <span className={badgeClasses({ variant, className })} {...props} />
}
