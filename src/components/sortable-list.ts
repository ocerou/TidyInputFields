// Liste ordonnable (repris de MyCRM, InputSortableList) : les objets associés à un objet principal. Chaque élément se
// retire par sa croix, après confirmation ; avec `add`, un bouton « + » sous le dernier élément. En option : le n°
// d'ordre (`numbered`, par défaut) et le réordonnancement (`reorderable` : glisser-déposer, ou poignée et flèches haut
// et bas au clavier). En lecture (`readonly`), ni poignée ni boutons.
//
// Le composant tient la liste à jour lui-même et le dit par des événements : add.tif.sortable-list (« + » cliqué :
// l'application ouvre sa fenêtre puis appelle add()), remove.tif.sortable-list (annulable, après confirmation),
// reorder.tif.sortable-list, et change sur l'élément. Avec `name`, le formulaire reçoit les clés dans l'ordre.
import { Component, type Options } from '../core/component.ts'
import { confirm } from '../core/confirm.ts'
import { h } from '../core/dom.ts'
import { icon } from '../core/icons.ts'
import { t } from '../i18n/i18n.ts'
import { DragOrder } from '../utils/drag-order.ts'

/**
 * Un élément : clé, libellé (lu aussi dans les fenêtres), contenu affiché (texte ou nœud ; par défaut le libellé) ;
 * `href` rend le libellé cliquable (avec `title` en infobulle) ; `fixed` : il se déplace mais ne se retire pas.
 */
export type SortableItem = { key: string; label: string; content?: string | Node; href?: string; title?: string; fixed?: boolean }

export class TifSortableList extends Component {
  static override NAME = 'sortable-list'
  static override DEFAULTS: Options = {
    name: '',
    items: [] as SortableItem[],
    numbered: true,
    reorderable: false,
    readonly: false,
    /** Bouton « + » sous la liste. */
    add: false,
    /** Libellé du bouton « + » (« Ajouter » par défaut). */
    addLabel: '',
    /** Titre de la fenêtre de retrait (« Retirer le nom de domaine »). */
    removeTitle: '',
    /** Précision sous la question (ce que le retrait ne fait pas). */
    removeDetail: '',
    /** Retrait sans fenêtre de confirmation. */
    confirmRemove: true,
    /** Texte de la liste vide ; sans lui, une liste vide n'affiche rien (seulement le « + »). */
    emptyLabel: '',
    /** Liste obligatoire : orange tant qu'elle est vide. */
    required: false,
    /** Nom lu par les lecteurs d'écran. */
    label: '',
  }

  readonly root: HTMLDivElement
  readonly list: HTMLOListElement
  readonly #addButton: HTMLButtonElement
  readonly #values: HTMLSpanElement
  readonly #drag: DragOrder
  readonly #listeners = new AbortController()
  #items: SortableItem[] = []

