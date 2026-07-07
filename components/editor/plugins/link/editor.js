import { useCallback, useEffect, useRef, useState } from 'react'
import { Popover } from '@base-ui/react/popover'
import { $findMatchingParent, mergeRegister } from '@lexical/utils'
import { $createLinkNode, $isAutoLinkNode, $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  COMMAND_PRIORITY_HIGH,
  KEY_ESCAPE_COMMAND,
  $getSelection, $isNodeSelection, $isRangeSelection, isCurrentlyReadOnlyMode
} from 'lexical'
import Check from '@/svgs/check-line.svg'
import Pencil from '@/svgs/edit-line.svg'
import { getSelectedNode } from '@/lib/lexical/commands/utils'
import { ensureProtocol } from '@/lib/url'
import styles from './linkeditor.module.css'
import { UNKNOWN_LINK_REL } from '@/lib/constants'
import CloseIcon from '@/svgs/close-line.svg'
import UnlinkIcon from '@/svgs/editor/toolbar/inline/link-unlink.svg'
import { DEFAULT_URL } from '@/lib/lexical/commands/links'

// anchored Popover (§6.3, C8c): floating-ui tracks the link element through
// scroll/resize, killing the old rAF/setFloatingElemPosition machinery
export default function LinkEditor ({ nodeKey, anchorElem, onDismiss }) {
  const [isLinkEditMode, setIsLinkEditMode] = useState(false)
  const [editor] = useLexicalComposerContext()
  const inputRef = useRef(null)
  const [linkUrl, setLinkUrl] = useState('')
  const [editedLinkUrl, setEditedLinkUrl] = useState('')

  const handleCancel = useCallback(() => {
    onDismiss()
    // don't toggle link if the editor is currently read-only
    // e.g. lexical reconciliation during a markdown-to-rich mode switch
    if (isCurrentlyReadOnlyMode()) return
    if (linkUrl === '' || linkUrl === DEFAULT_URL) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
    }
  }, [onDismiss, editor, linkUrl])

  useEffect(() => {
    if (isLinkEditMode) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isLinkEditMode])

  const $updateLink = useCallback(() => {
    const selection = $getSelection()

    let linkNode = null
    if ($isRangeSelection(selection)) {
      linkNode = $findMatchingParent(getSelectedNode(selection), $isLinkNode)
    } else if ($isNodeSelection(selection)) {
      const node = selection.getNodes()[0]
      if (node) linkNode = $findMatchingParent(node, $isLinkNode)
    }

    if (!linkNode || linkNode.getKey() !== nodeKey) {
      setLinkUrl('')
      setEditedLinkUrl('')
      if (isLinkEditMode) setIsLinkEditMode(false)
      return
    }

    const newUrl = linkNode.getURL()
    setLinkUrl(newUrl)

    if (!isLinkEditMode && (newUrl.trim() === '' || newUrl.trim() === DEFAULT_URL)) {
      setEditedLinkUrl('')
      setIsLinkEditMode(true)
    }
  }, [isLinkEditMode, nodeKey])

  const handleLinkConfirm = useCallback(() => {
    const value = editedLinkUrl.trim()
    if (value !== '') {
      editor.update(() => {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, ensureProtocol(value))
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          const parent = getSelectedNode(selection).getParent()
          // replace auto link node with link node
          if ($isAutoLinkNode(parent)) {
            const linkNode = $createLinkNode(parent.getURL(), { target: '_blank', rel: UNKNOWN_LINK_REL })
            parent.replace(linkNode, true)
          }
        }
      })
    } else {
      onDismiss()
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
    }
    setEditedLinkUrl('')
    setIsLinkEditMode(false)
  }, [editedLinkUrl, editor, onDismiss])

  // editor updates, selection changes, escape key (the Lexical handler stays:
  // the Popover only sees Escape when focus is inside the popup)
  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateLink()
        })
      }),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          handleCancel()
          return false
        }, COMMAND_PRIORITY_HIGH)
    )
  }, [editor, $updateLink, handleCancel])

  // synchronous initial read so the url state is correct on the same frame
  useEffect(() => {
    editor.getEditorState().read(() => { $updateLink() })
  }, [editor, $updateLink])

  const anchor = useCallback(() => editor.getElementByKey(nodeKey), [editor, nodeKey])

  if (!anchorElem) return null

  return (
    <Popover.Root
      open
      modal={false}
      onOpenChange={open => { if (!open) handleCancel() }}
    >
      <Popover.Portal>
        <Popover.Positioner anchor={anchor} side='bottom' align='start' sideOffset={8} className={styles.positioner}>
          {/* view mode must NOT steal editor focus; edit mode focuses via the effect above */}
          <Popover.Popup initialFocus={false} className={styles.linkEditorContainer} data-node-key={nodeKey}>
            <div className={styles.linkEditor}>
              {isLinkEditMode
                ? (
                  <>
                    <input
                      ref={inputRef}
                      className={styles.linkInput}
                      value={editedLinkUrl}
                      placeholder='https://'
                      onChange={(e) => { setEditedLinkUrl(e.target.value) }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleLinkConfirm()
                        } else if (e.key === 'Escape') {
                          e.preventDefault()
                          handleCancel()
                        }
                      }}
                    />
                    <div className={styles.linkConfirmIcons}>
                      <span className={styles.linkCancelIcon} onMouseDown={(e) => e.preventDefault()} onClick={handleCancel}>
                        <CloseIcon />
                      </span>
                      <span className={styles.linkConfirmIcon} onMouseDown={(e) => e.preventDefault()} onClick={handleLinkConfirm}>
                        <Check />
                      </span>
                    </div>
                  </>
                  )
                : (
                  <>
                    <a
                      className={styles.linkView}
                      href={ensureProtocol(linkUrl)}
                      target='_blank'
                      rel='noreferrer nofollow noopener'
                    >
                      {linkUrl}
                    </a>
                    <div className={styles.linkConfirmIcons}>
                      <span className={styles.linkEditIcon} onMouseDown={(e) => e.preventDefault()} onClick={() => { setEditedLinkUrl(linkUrl); setIsLinkEditMode(true) }}>
                        <Pencil />
                      </span>
                      <span className={styles.linkRemoveIcon} onMouseDown={(e) => e.preventDefault()} onClick={() => editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)}>
                        <UnlinkIcon />
                      </span>
                    </div>
                  </>
                  )}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
