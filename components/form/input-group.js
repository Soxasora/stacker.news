import React from 'react'
import { cn } from '@/lib/cn'
import classNames from 'classnames'
import styles from './controls.module.css'

function GroupText ({ className, size, ...props }) {
  return (
    <span
      className={cn(styles.groupText,
        size === 'sm' ? 'px-2 py-1 text-sm rounded-sm' : 'px-4 py-1.5 text-base rounded-md',
        className)}
      {...props}
    />
  )
}

/**
 * SN InputGroup — flex composition, compound API preserved (rb drop-in).
 * Corner-joining is done by APPENDING positional radius utilities to each
 * child (PR2 risk 7: module radius rules would lose to the recipes'
 * layered-important radius utilities; appended longhand utilities win over
 * the recipes' shorthand in Tailwind's canonical order).
 */
export default function InputGroup ({ className, size, hasValidation, children, ...props }) {
  const items = React.Children.toArray(children)
  return (
    <div className={cn(styles.inputGroup, className)} {...props}>
      {items.map((child, i) => {
        if (!React.isValidElement(child) || items.length < 2) return child
        const positional = i === 0
          ? 'rounded-e-none'
          : i === items.length - 1
            ? 'rounded-s-none -ms-px'
            : 'rounded-none -ms-px'
        return React.cloneElement(child, {
          key: child.key ?? i,
          className: classNames(child.props.className, positional),
          // don't leak `size` onto DOM elements (it's the char-width attr there)
          ...(typeof child.type !== 'string' && size ? { size: child.props.size ?? size } : {})
        })
      })}
    </div>
  )
}

InputGroup.Text = GroupText
