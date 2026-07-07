import { Collapsible, CollapsiblePanel } from '@/components/ui/collapsible'
import ArrowRight from '@/svgs/arrow-right-s-fill.svg'
import ArrowDown from '@/svgs/arrow-down-s-fill.svg'
import { useEffect, useState } from 'react'
import classNames from 'classnames'
import { cn } from '@/lib/cn'
import styles from './accordian-item.module.css'

export default function AccordianItem ({ header, body, className, headerColor = 'var(--theme-grey)', show }) {
  const [open, setOpen] = useState(!!show)

  useEffect(() => {
    // follow `show` in both directions, like the old double effect did
    setOpen(!!show)
  }, [show])

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger
        render={<div role='button' tabIndex={0} />}
        nativeButton={false}
        className='pointer flex items-center'
      >
        {open
          ? <ArrowDown style={{ fill: headerColor }} height={20} width={20} />
          : <ArrowRight style={{ fill: headerColor }} height={20} width={20} />}
        <div style={{ color: headerColor }}>{header}</div>
      </Collapsible.Trigger>
      <CollapsiblePanel className={classNames('mt-2', className)}>
        {/* keyed remount on toggle — parity with the old <div key={activeKey}> */}
        <div key={open}>{body}</div>
      </CollapsiblePanel>
    </Collapsible.Root>
  )
}

export function AccordianCard ({ header, children, show, className }) {
  return (
    <Collapsible.Root defaultOpen={!!show} className={cn(styles.card, 'rounded-md', className)}>
      <Collapsible.Trigger className={styles.cardHeader}>
        {header}
      </Collapsible.Trigger>
      <CollapsiblePanel>
        <div className={styles.cardBody}>
          {children}
        </div>
      </CollapsiblePanel>
    </Collapsible.Root>
  )
}
