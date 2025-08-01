import { useMutation, useLazyQuery } from '@apollo/client'
import { ADD_WALLET_LOG, WALLET_LOGS, DELETE_WALLET_LOGS } from '@/wallets/client/fragments'
import { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react'
import { Button } from 'react-bootstrap'
import { ModalClosedError, useShowModal } from '@/components/modal'
import { useToast } from '@/components/toast'
import { FAST_POLL_INTERVAL } from '@/lib/constants'
import { isTemplate } from '@/wallets/lib/util'
import { useDiagnostics } from '@/wallets/client/hooks/diagnostics'

const TemplateLogsContext = createContext({})

export function TemplateLogsProvider ({ children }) {
  const [templateLogs, setTemplateLogs] = useState([])

  const addTemplateLog = useCallback(({ level, message }) => {
    // TODO(wallet-v2): Date.now() might return the same value for two logs
    //   use window.performance.now() instead?
    setTemplateLogs(prev => [{ id: Date.now(), level, message, createdAt: new Date() }, ...prev])
  }, [])

  const clearTemplateLogs = useCallback(() => {
    setTemplateLogs([])
  }, [])

  const value = useMemo(() => ({
    templateLogs,
    addTemplateLog,
    clearTemplateLogs
  }), [templateLogs, addTemplateLog, clearTemplateLogs])

  return (
    <TemplateLogsContext.Provider value={value}>
      {children}
    </TemplateLogsContext.Provider>
  )
}

export function useWalletLoggerFactory () {
  const { addTemplateLog } = useContext(TemplateLogsContext)
  const [addWalletLog] = useMutation(ADD_WALLET_LOG)
  const [diagnostics] = useDiagnostics()

  const log = useCallback(({ protocol, level, message, invoiceId }) => {
    console[mapLevelToConsole(level)](`[${protocol ? protocol.name : 'system'}] ${message}`)

    if (protocol && isTemplate(protocol)) {
      // this is a template, so there's no protocol yet to which we could attach logs in the db
      addTemplateLog?.({ level, message })
      return
    }

    return addWalletLog({ variables: { protocolId: protocol ? Number(protocol.id) : null, level, message, invoiceId, timestamp: new Date() } })
      .catch(err => {
        console.error('error adding wallet log:', err)
      })
  }, [addWalletLog, addTemplateLog])

  return useCallback((protocol, invoice) => {
    const invoiceId = invoice ? Number(invoice.id) : null
    return {
      ok: (message) => {
        log({ protocol, level: 'OK', message, invoiceId })
      },
      info: (message) => {
        log({ protocol, level: 'INFO', message, invoiceId })
      },
      error: (message) => {
        log({ protocol, level: 'ERROR', message, invoiceId })
      },
      warn: (message) => {
        log({ protocol, level: 'WARN', message, invoiceId })
      },
      debug: (message) => {
        if (!diagnostics) return
        log({ protocol, level: 'DEBUG', message, invoiceId })
      }
    }
  }, [log, diagnostics])
}

export function useWalletLogger (protocol) {
  const loggerFactory = useWalletLoggerFactory()
  return useMemo(() => loggerFactory(protocol), [loggerFactory, protocol])
}

export function useWalletLogs (protocol, debug) {
  const { templateLogs, clearTemplateLogs } = useContext(TemplateLogsContext)

  const [cursor, setCursor] = useState(null)
  const [logs, setLogs] = useState([])

  // if no protocol was given, we want to fetch all logs
  const protocolId = protocol ? Number(protocol.id) : undefined

  // if we're configuring a protocol template, there are no logs to fetch
  const noFetch = protocol && isTemplate(protocol)
  const [fetchLogs, { called, loading, error }] = useLazyQuery(WALLET_LOGS, {
    variables: { protocolId, debug },
    skip: noFetch,
    fetchPolicy: 'network-only'
  })

  useEffect(() => {
    if (noFetch) return

    const interval = setInterval(async () => {
      const { data, error } = await fetchLogs({ variables: { protocolId, debug } })
      if (error) {
        console.error('failed to fetch wallet logs:', error.message)
        return
      }
      const { entries: updatedLogs, cursor } = data.walletLogs
      setLogs(logs => [...updatedLogs.filter(log => !logs.some(l => l.id === log.id)), ...logs])
      if (!called) {
        setCursor(cursor)
      }
    }, FAST_POLL_INTERVAL)

    return () => clearInterval(interval)
  }, [fetchLogs, called, noFetch, debug])

  const loadMore = useCallback(async () => {
    const { data } = await fetchLogs({ variables: { protocolId, cursor, debug } })
    const { entries: cursorLogs, cursor: newCursor } = data.walletLogs
    setLogs(logs => [...logs, ...cursorLogs.filter(log => !logs.some(l => l.id === log.id))])
    setCursor(newCursor)
  }, [fetchLogs, cursor, protocolId, debug])

  const clearLogs = useCallback(() => {
    setLogs([])
    clearTemplateLogs?.()
    setCursor(null)
  }, [clearTemplateLogs])

  return useMemo(() => {
    return {
      loading: noFetch ? false : (!called ? true : loading),
      logs: noFetch ? templateLogs : logs,
      error,
      loadMore,
      hasMore: cursor !== null,
      clearLogs
    }
  }, [loading, noFetch, called, templateLogs, logs, error, loadMore, clearLogs])
}

function mapLevelToConsole (level) {
  switch (level) {
    case 'OK':
    case 'INFO':
      return 'info'
    case 'ERROR':
      return 'error'
    case 'WARN':
      return 'warn'
    default:
      return 'log'
  }
}

export function useDeleteWalletLogs (protocol, debug) {
  const showModal = useShowModal()

  return useCallback(async () => {
    return await new Promise((resolve, reject) => {
      const onClose = () => {
        reject(new ModalClosedError())
      }

      showModal(close => {
        const onDelete = () => {
          resolve()
          close()
        }

        const onClose = () => {
          reject(new ModalClosedError())
          close()
        }

        return (
          <DeleteWalletLogsObstacle
            protocol={protocol}
            onClose={onClose}
            onDelete={onDelete}
            debug={debug}
          />
        )
      }, { onClose })
    })
  }, [showModal])
}

function DeleteWalletLogsObstacle ({ protocol, onClose, onDelete, debug }) {
  const toaster = useToast()
  const [deleteWalletLogs] = useMutation(DELETE_WALLET_LOGS)

  const deleteLogs = useCallback(async () => {
    // there are no logs to delete on the server if protocol is a template
    if (protocol && isTemplate(protocol)) return

    await deleteWalletLogs({
      variables: { protocolId: protocol ? Number(protocol.id) : undefined, debug }
    })
  }, [protocol, deleteWalletLogs, debug])

  const onClick = useCallback(async () => {
    try {
      await deleteLogs()
      onDelete()
      onClose()
      toaster.success('deleted wallet logs')
    } catch (err) {
      console.error('failed to delete wallet logs:', err)
      toaster.danger('failed to delete wallet logs')
    }
  }, [onClose, deleteLogs, toaster])

  let prompt = debug ? 'Do you really want to delete all debug logs?' : 'Do you really want to delete all logs?'
  if (protocol) {
    prompt = 'Do you really want to delete all logs of this protocol?'
  }

  return (
    <div className='text-center'>
      {prompt}
      <div className='d-flex align-items-center mt-3 mx-auto'>
        <span style={{ cursor: 'pointer' }} className='d-flex ms-auto text-muted fw-bold nav-link mx-3' onClick={onClose}>cancel</span>
        <Button
          className='d-flex me-auto mx-3' variant='danger'
          onClick={onClick}
        >delete
        </Button>
      </div>
    </div>
  )
}