  constructor(element: HTMLElement, options: Options = {}) {
    super(element, options)
    // Éléments écrits dans la page : <li data-key="…">…</li>, directement ou dans un <ol>/<ul>.
    const written = [...element.querySelectorAll<HTMLLIElement>(':scope > li[data-key], :scope > ol > li[data-key], :scope > ul > li[data-key]')]
    if (written.length && !(this.options.items as SortableItem[]).length) {
      this.options.items = written.map((li) => {
        const content = document.createDocumentFragment()
        content.append(...li.childNodes)
        return { key: li.dataset.key!, label: li.dataset.label ?? content.textContent?.trim() ?? li.dataset.key!, content, href: li.dataset.href, fixed: li.hasAttribute('data-fixed') }
      })
    }
    for (const node of element.querySelectorAll(':scope > li, :scope > ol, :scope > ul')) {
      node.remove()
    }
    this.list = h('ol', { class: 'tif-sortable-list' })
    this.#addButton = h('button', { type: 'button', class: 'tif-icon-btn tif-sortable-add' }, icon('add'))
    this.#values = h('span', { hidden: true })
    this.root = h('div', { class: 'tif tif-sortable' }, this.list, this.#addButton, this.#values)
    element.append(this.root)
    this.#drag = new DragOrder(() => this.#items.map((i) => i.key))
    this.#addButton.addEventListener('click', () => this.emit('add'), { signal: this.#listeners.signal })
    this.#items = [...((this.options.items as SortableItem[]) ?? [])]
    this.#render()
  }

  /** Éléments, dans l'ordre affiché. */
  get items(): SortableItem[] {
    return [...this.#items]
  }

  /** Clés des éléments, dans l'ordre. */
  override get value(): string[] {
    return this.#items.map((i) => i.key)
  }

  /** Remplace les éléments (sans événement). */
  setItems(items: SortableItem[]): void {
    this.#items = [...items]
    this.#render()
  }

  /** Ajoute un élément à la fin (sans doublon de clé). */
  add(item: SortableItem): void {
    if (this.#items.some((i) => i.key === item.key)) {
      return
    }
    this.#items.push(item)
    this.#render()
    this.#changed()
  }

  /**
   * Retire un élément ; avec `ask`, après la fenêtre de confirmation. Émet remove.tif.sortable-list (annulable) ; rend
   * true s'il a été retiré.
   */
  async remove(key: string, ask = false): Promise<boolean> {
    const item = this.#items.find((i) => i.key === key)
    if (!item) {
      return false
    }
    if (ask && this.options.confirmRemove) {
      const anchor = this.list.querySelector(`[data-key="${CSS.escape(key)}"] .tif-sortable-remove`) ?? this.root
      const ok = await confirm({
        title: String(this.options.removeTitle || t('sortable.removeItem', { label: item.label })),
        message: this.#question(item.label),
        confirmLabel: t('sortable.remove'),
        danger: true,
        anchor,
      })
      if (!ok) {
        return false
      }
    }
    if (!this.emit('remove', { key, item }, true)) {
      return false
    }
    this.#items = this.#items.filter((i) => i.key !== key)
    this.#render()
    this.#changed()
    return true
  }

  /** Déplace un élément au rang `index` (0 : en tête). */
  move(key: string, index: number): void {
    const from = this.#items.findIndex((i) => i.key === key)
    if (from < 0 || index < 0 || index >= this.#items.length || index === from) {
      return
    }
    const [item] = this.#items.splice(from, 1)
    this.#items.splice(index, 0, item)
    this.#render()
    this.emit('reorder', { keys: this.value })
    this.#changed()
  }

  /** Question de la fenêtre : « Retirer <b>libellé</b> de la liste ? », avec la précision éventuelle. */
  #question(label: string): Node {
    const text = t('sortable.removeConfirm', { label: '\u0000' })
    const [before, after = ''] = text.replace(/<\/?b>/g, '').split('\u0000')
    const detail = String(this.options.removeDetail || '')
    return h('div', {}, h('p', { class: 'tif-dialog-text' }, before, h('b', {}, label), after), detail && h('p', { class: 'tif-dialog-detail' }, detail))
  }

  #changed(): void {
    this.element.dispatchEvent(new Event('change', { bubbles: true }))
  }

  protected override optionsChanged(keys: string[]): void {
    if (keys.includes('items')) {
      this.#items = [...((this.options.items as SortableItem[]) ?? [])]
    }
    this.#render()
  }

  protected override localeChanged(): void {
    this.#render()
  }

