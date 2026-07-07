import { forwardRef } from 'react'
import { cn } from '@/lib/cn'
import styles from './controls.module.css'

/*
 * form presentation primitives (C9a) — leaf module so editor.js and
 * table-of-contents.js can import without pulling the whole form barrel
 * (which imports the editor: cycle)
 */

/* .42/.84rem painted → the C9a alignment contract: inputs share Button md's
   native steps (px-4 py-1.5 — see the C2.5 warning in ui/button.js) */
export const controlClasses = (size, className) =>
  cn(styles.control,
    size === 'sm' ? 'px-2 py-1 text-sm rounded-sm' : 'px-4 py-1.5 text-base rounded-md',
    className)

/* the old .form-label paint: 92% bold → text-sm nearest step */
export const labelClasses = (className) => cn(styles.label, 'inline-block mb-2 font-bold text-sm', className)

export function FormLabel ({ className, ...props }) {
  return <label className={labelClasses(className)} {...props} />
}

export const FormControl = forwardRef(function FormControl ({
  as: As = 'input', size, isInvalid, isValid, className, ...props
}, ref) {
  return (
    <As
      ref={ref}
      className={cn(controlClasses(size), isInvalid && styles.invalid, isValid && styles.valid, className)}
      {...props}
    />
  )
})

/* BS .form-text (.875em, .25rem top) → nearest steps; cn so a consumer
   text-warning/text-danger overrides the muted base */
export function FormText ({ className, ...props }) {
  return <div className={cn('block mt-1 text-sm text-muted', className)} {...props} />
}

/* rb's Feedback showed via the CSS sibling gate (.is-invalid ~ .invalid-feedback);
   ours gates in JS: pass `show` (or force with className='block' like the old
   d-block sites) */
export function Feedback ({ show = true, className, children, ...props }) {
  if (!show || !children) return null
  return (
    <div className={cn('w-full mt-1 text-sm text-danger', className)} {...props}>
      {children}
    </div>
  )
}

export function FormGroup ({ className, label, children }) {
  return (
    <div className={cn('mb-4', className)}>
      {label && <FormLabel>{label}</FormLabel>}
      {children}
    </div>
  )
}
