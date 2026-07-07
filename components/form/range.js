import { useEffect } from 'react'
import { useField } from 'formik'
import { Slider } from '@base-ui/react/slider'
import { NumberField } from '@base-ui/react/number-field'
import styles from './controls.module.css'
import { controlClasses, FormGroup, FormText, Feedback } from './field'
import InputGroup from './input-group'

// Base UI Slider + Number Field (§6.6, C9b). Formik is the single source of
// truth; both widgets are controlled from field.value and only user events
// write back (echo-loop risk 3). The ∞ sentinel transfers verbatim: null ⇒
// thumb pinned one step below min ⇒ ∞ chip instead of the number field.
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
        <Slider.Root
          min={sliderMin}
          max={max}
          step={step}
          value={isAll ? sliderMin : field.value}
          onValueChange={(v) => {
            if (allOption && v <= sliderMin) {
              helpers.setValue(null)
            } else {
              helpers.setValue(v)
            }
            onChange && onChange({ target: { value: v } })
          }}
        >
          <Slider.Control className={styles.sliderControl}>
            <Slider.Track className={styles.sliderTrack}>
              <Slider.Indicator className={styles.sliderIndicator} />
              <Slider.Thumb className={styles.sliderThumb} aria-label={props.name} />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
        <small className='text-muted font-mono'>{max}</small>
        <InputGroup className='flex-nowrap' style={{ width: 'auto' }}>
          {isAll
            ? <span className={controlClasses(undefined, 'px-2')} style={{ width: '4rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25em' }}>-<span style={{ display: 'inline-block', transform: 'scale(1.4)', transformOrigin: 'center' }}>∞</span></span>
            : (
              <NumberField.Root
                min={min}
                max={max}
                step={step}
                value={field.value}
                // Intl grouping would print 1,000 where the old input printed 1000
                format={{ useGrouping: false }}
                onValueChange={(v) => {
                  if (v != null && !isNaN(v)) {
                    helpers.setValue(v)
                  }
                  onChange && onChange({ target: { value: v } })
                }}
              >
                <NumberField.Group>
                  {/* clamp-on-blur is native; a text input, so the old hide-spinners hack died */}
                  <NumberField.Input
                    className={controlClasses(undefined, 'text-end px-2')}
                    style={{ width: '4rem' }}
                  />
                </NumberField.Group>
              </NumberField.Root>
              )}
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
