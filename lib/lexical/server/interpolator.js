import { createSNHeadlessEditor } from '@/lib/lexical/headless'
import { $trimEmptyNodes } from '@/lib/lexical/utils'
import { markdownToLexical } from '@/lib/lexical/utils/mdast'
import { GalleryExtension } from '@/lib/lexical/exts/gallery'
import { AutoLinkExtension } from '@/lib/lexical/exts/autolink'
import { ItemContextExtension } from '@/lib/lexical/exts/item-context'
import { mergeRegister } from '@lexical/utils'

/**
 * converts markdown to Lexical state or processes existing state
 * @param {string} [params.text] - markdown text to convert
 * @param {string|number} [params.entityId] - optional entity identifier for error logging
 * @param {Object} [params.context] - context object
 * @returns {Promise<Object>} object with text and lexicalState properties
 */
export async function prepareLexicalState ({ text, entityId, context = {} }) {
  if (!text) {
    throw new Error('text is required')
  }

  const idLabel = entityId ? ` [entity:${entityId}]` : ''

  const editor = createSNHeadlessEditor()
  // register extensions, must be registerable
  const unregister = mergeRegister(
    ItemContextExtension.register(editor, context),
    AutoLinkExtension.register(editor),
    GalleryExtension.register(editor)
  )

  let hasError = false

  let lexicalState = null
  try {
    // transform the markdown text into a lexical state via MDAST
    editor.update(() => {
      markdownToLexical(editor, text)
    })

    // trim empty nodes from the start and end of the root
    editor.update(() => {
      $trimEmptyNodes()
    })

    editor.read(() => {
      try {
        // very ugly but Next.js can't serialize undefined values
        lexicalState = JSON.stringify(editor.getEditorState())
      } catch (error) {
        console.error(`error generating Lexical JSON State${idLabel}: `, error)
        hasError = true
      }
    })
  } catch (error) {
    console.error(`error preparing lexical state${idLabel}: `, error)
    hasError = true
  } finally {
    unregister?.()
  }

  if (hasError) return null

  // prepared text and lexical state
  return lexicalState
}
