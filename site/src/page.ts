// Modèle des pages de la documentation et rendu de leurs blocs.
import type { ComponentClass } from 'tidyinputfields'
import { renderExample } from './example.ts'
import { codeBlock, type Language } from './highlight.ts'

/** Ligne d'un tableau d'options, d'événements ou de méthodes. */
export type Row = [string, string, string?]

export type Block =
  /** Texte de la documentation (HTML écrit par nous). */
  | { text: string }
  | { heading: string; id?: string }
  | { example: string; title?: string; text?: string }
  | { code: string; language: Language }
  /** Options d'un composant : clés et valeurs par défaut lues dans DEFAULTS, descriptions fournies. */
  | { options: ComponentClass; descriptions: Record<string, string> }
  | { table: Row[]; columns: [string, string, string?] }

export type Page = { id: string; group: string; title: string; lead: string; blocks: Block[] }

const kebab = (text: string) => text.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)

function show(value: unknown): string {
  if (typeof value === 'function') {
    return 'function'
  }
  if (value === null) {
    return 'null'
  }
  if (Array.isArray(value)) {
    return value.length ? JSON.stringify(value) : '[]'
  }
  return typeof value === 'string' ? `'${value}'` : String(value)
}

function table(columns: (string | undefined)[], rows: (string | Node)[][]): HTMLElement {
  const wrapper = document.createElement('div')
  wrapper.className = 'bd-table'
  const element = document.createElement('table')
  const head = element.createTHead().insertRow()
  for (const column of columns.filter(Boolean)) {
    const th = document.createElement('th')
    th.textContent = column!
    head.append(th)
  }
  const body = element.createTBody()
  for (const row of rows) {
    const tr = body.insertRow()
    for (const cell of row) {
      const td = tr.insertCell()
      if (typeof cell === 'string') {
        td.innerHTML = cell
      } else {
        td.append(cell)
      }
    }
  }
  wrapper.append(element)
  return wrapper
}

export function renderBlock(block: Block): Node {
  // Un exemple peut aussi avoir un texte : il passe en premier.
  if ('example' in block) {
    return renderExample(block.example, block.title, block.text)
  }
  if ('text' in block) {
    const div = document.createElement('div')
    div.className = 'bd-text'
    div.innerHTML = block.text
    return div
  }
  if ('heading' in block) {
    const h2 = document.createElement('h2')
    h2.textContent = block.heading
    h2.id = block.id ?? block.heading.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    return h2
  }
  if ('code' in block) {
    return codeBlock(block.code.trim(), block.language)
  }
  if ('options' in block) {
    const defaults = block.options.DEFAULTS
    const rows = Object.keys(defaults).map((key) => [
      `<code>${key}</code><br><small><code>${kebab(key)}</code></small>`,
      `<code>${show(defaults[key])}</code>`,
      block.descriptions[key] ?? '',
    ])
    return table(['Option / attribute', 'Default', 'Description'], rows)
  }
  return table(block.columns, block.table.map((row) => row.map((cell) => cell ?? '')))
}
