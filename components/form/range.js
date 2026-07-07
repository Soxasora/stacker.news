import { useEffect } from 'react'
import { useField } from 'formik'
import { controlClasses, FormGroup, FormText, Feedback } from './field'
import InputGroup from './input-group'

// legacy-shaped until C9b (Base UI Slider + NumberField land there, §6.6).
// the native range keeps Bootstrap's .form-range paint until then — the
// class is served by Bootstrap CSS through PR2 and dies with the C9b rewrite
export function Range ({
  label, groupClassName, hint, min, max, step = 1, onChange,
  suffix, allOption, labels, ...props
}) {
  const [field, meta, helpers] = useField(props)
  const isAll = allOption && field.value == null
  const sliderMin = allOption ? min - step : min

  // Clamp value when min/max changes
  useEffect(() => {
    if (field.value == null) return
    if (field.value < min) {
      helpers.setValue(min)
    } else if (field.value > max) {
      helpers.setValue(max)
    }
  }, [min, max])

  return (
    <FormGroup label={label} className={groupClassName}>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', columnGap: '1rem', alignItems: 'center' }}>
        {allOption
          ? <span className='text-muted' style={{ whiteSpace: 'nowrap' }}>- <span style={{ display: 'inline-block', transform: 'scale(1.4)', transformOrigin: 'center' }}>∞</span></span>
          : <small className='text-muted font-mono'>{min}</small>}
        <input
          type='range'
          className='form-range'
          {...field}
          {...props}
          min={sliderMin}
          max={max}
          step={step}
          value={isAll ? sliderMin : field.value}
          onChange={(e) => {
            const val = Number(e.target.value)
            if (allOption && val <= sliderMin) {
              helpers.setValue(null)
            } else {
              helpers.setValue(val)
            }
            onChange && onChange(e)
          }}
        />
        <small className='text-muted font-mono'>{max}</small>
        <InputGroup className='flex-nowrap' style={{ width: 'auto' }}>
          {isAll
            ? <span className={controlClasses(undefined, 'px-2')} style={{ width: '4rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25em' }}>-<span style={{ display: 'inline-block', transform: 'scale(1.4)', transformOrigin: 'center' }}>∞</span></span>
            : <input
                type='number'
                min={min}
                max={max}
                step={step}
                value={field.value}
                className={controlClasses(undefined, 'text-end hide-spinners px-2')}
                style={{ width: '4rem' }}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  if (!isNaN(val)) {
                    helpers.setValue(val)
                  }
                  onChange && onChange(e)
                }}
                onBlur={(e) => {
                  const val = Number(e.target.value)
                  if (!isNaN(val)) {
                    helpers.setValue(Math.min(max, Math.max(min, val)))
                  }
                  field.onBlur(e)
                }}
              />}
          {suffix && <InputGroup.Text>{suffix.trim()}</InputGroup.Text>}
        </InputGroup>
        {labels?.length > 0 && (
          <div className='relative' style={{ gridColumn: 2, height: '1.2em' }}>
            {labels.map(({ value, label: tickLabel }) => {
              const pct = ((value - sliderMin) / (max - sliderMin)) * 100
              return (
                <span
                  key={value}
                  className='text-muted'
                  style={{
                    position: 'absolute',
                    left: `${pct}%`,
                    transform: 'translateX(-50%)',
                    fontSize: '80%',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tickLabel}
                </span>
              )
            })}
          </div>
        )}
      </div>
      {hint && <FormText>{hint}</FormText>}
      <Feedback className='block'>
        {meta.touched && meta.error}
      </Feedback>
    </FormGroup>
  )
}
