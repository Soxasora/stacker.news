import { useRouter } from 'next/router'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import Button from '@/components/ui/button'
import { cn } from '@/lib/cn'
import styles from './toast.module.css'

const ToastContext = createContext(() => {})

export const TOAST_DEFAULT_DELAY_MS = 5000

const mapHidden = ({ id, tag }) => toast => {
  // mark every previous toast with same tag as hidden
  if (toast.tag === tag && toast.id !== id) return { ...toast, hidden: true }
  return toast
}

// render layer only (deviation D2): plain divs, role='status'; the state
// machine below is byte-for-byte the react-bootstrap-era one. Autohide is a
// plain mount-scoped timer — merged "(N) msg" toasts remount under the new
// toast's id, which restarts it exactly like rb's remounting Toast did.
function ToastView ({ toast, onCloseClick, onAutohide }) {
  useEffect(() => {
    if (!toast.autohide) return
    const timeout = setTimeout(onAutohide, toast.delay)
    return () => clearTimeout(timeout)
  }, []) // mount-only on purpose: one timer per toast instance, like rb's Toast

  const textStyle = toast.variant === 'warning' ? 'text-black' : ''
  // a toast is unhidden if it was hidden before since it now gets rendered
  const unhidden = toast.hidden
  // we only need to start the animation at a different timing when it was hidden by another toast before.
  // if we don't do this, the animation for rerendered toasts skips ahead and toast delay and animation get out of sync.
  const elapsed = (+new Date() - toast.createdAt)
  const animationDelay = unhidden ? `-${elapsed}ms` : undefined
  const animationDuration = `${toast.delay}ms`

  return (
    <div role='status' className={cn(styles.toast, styles[toast.variant], textStyle, 'rounded-md')}>
      <div className='py-3 px-5 wrap-break-word'>
        <div className='flex items-center'>
          <div className='grow overflow-hidden'>{toast.body}</div>
          <Button
            variant={null}
            className='p-0 ps-2'
            aria-label='close'
            onClick={onCloseClick}
          ><div className={`${styles.toastClose} ${textStyle}`}>X</div>
          </Button>
        </div>
      </div>
      {toast.progressBar && <div className={`${styles.progressBar} ${styles[toast.variant]}`} style={{ animationDuration, animationDelay }} />}
    </div>
  )
}

export const ToastProvider = ({ children }) => {
  const router = useRouter()
  const [toasts, setToasts] = useState([])
  const toastId = useRef(0)

  const removeToast = useCallback(({ id, tag }) => {
    setToasts(toasts => toasts.filter(toast => {
      if (toast.id === id) {
        // remove the toast with the passed id with no exceptions
        return false
      }
      const sameTag = tag && tag === toast.tag
      // remove toasts with same tag
      return !sameTag
    }))
  }, [setToasts])

  const dispatchToast = useCallback((toast) => {
    toast = {
      ...toast,
      createdAt: +new Date(),
      id: toastId.current++
    }
    setToasts(toasts => [...toasts, toast].map(mapHidden(toast)))
    return () => removeToast(toast)
  }, [setToasts, removeToast])

  const toaster = useMemo(() => ({
    success: (body, options) => {
      const toast = {
        body,
        variant: 'success',
        autohide: true,
        delay: TOAST_DEFAULT_DELAY_MS,
        tag: options?.tag || body,
        ...options
      }
      return dispatchToast(toast)
    },
    warning: (body, options) => {
      const toast = {
        body,
        variant: 'warning',
        autohide: true,
        delay: TOAST_DEFAULT_DELAY_MS,
        tag: options?.tag || body,
        ...options
      }
      return dispatchToast(toast)
    },
    danger: (body, options) => {
      const toast = {
        body,
        variant: 'danger',
        autohide: false,
        tag: options?.tag || body,
        ...options
      }
      return dispatchToast(toast)
    }
  }), [dispatchToast, removeToast])

  // Only clear toasts with no cancel function on page navigation
  // since navigation should not interfere with being able to cancel an action.
  useEffect(() => {
    const handleRouteChangeStart = () => setToasts(toasts => toasts.length > 0 ? toasts.filter(({ persistOnNavigate }) => persistOnNavigate) : toasts)
    router.events.on('routeChangeStart', handleRouteChangeStart)

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart)
    }
  }, [router.events, setToasts])

  // this function merges toasts with the same tag into one toast.
  // for example: 3x 'zap pending' -> '(3) zap pending'
  const tagReducer = (toasts, toast) => {
    const { tag } = toast

    // has tag?
    if (!tag) return [...toasts, toast]

    // existing tag?
    const idx = toasts.findIndex(toast => toast.tag === tag)
    if (idx === -1) return [...toasts, toast]

    // merge toasts with same tag
    const prevToast = toasts[idx]
    let { amount } = prevToast
    amount = amount ? amount + 1 : 2
    const body = `(${amount}) ${toast.body}`
    return [
      ...toasts.slice(0, idx),
      { ...toast, amount, body },
      ...toasts.slice(idx + 1)
    ]
  }

  // only show toast with highest ID of each tag
  const visibleToasts = toasts.reduce(tagReducer, [])

  return (
    <ToastContext.Provider value={toaster}>
      <div className={`pb-4 px-4 ${styles.toastContainer}`}>
        {visibleToasts.map(toast => (
          <ToastView
            key={toast.id}
            toast={toast}
            onAutohide={() => removeToast(toast)}
            onCloseClick={() => {
              toast.onClose?.()
              removeToast(toast)
            }}
          />
        ))}
      </div>
      {children}
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
