import { useField, useFormikContext } from 'formik'
import { OTPField } from '@base-ui/react/otp-field'
import { cn } from '@/lib/cn'
import { controlClasses, FormGroup, Feedback } from './field'

// Base UI OTP Field (C9b) — replaces ~80 lines of hand-rolled paste/backspace/
// arrow focus bookkeeping. Public API preserved (sole consumer: pages/email.js).
// autoSubmit stays OFF (parity, §9). `charLength`/`showSequence` are accepted
// for API compatibility; OTP boxes are single-character and unnumbered.
export function MultiInput ({
  name, label, groupClassName, length = 4, charLength = 1, upperCase, showSequence,
  onChange, autoFocus, hideError, inputType = 'text',
  ...props
}) {
  const formik = useFormikContext()
  const [field, meta, helpers] = useField({ name })

  return (
    <FormGroup label={label} className={groupClassName}>
      <OTPField.Root
        length={length}
        value={field.value || ''}
        validationType={inputType === 'number' ? 'numeric' : 'alphanumeric'}
        normalizeValue={upperCase ? v => v.toUpperCase() : undefined}
        onValueChange={(value) => {
          helpers.setValue(value)
          onChange?.(value)
        }}
        className='flex flex-row justify-center gap-2'
        {...props}
      >
        {Array.from({ length }, (_, index) => (
          <OTPField.Input
            key={index}
            autoFocus={autoFocus && index === 0}
            className={cn(controlClasses(), 'text-center w-11 grow-0')}
            aria-label={`character ${index + 1} of ${length}`}
          />
        ))}
      </OTPField.Root>
      <div>
        {hideError && formik.submitCount > 0 && meta.touched && meta.error && ( // custom error message is showed if hideError is true
          <Feedback className='block'>
            {meta.error}
          </Feedback>
        )}
      </div>
    </FormGroup>
  )
}
