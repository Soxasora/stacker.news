import { FieldArray } from 'formik'
import AddIcon from '@/svgs/add-fill.svg'
import { FormGroup, FormText, Feedback } from './field'
import { InputInner } from './input'

export function VariableInput ({ label, groupClassName, name, hint, max, min, readOnlyLen, children, emptyItem = '', ...props }) {
  return (
    <FormGroup label={label} className={groupClassName}>
      <FieldArray name={name} hasValidation>
        {({ form, ...fieldArrayHelpers }) => {
          const options = form.values[name]

          return (
            <>
              {options?.map((_, i) => {
                const AppendColumn = ({ className }) => (
                  <div className={`flex ${className}`}>
                    {options.length - 1 === i && options.length !== max
                      // onMouseDown is used to prevent the blur event on text inputs from overriding the click event
                      ? <AddIcon className='fill-grey self-center justify-self-center pointer' onMouseDown={() => fieldArrayHelpers.push(emptyItem)} />
                      // filler div for col alignment across rows
                      : <div style={{ width: '24px', height: '24px' }} />}
                  </div>
                )
                return (
                  <div key={i} className='mb-2'>
                    {children
                      ? children({ index: i, readOnly: i < readOnlyLen, placeholder: i >= min ? 'optional' : undefined, AppendColumn })
                      : <InputInner name={`${name}[${i}]`} {...props} readOnly={i < readOnlyLen} placeholder={i >= min ? 'optional' : undefined} AppendColumn={AppendColumn} />}

                    {options.length - 1 === i &&
                      <>
                        {hint && <FormText>{hint}</FormText>}
                        {form.touched[name] && typeof form.errors[name] === 'string' &&
                          <Feedback className='block'>{form.errors[name]}</Feedback>}
                      </>}
                  </div>
                )
              })}
            </>
          )
        }}
      </FieldArray>
    </FormGroup>
  )
}
