// Un exemple de la documentation : un rendu vivant et son code en onglets (HTML, JavaScript, React).
// Chaque exemple est un fichier site/examples/<id>.example.tsx qui exporte :
//   html          le HTML de l'exemple (inséré tel quel, puis Tif.init) ;
//   js(root)      le JavaScript qui l'accompagne, s'il y en a (après le repère « // @js ») ;
//   ReactExample  la même chose en React (après le repère « // @react »).
// Le code affiché est lu dans le fichier lui-même : ce qu'on voit est ce qui tourne.
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import * as Tif from 'tidyinputfields'
import { codeBlock } from './highlight.ts'

type ExampleModule = { html?: string; js?: (root: HTMLElement) => void; ReactExample?: () => unknown }

const modules = import.meta.glob<ExampleModule>('../examples/*.example.tsx', { eager: true })
const sources = import.meta.glob<string>('../examples/*.example.tsx', { eager: true, query: '?raw', import: 'default' })

const idOf = (path: string) => path.replace(/^.*\/(.+)\.example\.tsx$/, '$1')
const byId = new Map(Object.keys(modules).map((path) => [idOf(path), { module: modules[path], source: sources[path] }]))

/** Retire l'indentation commune. */
function dedent(text: string): string {
  const lines = text.replace(/^\n+|\s+$/g, '').split('\n')
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length))
  return lines.map((l) => l.slice(indent)).join('\n')
}

/** Partie du fichier entre deux repères. */
function region(source: string, start: string, end?: string): string {
  const from = source.indexOf(start)
  if (from < 0) {
    return ''
  }
  const to = end ? source.indexOf(end, from) : -1
  return source.slice(from + start.length, to < 0 ? undefined : to)
}

/** Lignes d'import dont un nom sert dans le code montré. */
function importsFor(source: string, code: string): string[] {
  return source
    .split('\n')
    .filter((line) => line.startsWith('import '))
    .filter((line) => {
      const names = line.match(/import\s+(?:\*\s+as\s+(\w+)|\{([^}]*)\}|(\w+))/)
      const used = (names?.[1] ?? names?.[3] ?? names?.[2] ?? '')
        .split(',')
        .map((n) => n.replace(/\btype\b/, '').trim().split(/\s+as\s+/).pop()!.trim())
        .filter(Boolean)
      return used.some((n) => new RegExp(`\\b${n}\\b`).test(code))
    })
    // Imports relatifs montrés sans extension, comme on les écrit dans un projet.
    .map((line) => line.replace(/'(\.\/[^']+)\.tsx?'/, "'$1'"))
}

/** Rend un exemple : titre, texte, rendu, onglets de code. */
export function renderExample(id: string, title?: string, text?: string): HTMLElement {
  const entry = byId.get(id)
  const section = document.createElement('section')
  section.className = 'bd-example-block'
  section.id = `example-${id}`
  if (title) {
    const h3 = document.createElement('h3')
    h3.textContent = title
    section.append(h3)
  }
  if (text) {
    const p = document.createElement('p')
    p.innerHTML = text
    section.append(p)
  }
  if (!entry) {
    section.append(`Missing example: ${id}`)
    return section
  }
  const { module, source } = entry
  const html = module.html ? dedent(module.html) : ''
  const js = module.js ? dedent(region(source, '// @js', '// @react')) : ''
  const react = module.ReactExample ? dedent(region(source, '// @react')) : ''

  const preview = document.createElement('div')
  preview.className = 'bd-example'
  const tabs = document.createElement('div')
  tabs.className = 'bd-tabs'
  tabs.setAttribute('role', 'tablist')
  const code = document.createElement('div')
  code.className = 'bd-tab-panel'
  section.append(preview, tabs, code)

  let root: Root | null = null
  const showVanilla = () => {
    root?.unmount()
    root = null
    Tif.dispose(preview)
    preview.innerHTML = html
    Tif.init(preview)
    module.js?.(preview)
    preview.dataset.mode = 'vanilla'
  }
  const showReact = () => {
    Tif.dispose(preview)
    preview.replaceChildren()
    root = createRoot(preview)
    root.render(createElement(module.ReactExample as () => null))
    preview.dataset.mode = 'react'
  }

  const panes: { label: string; code: string; language: 'html' | 'ts' | 'tsx'; react: boolean }[] = []
  if (html) {
    panes.push({ label: 'HTML', code: html, language: 'html', react: false })
  }
  if (js) {
    const imports = importsFor(source, js).filter((l) => l.includes('tidyinputfields'))
    panes.push({ label: 'JavaScript', code: [...imports, '', js].join('\n').trim(), language: 'ts', react: false })
  }
  if (react) {
    panes.push({ label: 'React', code: [...importsFor(source, react), '', react].join('\n').trim(), language: 'tsx', react: true })
  }
  let current = -1
  const select = (index: number) => {
    const pane = panes[index]
    tabs.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-selected', String(i === index)))
    code.replaceChildren(codeBlock(pane.code, pane.language))
    // L'onglet React montre aussi le rendu React ; les autres, le rendu HTML + JavaScript.
    const wasReact = current >= 0 && panes[current].react
    if (current < 0 || wasReact !== pane.react) {
      if (pane.react) {
        showReact()
      } else {
        showVanilla()
      }
    }
    current = index
  }
  panes.forEach((pane, i) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.setAttribute('role', 'tab')
    button.textContent = pane.label
    button.addEventListener('click', () => select(i))
    tabs.append(button)
  })
  if (panes.length) {
    select(0)
  }
  return section
}

export const exampleIds = () => [...byId.keys()]
