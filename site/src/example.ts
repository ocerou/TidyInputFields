// Un exemple de la documentation : un rendu vivant et son code, en onglets. Chaque onglet a son propre rendu.
//
// Exemple de composant (site/examples/<id>.example.tsx), les trois façons d'écrire le même champ, plus React :
//   export const tag          le HTML avec la balise <tif-…> ;
//   export const attributes   le HTML avec les attributs data-tif ;
//   export const apiHtml      le HTML d'accueil de l'API JavaScript ;
//   // @tag         export function tagScript(root)         JavaScript complémentaire de la balise (facultatif) ;
//   // @attributes  export function attributesScript(root)  idem pour data-tif (facultatif) ;
//   // @api         export function api(root)               l'API JavaScript ;
//   // @react       export function ReactExample()          la même chose en React.
//
// Exemple général (pages « Getting started », utilitaires) : export const html, // @js export function js(root),
// // @react export function ReactExample().
//
// Le code affiché est lu dans le fichier lui-même, entre ses repères : ce qu'on voit est ce qui tourne.
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import * as Tif from 'tidyinputfields'
import { codeBlock, type Language } from './highlight.ts'
import { tr } from './i18n.ts'

type Script = (root: HTMLElement) => void
type ExampleModule = {
  html?: string
  js?: Script
  tag?: string
  tagScript?: Script
  attributes?: string
  attributesScript?: Script
  apiHtml?: string
  api?: Script
  ReactExample?: () => unknown
}

const modules = import.meta.glob<ExampleModule>('../examples/*.example.tsx', { eager: true })
const sources = import.meta.glob<string>('../examples/*.example.tsx', { eager: true, query: '?raw', import: 'default' })

const idOf = (path: string) => path.replace(/^.*\/(.+)\.example\.tsx$/, '$1')
// Fins de ligne ramenées à « \n » : un fichier enregistré sous Windows (CRLF) ne cache pas ses repères « // @… ».
const byId = new Map(Object.keys(modules).map((path) => [idOf(path), { module: modules[path], source: sources[path].replace(/\r\n/g, '\n') }]))

/** Retire l'indentation commune. */
function dedent(text: string): string {
  const lines = text.replace(/^\n+|\s+$/g, '').split('\n')
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length))
  return lines.map((l) => l.slice(indent)).join('\n')
}

/** Code qui suit un repère « // @nom », jusqu'au repère suivant ou à la fin du fichier. */
function region(source: string, marker: string): string {
  const start = source.indexOf(`\n// @${marker}\n`)
  if (start < 0) {
    return ''
  }
  const from = start + marker.length + 6
  const next = source.indexOf('\n// @', from)
  return dedent(source.slice(from, next < 0 ? undefined : next))
}

/** Lignes d'import dont un nom sert dans le code montré. */
function importsFor(source: string, code: string): string[] {
  return source
    .split('\n')
    .filter((line) => line.startsWith('import '))
    .filter((line) => {
      const names = line.match(/import\s+(?:type\s+)?(?:\*\s+as\s+(\w+)|\{([^}]*)\}|(\w+))/)
      const used = (names?.[1] ?? names?.[3] ?? names?.[2] ?? '')
        .split(',')
        .map((n) => n.replace(/\btype\b/, '').trim().split(/\s+as\s+/).pop()!.trim())
        .filter(Boolean)
      return used.some((n) => new RegExp(`\\b${n}\\b`).test(code))
    })
    // Imports relatifs montrés sans extension, comme on les écrit dans un projet.
    .map((line) => line.replace(/'(\.\/[^']+)\.tsx?'/, "'$1'"))
}

/**
 * Code JavaScript montré : ses imports, le code commun de l'exemple (repère « // @shared », placé avant les autres :
 * une source distante, un type), puis la fonction.
 */
const withImports = (source: string, code: string) => {
  const shared = region(source, 'shared')
  const full = shared ? `${shared}\n\n${code}` : code
  return [...importsFor(source, full), '', full].join('\n').trim()
}

type Pane = { label: string; blocks: { code: string; language: Language }[]; show: () => void; react?: boolean }

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

  const preview = document.createElement('div')
  preview.className = 'bd-example'
  const tabs = document.createElement('div')
  tabs.className = 'bd-tabs'
  tabs.setAttribute('role', 'tablist')
  const code = document.createElement('div')
  code.className = 'bd-tab-panel'
  section.append(preview, tabs, code)

  let root: Root | null = null
  const clear = () => {
    root?.unmount()
    root = null
    Tif.dispose(preview)
    preview.replaceChildren()
  }
  /** Rendu sans React : le HTML, l'initialisation des data-tif, puis le script. */
  const vanilla = (html: string, script?: Script, mode = 'vanilla') => () => {
    clear()
    preview.innerHTML = dedent(html)
    Tif.init(preview)
    script?.(preview)
    preview.dataset.mode = mode
  }
  const react = () => {
    clear()
    root = createRoot(preview)
    root.render(createElement(module.ReactExample as () => null))
    preview.dataset.mode = 'react'
  }

  const panes: Pane[] = []
  const html = (text: string) => ({ code: dedent(text), language: 'html' as const })
  const script = (marker: string) => {
    const text = region(source, marker)
    return text ? [{ code: withImports(source, text), language: 'ts' as const }] : []
  }
  if (module.tag) {
    panes.push({ label: tr('Tag'), blocks: [html(module.tag), ...script('tag')], show: vanilla(module.tag, module.tagScript, 'tag') })
  }
  if (module.attributes) {
    panes.push({ label: tr('data-tif attributes'), blocks: [html(module.attributes), ...script('attributes')], show: vanilla(module.attributes, module.attributesScript, 'attributes') })
  }
  if (module.api) {
    panes.push({ label: tr('JavaScript API'), blocks: [...(module.apiHtml ? [html(module.apiHtml)] : []), ...script('api')], show: vanilla(module.apiHtml ?? '', module.api, 'api') })
  }
  if (module.html) {
    panes.push({ label: tr('HTML'), blocks: [html(module.html)], show: vanilla(module.html, module.js) })
  }
  if (module.js && region(source, 'js')) {
    // Exemple général : le JavaScript accompagne le HTML, même rendu.
    panes.push({ label: tr('JavaScript'), blocks: script('js'), show: vanilla(module.html ?? '', module.js) })
  }
  if (module.ReactExample) {
    const text = region(source, 'react')
    panes.push({ label: tr('React'), blocks: [{ code: withImports(source, text), language: 'tsx' }], show: react, react: true })
  }

  let shown: (() => void) | null = null
  const select = (index: number) => {
    const pane = panes[index]
    tabs.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-selected', String(i === index)))
    code.replaceChildren(...pane.blocks.map((b) => codeBlock(b.code, b.language)))
    // Un onglet qui a le même rendu que le précédent (HTML puis JavaScript) ne le recrée pas.
    if (pane.show !== shown) {
      pane.show()
      shown = pane.show
    }
  }
  // HTML et JavaScript d'un exemple général partagent leur rendu.
  if (module.html && module.js) {
    const both = panes.filter((p) => p.label === tr('HTML') || p.label === tr('JavaScript'))
    for (const pane of both) {
      pane.show = both[0].show
    }
  }
  panes.forEach((pane, i) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.setAttribute('role', 'tab')
    button.textContent = pane.label
    button.addEventListener('click', () => select(i))
    tabs.append(button)
  })
  // Premier rendu une fois l'exemple dans la page : les balises <tif-…> ne créent leur composant qu'à ce moment-là.
  if (panes.length) {
    queueMicrotask(() => select(0))
  }
  return section
}

export const exampleIds = () => [...byId.keys()]
