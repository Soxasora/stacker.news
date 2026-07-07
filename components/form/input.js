import { useCallback, useEffect } from 'react'
import { useField, useFormikContext } from 'formik'
import Button from '@/components/ui/button'
import CloseIcon from '@/svgs/close-line.svg'
import { numWithUnits } from '@/lib/format'
import { debounce } from '@/components/use-debounce-callback'
import { useIsClient } from '@/components/use-client'
import styles from '@/components/form.module.css'
import { FormGroup, FormControl, FormText, Feedback } from './field'
import InputGroup from './input-group'
import useFieldDraft from './use-field-draft'

export function InputInner ({
  prepend, append, hint, warn, showValid, onChange, onBlur, overrideValue, appendValue,
  innerRef, noForm, clear, onKeyDown, inputGroupClassName, debounce: debounceTime, maxLength, hideError,
  AppendColumn, ...props
}) {
  const [field, meta, helpers] = noForm ? [{}, {}, {}] : useField(props)
  const formik = noForm ? null : useFormikContext()
  const { storageKey, writeDraft, readDraft, clearDraft } = useFieldDraft(props.name)
  const isClient = useIsClient()

  const onKeyDownInner = useCallback((e) => {
    const metaOrCtrl = e.metaKey || e.ctrlKey
    if (metaOrCtrl) {
      if (e.key === 'Enter') formik?.submitForm()
    }

    if (onKeyDown) onKeyDown(e)
  }, [formik?.submitForm, onKeyDown])

  const onChangeInner = useCallback((e) => {
    field?.onChange(e)

    writeDraft(e.target.value)

    if (onChange) {
      onChange(formik, e)
    }
  }, [field?.onChange, writeDraft, onChange])

  const onBlurInner = useCallback((e) => {
    field?.onBlur?.(e)
    onBlur && onBlur(e)
  }, [field?.onBlur, onBlur])

  useEffect(() => {
    if (overrideValue) {
      helpers.setValue(overrideValue)
      writeDraft(overrideValue)
      onChange && onChange(formik, { target: { value: overrideValue } })
    } else if (storageKey) {
      const draft = readDraft()
      if (draft) {
        // for some reason we have to turn off validation to get formik to
        // not assume this is invalid
        const isNumeric = /^[0-9]+$/.test(draft)
        const numericExpected = typeof field.value === 'number'
        helpers.setValue(isNumeric && numericExpected ? parseInt(draft) : draft)
        onChange && onChange(formik, { target: { value: draft } })
      }
    }
  }, [overrideValue])

  useEffect(() => {
    if (appendValue) {
      const updatedValue = meta.value ? `${meta.value}\n${appendValue}` : appendValue
      helpers.setValue(updatedValue)
      writeDraft(updatedValue)
      innerRef?.current?.focus()
    }
  }, [appendValue])

  const invalid = (!formik || formik.submitCount > 0) && meta.touched && meta.error

  useEffect(debounce(() => {
    if (!noForm && !isNaN(debounceTime) && debounceTime > 0) {
      formik.validateForm()
    }
  }, debounceTime), [noForm, formik, field.value])

  const remaining = maxLength && maxLength - (field.value || '').length

  return (
    <>
      <div className='flex gap-4'>
        <div className='grow basis-0'>
          <InputGroup className={inputGroupClassName}>
            {prepend}
            <FormControl
              ref={innerRef}
              {...field}
              {...props}
              onKeyDown={onKeyDownInner}
              onChange={onChangeInner}
              onBlur={onBlurInner}
              isInvalid={!hideError && invalid} // if hideError is true, handle error showing separately
              isValid={showValid && meta.initialValue !== meta.value && meta.touched && !meta.error}
            />
            {(isClient && clear && field.value && !props.readOnly) &&
              <Button
                variant={null}
                onClick={(e) => {
                  helpers.setValue('')
                  clearDraft()
                  if (onChange) {
                    onChange(formik, { target: { value: '' } })
                  }
                }}
                className={`${styles.clearButton} ${styles.appendButton} ${invalid ? styles.isInvalid : ''}`}
              ><CloseIcon className='fill-grey' height={20} width={20} />
              </Button>}
            {append}
          </InputGroup>
          <Feedback show={!hideError && !!invalid}>
            {meta.touched && meta.error}
          </Feedback>
        </div>
        {AppendColumn && <AppendColumn className={meta.touched && meta.error ? 'invisible' : ''} />}
      </div>
      {hint && (
        <FormText>
          {hint}
        </FormText>
      )}
      {warn && (
        <FormText className='text-warning'>
          {warn}
        </FormText>
      )}
      {!warn && maxLength && !(meta.touched && meta.error && invalid) && (
        <FormText className={remaining < 0 ? 'text-danger' : 'text-muted'}>
          {`${numWithUnits(remaining, { abbreviate: false, unitSingular: 'character', unitPlural: 'characters' })} remaining`}
        </FormText>
      )}
    </>
  )
}

export function Input ({ label, groupClassName, under, ...props }) {
  return (
    <FormGroup label={label} className={groupClassName}>
      <InputInner {...props} />
      {under}
    </FormGroup>
  )
}

export function Client (Component) {
  return ({ initialValue, ...props }) => {
    // This component can be used for Formik fields
    // where the initial value is not available on first render.
    // Example: value is stored in localStorage which is fetched
    // after first render using an useEffect hook.
    const [,, helpers] = props.noForm ? [{}, {}, {}] : useField(props)

    useEffect(() => {
      initialValue && helpers.setValue(initialValue)
    }, [initialValue])

    return <Component {...props} />
  }
}

export const ClientInput = Client(Input)
