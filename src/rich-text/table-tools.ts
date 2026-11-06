// Outils « à la Notion » sur les tableaux de l'éditeur riche (reprise de MyCRM, TableTools), affichés au survol :
// - un « + » à droite ajoute une colonne à la fin, un « + » en bas ajoute une ligne à la fin ;
// - une poignée sur la bordure haute de chaque colonne, une autre sur la bordure gauche de chaque ligne : glisser
//   déplace la colonne ou la ligne, cliquer ouvre ses options ;
// - la largeur des colonnes se règle en tirant leur bordure (extension Table, « resizable »).
// Les positions sont relatives à la surface de l'éditeur (en position relative).
import type { Editor } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'
import { CellSelection, moveTableColumn, moveTableRow } from '@tiptap/pm/tables'
import { h, t } from 'tidyinputfields'
import { richIcon, type RichIconName } from './icons.ts'

/** Entrée du menu ouvert par un clic sur une poignée de ligne ou de colonne. */
export type TableAction = { key: string; label: string; icon: RichIconName; danger?: boolean; run: () => void }

type Hover = { table: HTMLTableElement; row: number | null; column: number | null }
type Drag = { axis: 'row' | 'column'; from: number; start: number; to: number | null; moved: boolean; grip: HTMLButtonElement }

export class TableTools {
  readonly element: HTMLDivElement
  #hover: Hover | null = null
  #drag: Drag | null = null
  #marker: { axis: 'row' | 'column'; position: number } | null = null
  readonly #editor: Editor
  readonly #surface: HTMLElement
  readonly #onMenu: (actions: TableAction[], anchor: DOMRect) => void
  readonly #listeners = new AbortController()