  #render(): void {
    const o = this.options
    const readonly = Boolean(o.readonly)
    const canDrag = !readonly && Boolean(o.reorderable)
    const rows: HTMLElement[] = this.#items.map((item, i) => this.#row(item, i, readonly, canDrag))
    if (this.#items.length === 0 && o.emptyLabel) {
      rows.push(h('li', { class: 'tif-sortable-empty' }, String(o.emptyLabel)))
    }
    this.list.replaceChildren(...rows)
    if (o.label) {
      this.list.setAttribute('aria-label', String(o.label))
    }
    const addLabel = String(o.addLabel || t('sortable.add'))
    this.#addButton.hidden = readonly || !o.add
    this.#addButton.title = addLabel
    this.#addButton.setAttribute('aria-label', addLabel)
    this.root.classList.toggle('tif-missing', Boolean(o.required) && this.#items.length === 0)
    // Valeurs envoyées par le formulaire : les clés dans l'ordre.
    this.#values.replaceChildren(...(o.name ? this.#items.map((item) => h('input', { type: 'hidden', name: String(o.name), value: item.key })) : []))
  }

  #row(item: SortableItem, index: number, readonly: boolean, canDrag: boolean): HTMLLIElement {
    const content = item.content instanceof Node ? item.content.cloneNode(true) : (item.content ?? item.label)
    const name = item.href ? h('a', { href: item.href, title: item.title }, content) : content
    const li = h(
      'li',
      { 'data-key': item.key, draggable: canDrag ? 'true' : undefined, class: this.#drag.classes(item.key).join(' ') || undefined },
      canDrag && this.#grip(item, index),
      Boolean(this.options.numbered) && h('span', { class: 'tif-sortable-rank' }, index + 1),
      h('span', { class: 'tif-sortable-name' }, name),
      !readonly && !item.fixed && this.#removeButton(item),
    )
    if (canDrag) {
      li.addEventListener('dragstart', (event) => {
        this.#drag.start(item.key)
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = 'move'
          event.dataTransfer.setData('text/plain', item.key)
        }
        this.#mark()
      })
      li.addEventListener('dragover', (event) => {
        event.preventDefault()
        this.#drag.over(item.key)
        this.#mark()
      })
      li.addEventListener('drop', (event) => {
        event.preventDefault()
        const dragging = this.#drag.dragging
        const order = this.#drag.result()
        this.#drag.end()
        if (dragging && order) {
          this.move(dragging, order.indexOf(dragging))
        } else {
          this.#mark()
        }
      })
      li.addEventListener('dragend', () => {
        this.#drag.end()
        this.#mark()
      })
    }
    return li
  }

  /** Met à jour les marques du glisser-déposer sans tout redessiner. */
  #mark(): void {
    for (const li of this.list.querySelectorAll<HTMLLIElement>('li[data-key]')) {
      li.classList.remove('tif-dragging', 'tif-drop-before', 'tif-drop-after')
      li.classList.add(...this.#drag.classes(li.dataset.key!))
    }
  }

  #grip(item: SortableItem, index: number): HTMLButtonElement {
    const grip = h(
      'button',
      { type: 'button', class: 'tif-sortable-grip', title: t('sortable.dragHint'), 'aria-label': t('sortable.move', { label: item.label }) },
      icon('grip'),
    )
    grip.addEventListener('keydown', (event) => {
      const to = event.key === 'ArrowUp' ? index - 1 : event.key === 'ArrowDown' ? index + 1 : -1
      if (to < 0 || to >= this.#items.length) {
        return
      }
      event.preventDefault()
      this.move(item.key, to)
      // Le focus suit l'élément déplacé.
      this.list.querySelector<HTMLButtonElement>(`[data-key="${CSS.escape(item.key)}"] .tif-sortable-grip`)?.focus()
    })
    return grip
  }

  #removeButton(item: SortableItem): HTMLButtonElement {
    const label = t('sortable.removeItem', { label: item.label })
    const button = h('button', { type: 'button', class: 'tif-icon-btn tif-sortable-remove', title: t('sortable.remove'), 'aria-label': label }, icon('close'))
    button.addEventListener('click', () => void this.remove(item.key, true))
    return button
  }

  focus(): void {
    this.list.querySelector<HTMLElement>('button, a')?.focus()
  }

  override dispose(): void {
    this.#listeners.abort()
    this.root.remove()
    super.dispose()
  }
}
