import { useField } from 'formik'
import { cn } from '@/lib/cn'
import formStyles from '@/components/form.module.css'
import styles from './controls.module.css'
import { FormGroup, FormLabel, Feedback } from './field'
import { Client } from './input'

export function Checkbox ({
  children, label, groupClassName, type = 'checkbox',
  hiddenLabel, extra, handleChange, inline, disabled, ...props
}) {
  // React treats radios and checkbox inputs differently other input types, select, and textarea.
  // Formik does this too! When you specify `type` to useField(), it will
  // return the correct bag of props for you
  const [field, meta, helpers] = useField({ ...props, type })
  const id = props.id || props.name
  return (
    <FormGroup className={groupClassName}>
      {hiddenLabel && <FormLabel className='invisible'>{label}</FormLabel>}
      <div className={cn(styles.check, inline && styles.checkInline)}>
        <input
          id={id}
          className={cn(styles.checkInput, meta.touched && meta.error && styles.invalid)}
          {...field} {...props} disabled={disabled} type={type} onChange={(e) => {
            field.onChange(e)
            handleChange && handleChange(e.target.checked, helpers.setValue)
          }}
        />
        <label htmlFor={id} className={'inline-flex flex-nowrap items-center' + (disabled ? ' text-muted' : '')}>
          <div className='grow'>{label}</div>
          {extra &&
            <div className={formStyles.checkboxExtra}>
              {extra}
            </div>}
        </label>
      </div>
    </FormGroup>
  )
}

// legacy-shaped until C9b (feedback-only wrapper; Base UI CheckboxGroup lands there)
export function CheckboxGroup ({ label, groupClassName, children, ...props }) {
  const [, meta] = useField(props)
  return (
    <FormGroup label={label} className={groupClassName}>
      {children}
      {/* force the feedback to display with block */}
      <Feedback className='block'>
        {meta.touched && meta.error}
      </Feedback>
    </FormGroup>
  )
}

export const ClientCheckbox = Client(Checkbox)