  constructor(editor: Editor, surface: HTMLElement, onMenu: (actions: TableAction[], anchor: DOMRect) => void) {
    this.#editor = editor
    this.#surface = surface
    this.#onMenu = onMenu
    this.element = h('div', { class: 'tif-rich-table-tools' })
    surface.append(this.element)
    const signal = this.#listeners.signal
    // Survol : le tableau sous la souris (ou sa marge, où sont les « + »), sa ligne et sa colonne.
    surface.addEventListener(
      'mousemove',
      (event) => {
        if (this.#drag) {
          return
        }
        const target = event.target as Element
        if (target.closest('.tif-rich-table-tools')) {
          return
        }
        const table = target.closest('.tableWrapper')?.querySelector('table') ?? null
        if (!table || !editor.isEditable) {
          this.#setHover(null)
          return
        }
        const cell = target.closest('td, th') as HTMLTableCellElement | null
        const before = this.#hover
        this.#setHover({
          table,
          row: cell ? (cell.parentElement as HTMLTableRowElement).rowIndex : before?.table === table ? before.row : null,
          column: cell ? cell.cellIndex : before?.table === table ? before.column : null,
        })
      },
      { signal },
    )
    surface.addEventListener('mouseleave', () => !this.#drag && this.#setHover(null), { signal })
    // Défilement horizontal d'un tableau large : les outils suivent.
    surface.addEventListener('scroll', () => this.render(), { signal, capture: true })
  }

  #setHover(hover: Hover | null): void {
    const same = hover && this.#hover && hover.table === this.#hover.table && hover.row === this.#hover.row && hover.column === this.#hover.column
    if (same || (!hover && !this.#hover)) {
      return
    }
    this.#hover = hover
    this.render()
  }

  dispose(): void {
    this.#listeners.abort()
    this.element.remove()
  }

  /** Curseur dans une cellule, puis commande du tableau. */
  #inCell(cell: Element | undefined, action: (e: Editor) => void): () => void {
    return () => {
      if (!cell) {
        return
      }
      const editor = this.#editor
      editor.view.dispatch(editor.state.tr.setSelection(TextSelection.near(editor.state.doc.resolve(editor.view.posAtDOM(cell, 0)))))
      action(editor)
    }
  }

  /** Sélectionne toute la ligne ou toute la colonne (les cellules apparaissent choisies) et ouvre ses options. */
  #openOptions(axis: 'row' | 'column', rank: number, anchor: DOMRect): void {
    const editor = this.#editor
    const table = this.#hover?.table
    if (!table) {
      return
    }
    const rows = Array.from(table.rows)
    const cells = Array.from(rows[0]?.cells ?? [])
    const cell = axis === 'row' ? rows[rank]?.cells[0] : cells[rank]
    if (!cell) {
      return
    }
    const $cell = editor.state.doc.resolve(editor.view.posAtDOM(cell, 0))
    let depth = $cell.depth
    while (depth > 0 && !['tableCell', 'tableHeader'].includes($cell.node(depth).type.name)) {
      depth--
    }
    const $before = editor.state.doc.resolve($cell.before(depth))
    editor.view.dispatch(editor.state.tr.setSelection(axis === 'row' ? CellSelection.rowSelection($before) : CellSelection.colSelection($before)))
    editor.commands.focus()
    const c = () => editor.chain().focus()
    // En-tête sur toute la ligne (ou la colonne) choisie : la commande l'active ou le retire, quel que soit le rang.
    const group = axis === 'row' ? Array.from(rows[rank].cells) : rows.map((l) => l.cells[rank]).filter(Boolean)
    const header = group.every((x) => x.tagName === 'TH')
    this.#onMenu(
      axis === 'row'
        ? [
            { key: 'before', label: t('richText.table.insertRowAbove'), icon: 'up', run: () => c().addRowBefore().run() },
            { key: 'after', label: t('richText.table.insertRowBelow'), icon: 'down', run: () => c().addRowAfter().run() },
            { key: 'header', label: header ? t('richText.table.removeRowHeader') : t('richText.table.makeRowHeader'), icon: 'bold', run: () => this.#toggleHeader(group, !header) },
            { key: 'delete', label: t('richText.table.deleteRow'), icon: 'delete', danger: true, run: () => c().deleteRow().run() },
          ]
        : [
            { key: 'before', label: t('richText.table.insertColumnLeft'), icon: 'left', run: () => c().addColumnBefore().run() },
            { key: 'after', label: t('richText.table.insertColumnRight'), icon: 'right', run: () => c().addColumnAfter().run() },
            { key: 'header', label: header ? t('richText.table.removeColumnHeader') : t('richText.table.makeColumnHeader'), icon: 'bold', run: () => this.#toggleHeader(group, !header) },
            { key: 'delete', label: t('richText.table.deleteColumn'), icon: 'delete', danger: true, run: () => c().deleteColumn().run() },
          ],
      anchor,
    )
  }

  /** Fait des cellules données des cellules d'en-tête (ou l'inverse) ; Tiptap ne le fait que pour la première ligne ou colonne. */
  #toggleHeader(group: HTMLTableCellElement[], header: boolean): void {
    const editor = this.#editor
    const { tableHeader, tableCell } = editor.schema.nodes
    const tr = editor.state.tr
    for (const x of group) {
      const $inside = editor.state.doc.resolve(editor.view.posAtDOM(x, 0))
      for (let p = $inside.depth; p > 0; p--) {
        const node = $inside.node(p)
        if (node.type === tableHeader || node.type === tableCell) {
          tr.setNodeMarkup($inside.before(p), header ? tableHeader : tableCell, node.attrs)
          break
        }
      }
    }
    editor.view.dispatch(tr)
    editor.commands.focus()
  }

  #grip(axis: 'row' | 'column', rank: number, left: number, top: number): HTMLButtonElement {
    const grip = h(
      'button',
      {
        type: 'button',
        class: `tif-rich-table-grip tif-${axis}`,
        title: t(`richText.table.${axis}Grip.title`),
        'aria-label': t(`richText.table.${axis}Grip.label`),
      },
      richIcon(axis === 'row' ? 'grip' : 'gripHorizontal'),
    )
    grip.style.left = `${left}px`
    grip.style.top = `${top}px`
    grip.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) {
        return
      }
      event.preventDefault()
      this.#drag = { axis, from: rank, start: axis === 'row' ? event.clientY : event.clientX, to: null, moved: false, grip }
      grip.setPointerCapture?.(event.pointerId)
    })
    grip.addEventListener('pointermove', (event) => this.#move(event))
    grip.addEventListener('pointerup', () => this.#release(grip))
    return grip
  }

  #move(event: PointerEvent): void {
    const g = this.#drag
    const table = this.#hover?.table
    if (!g || !table) {
      return
    }
    const pointer = g.axis === 'row' ? event.clientY : event.clientX
    if (!g.moved && Math.abs(pointer - g.start) < 4) {
      return
    }
    g.moved = true
    const rows = Array.from(table.rows)
    // Rang d'arrivée : la ligne (ou la colonne) sous la souris ; le repère se place du côté où elle ira.
    const rects = (g.axis === 'row' ? rows : Array.from(rows[0].cells)).map((x) => x.getBoundingClientRect())
    let to = rects.findIndex((r) => (g.axis === 'row' ? pointer < r.bottom : pointer < r.right))
    if (to < 0) {
      to = rects.length - 1
    }
    g.to = to
    const r = rects[to]
    const origin = this.#surface.getBoundingClientRect()
    this.#marker = g.axis === 'row' ? { axis: 'row', position: (to > g.from ? r.bottom : r.top) - origin.top } : { axis: 'column', position: (to > g.from ? r.right : r.left) - origin.left }
    this.render()
  }

  #release(grip: HTMLButtonElement): void {
    const g = this.#drag
    const table = this.#hover?.table
    this.#drag = null
    this.#marker = null
    if (!g || !table) {
      this.render()
      return
    }
    if (!g.moved) {
      this.#openOptions(g.axis, g.from, grip.getBoundingClientRect())
      this.render()
      return
    }
    if (g.to !== null && g.to !== g.from) {
      const editor = this.#editor
      const pos = editor.view.posAtDOM(table.rows[0].cells[0], 0)
      const command = g.axis === 'row' ? moveTableRow({ from: g.from, to: g.to, pos }) : moveTableColumn({ from: g.from, to: g.to, pos })
      command(editor.state, editor.view.dispatch)
      editor.commands.focus()
    }
    this.#hover = null
    this.render()
  }

  render(): void {
    const hover = this.#hover
    const editor = this.#editor
    if (!hover || !editor.isEditable || !hover.table.isConnected || !hover.table.rows[0]) {
      this.element.replaceChildren()
      return
    }
    const table = hover.table
    const rows = Array.from(table.rows)
    const cells = Array.from(rows[0].cells)
    const origin = this.#surface.getBoundingClientRect()
    const frame = table.getBoundingClientRect()
    const wrapper = (table.closest('.tableWrapper') ?? table).getBoundingClientRect()
    const bottom = Math.min(frame.bottom, wrapper.bottom)
    const right = Math.min(frame.right, wrapper.right)
    const marker = this.#marker
    const parts: Node[] = []
    const column = hover.column !== null ? cells[hover.column] : undefined
    const row = hover.row !== null ? rows[hover.row] : undefined
    // Un glisser en cours a toujours un repère : seule la poignée qui bouge reste affichée.
    if (column && hover.column !== null && (!marker || marker.axis === 'column')) {
      const r = column.getBoundingClientRect()
      parts.push(this.#grip('column', hover.column, r.left + r.width / 2 - origin.left, frame.top - origin.top))
    }
    if (row && hover.row !== null && row.cells[0] && (!marker || marker.axis === 'row')) {
      const r = row.getBoundingClientRect()
      parts.push(this.#grip('row', hover.row, frame.left - origin.left, r.top + r.height / 2 - origin.top))
    }
    if (!marker) {
      const plus = (axis: 'row' | 'column', run: () => void) => {
        const label = axis === 'row' ? t('richText.table.addRow') : t('richText.table.addColumn')
        const button = h('button', { type: 'button', class: `tif-rich-table-plus tif-${axis}`, title: label, 'aria-label': label }, richIcon('plus'))
        button.addEventListener('mousedown', (event) => event.preventDefault())
        button.addEventListener('click', run)
        if (axis === 'column') {
          Object.assign(button.style, { left: `${right - origin.left + 3}px`, top: `${frame.top - origin.top}px`, height: `${bottom - frame.top}px` })
        } else {
          Object.assign(button.style, { left: `${frame.left - origin.left}px`, top: `${bottom - origin.top + 3}px`, width: `${right - frame.left}px` })
        }
        return button
      }
      parts.push(
        plus('column', this.#inCell(cells[cells.length - 1], (e) => e.chain().focus().addColumnAfter().run())),
        plus('row', this.#inCell(rows[rows.length - 1]?.cells[0], (e) => e.chain().focus().addRowAfter().run())),
      )
    } else {
      const line = h('div', { class: `tif-rich-table-marker tif-${marker.axis}` })
      if (marker.axis === 'row') {
        Object.assign(line.style, { top: `${marker.position - 1}px`, left: `${frame.left - origin.left}px`, width: `${right - frame.left}px` })
      } else {
        Object.assign(line.style, { left: `${marker.position - 1}px`, top: `${frame.top - origin.top}px`, height: `${bottom - frame.top}px` })
      }
      parts.push(line)
    }
    // Pendant un glisser, la poignée tenue reste la même (capture du pointeur) : seul le repère est redessiné.
    if (this.#drag) {
      this.element.replaceChildren(this.#drag.grip, ...parts.filter((p) => !(p instanceof HTMLButtonElement)))
      return
    }
    this.element.replaceChildren(...parts)
  }
}
