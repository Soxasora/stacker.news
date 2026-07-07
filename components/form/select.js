import { useEffect } from 'react'
import { useField, useFormikContext } from 'formik'
import { cn } from '@/lib/cn'
import Info from '@/components/info'
import styles from './controls.module.css'
import { FormGroup, FormText, Feedback } from './field'

// native <select> styled to the SN .form-select spec (deviation D6:
// optgroups + native mobile picker parity)
export function Select ({ label, items, info, groupClassName, onChange, noForm, overrideValue, hint, className, ...props }) {
  const [field, meta, helpers] = noForm ? [{}, {}, {}] : useField(props)
  const formik = noForm ? null : useFormikContext()
  const invalid = meta.touched && meta.error

  useEffect(() => {
    if (overrideValue) {
      helpers.setValue(overrideValue)
    }
  }, [overrideValue])

  return (
    <FormGroup label={label} className={groupClassName}>
      <span className='flex items-center'>
        <select
          {...field} {...props}
          className={cn(styles.select, className)}
          onChange={(e) => {
            if (field?.onChange) {
              field.onChange(e)
            }

            if (onChange) {
              onChange(formik, e)
            }
          }}
        >
          {items.map(item => {
            if (item && typeof item === 'object') {
              return (
                <optgroup key={item.label} label={item.label}>
                  {item.items.map(item => <option key={item}>{item}</option>)}
                </optgroup>
              )
            } else {
              return <option key={item}>{item}</option>
            }
          })}
        </select>
        {info && <Info>{info}</Info>}
      </span>
      <Feedback show={!!invalid}>
        {meta.touched && meta.error}
      </Feedback>
      {hint &&
        <FormText>
          {hint}
        </FormText>}
    </FormGroup>
  )
}
