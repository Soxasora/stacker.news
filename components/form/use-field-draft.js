import { useCallback, useContext } from 'react'
import { StorageKeyPrefixContext } from './form'

// drafts (C9a) — extracted from InputInner, SAME localStorage keys:
// `${storageKeyPrefix}-${name}`
export default function useFieldDraft (name) {
  const storageKeyPrefix = useContext(StorageKeyPrefixContext)
  const storageKey = storageKeyPrefix ? storageKeyPrefix + '-' + name : undefined

  const writeDraft = useCallback((value) => {
    if (storageKey) window.localStorage.setItem(storageKey, value)
  }, [storageKey])

  const readDraft = useCallback(() => {
    return storageKey ? window.localStorage.getItem(storageKey) : undefined
  }, [storageKey])

  const clearDraft = useCallback(() => {
    if (storageKey) window.localStorage.removeItem(storageKey)
  }, [storageKey])

  return { storageKey, writeDraft, readDraft, clearDraft }
}
