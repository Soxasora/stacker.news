import { $nodesOfType, createCommand, COMMAND_PRIORITY_EDITOR, defineExtension } from 'lexical'
import { CodeExtension, CodeNode } from '@lexical/code'

export const UPDATE_CODE_THEME_COMMAND = createCommand()

const DEFAULT_THEME = 'github-dark-default'

export const CodeShikiSNExtension = defineExtension({
  name: 'CodeShikiSNExtension',
  dependencies: [CodeExtension],
  register (editor, _config, state) {
    let currentTheme = DEFAULT_THEME
    let cleanup = () => {}
    let shiki = null

    const applyHighlighting = (theme) => {
      // clean up previous highlighting
      cleanup()
      // register new highlighting
      cleanup = shiki.registerCodeHighlighting(editor, {
        ...shiki.ShikiTokenizer,
        defaultLanguage: 'text',
        defaultTheme: theme
      })
    }

    // theme updates are queued and applied once shiki is loaded
    const unregisterTheme = editor.registerCommand(
      UPDATE_CODE_THEME_COMMAND,
      (newTheme) => {
        currentTheme = newTheme
        // set theme on all code nodes
        $nodesOfType(CodeNode).forEach(node => node.setTheme(newTheme))
        // apply new highlighting if shiki is already loaded
        if (shiki) applyHighlighting(newTheme)
        return true
      }, COMMAND_PRIORITY_EDITOR)

    import('@lexical/code-shiki').then((mod) => {
      if (state.getSignal().aborted) return
      shiki = mod
      // load shiki with current theme
      applyHighlighting(currentTheme)
    })

    return () => {
      unregisterTheme()
      cleanup()
    }
  }
})
