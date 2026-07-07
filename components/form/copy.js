import { useCallback, useState } from 'react'
import copy from 'clipboard-copy'
import Button from '@/components/ui/button'
import Thumb from '@/svgs/thumb-up-fill.svg'
import Clipboard from '@/svgs/clipboard-line.svg'
import { useToast } from '@/components/toast'
import styles from '@/components/form.module.css'
import InputGroup from './input-group'
import { Input } from './input'

export function CopyButton ({ value, icon, append, ...props }) {
  const toaster = useToast()
  const [copied, setCopied] = useState(false)

  const handleClick = useCallback(async () => {
    try {
      await copy(value)
      toaster.success('copied')
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      toaster.danger('failed to copy')
    }
  }, [toaster, value])

  if (icon) {
    return (
      <InputGroup.Text style={{ cursor: 'pointer' }} onClick={handleClick}>
        <Clipboard height={20} width={20} />
      </InputGroup.Text>
    )
  }

  if (append) {
    return (
      <span className={styles.appendButton} {...props} onClick={handleClick}>
        {append}
      </span>
    )
  }

  return (
    <Button className={styles.appendButton} {...props} onClick={handleClick}>
      {copied ? <Thumb width={18} height={18} /> : 'copy'}
    </Button>
  )
}

export function CopyInput (props) {
  return (
    <Input
      append={
        <CopyButton value={props.placeholder} size={props.size} />
      }
      {...props}
    />
  )
}
