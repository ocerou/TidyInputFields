// Coloration du code des exemples (Prism, seulement pour le site : la librairie n'en dépend pas).
import Prism from 'prismjs'
import { tr } from './i18n.ts'
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-clike'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-json'

export type Language = 'html' | 'css' | 'js' | 'ts' | 'tsx' | 'bash' | 'json'

const grammars: Record<Language, string> = { html: 'markup', css: 'css', js: 'javascript', ts: 'typescript', tsx: 'tsx', bash: 'bash', json: 'json' }

/** Bloc de code coloré, avec un bouton « Copy ». */
export function codeBlock(code: string, language: Language): HTMLElement {
  const pre = document.createElement('pre')
  pre.className = `language-${grammars[language]}`
  const element = document.createElement('code')
  element.innerHTML = Prism.highlight(code, Prism.languages[grammars[language]], grammars[language])
  pre.append(element)
  const copy = document.createElement('button')
  copy.type = 'button'
  copy.className = 'bd-copy'
  copy.textContent = tr('Copy')
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(code)
      copy.textContent = tr('Copied')
    } catch {
      copy.textContent = tr('Select and copy')
    }
    setTimeout(() => (copy.textContent = tr('Copy')), 1500)
  })
  const wrapper = document.createElement('div')
  wrapper.className = 'bd-code'
  wrapper.append(copy, pre)
  return wrapper
}
