import { Collapsible as BaseCollapsible } from '@base-ui/react/collapsible'
import { cn } from '@/lib/cn'
import styles from './collapsible.module.css'

/* thin structural wrapper (AccordianItem + the C12 pills share it):
   Base UI Collapsible parts + the keystone-5 ~150ms height motion */
export const Collapsible = BaseCollapsible

export function CollapsiblePanel ({ className, ...props }) {
  return <BaseCollapsible.Panel className={cn(styles.panel, className)} {...props} />
}
