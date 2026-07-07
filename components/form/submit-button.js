import { useFormikContext } from 'formik'
import classNames from 'classnames'
import Button from '@/components/ui/button'

export function SubmitButton ({
  children, variant, valueName = 'submit', value, onClick, disabled, appendText, submittingText,
  className, ...props
}) {
  const formik = useFormikContext()

  disabled ||= formik.isSubmitting
  submittingText ||= children

  return (
    <Button
      // 'main' is a historical phantom variant — no skin exists, base .btn only
      variant={variant || 'main'}
      className={classNames(formik.isSubmitting && 'pulse', className)}
      type='submit'
      disabled={disabled}
      onClick={value
        ? e => {
          formik.setFieldValue(valueName, value)
          onClick && onClick(e)
        }
        : onClick}
      {...props}
    >
      {formik.isSubmitting
        ? submittingText
        : (
          <>
            {children}
            {appendText && <small> {appendText}</small>}
          </>
          )}
    </Button>
  )
}
