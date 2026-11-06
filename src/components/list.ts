// Base des listes à panneau (liste avec recherche, choix multiple) : au repos, un bouton à l'allure d'une liste
// déroulante ; ouverte, une recherche en tête (selon le composant), les options — regroupées sous des intitulés —, un
// pied. Clavier : ↑ ↓, Entrée, Échap ; une lettre tapée sur le bouton ouvre la liste et commence la recherche ; Tab
// referme. Le panneau est placé sur l'écran par Floating (jamais coupé, au-dessus s'il manque de place).
//
// Les classes filles ne sont appelées qu'après leur propre construction : le constructeur de base ne fait que poser le
// bouton et le panneau.
import { Component, type Options } from '../core/component.ts'
import { h, uid } from '../core/dom.ts'
import { Floating } from '../core/floating.ts'
import { icon } from '../core/icons.ts'
import { t } from '../i18n/i18n.ts'
import { wordsOf, type SearchOption } from '../utils/search.ts'

/** Une option d'une liste : valeur, libellé, groupe, pastille, inactive (masquée par défaut), raccourci (selects). */
export type ListOption = SearchOption

type Child = Node | string | null | undefined | false

export abstract class ListSelect extends Component {
  /** Bouton qui ouvre la liste. */
  readonly button: HTMLButtonElement
  /** Panneau flottant. */
  readonly panel: HTMLDivElement
  readonly floating: Floating
  protected readonly listeners = new AbortController()
  /** Recherche en cours. */
  protected search = ''
  /** Rang de l'option active (survolée ou atteinte au clavier). */
  protected active = 0
  #shown: ListOption[] = []
  #list: HTMLDivElement | null = null
  #foot: HTMLDivElement | null = null
  #searchInput: HTMLInputElement | null = null
  readonly #listId = uid('tif-listbox')

  constructor(element: HTMLElement, options: Options = {}) {
    super(element, options)
    this.button = h(
      'button',
      { type: 'button', class: 'tif tif-select-button', 'aria-haspopup': 'listbox', 'aria-expanded': 'false' },
      h('span', { class: 'tif-select-value' }),
    )
    this.panel = h('div', { class: 'tif-listbox-panel', tabindex: '-1' })
    this.floating = new Floating(this.button, this.panel, {
      matchWidth: true,
      returnFocus: this.button,
      onClose: () => {
        this.button.setAttribute('aria-expanded', 'false')
        this.closed()
        this.emit('hidden')
      },
    })
    const signal = this.listeners.signal
    this.button.addEventListener('click', () => (this.floating.isOpen ? this.close() : this.open()), { signal })
    this.button.addEventListener('keydown', (event) => this.#buttonKey(event), { signal })
    this.panel.addEventListener('keydown', (event) => this.#panelKey(event), { signal })
  }

  // --- À définir ---

  /** Options affichées pour la recherche en cours (choix vide compris). */
  protected abstract matches(): ListOption[]
  /** Contenu d'une ligne. */
  protected abstract optionContent(option: ListOption, words: string[]): Child[]
  /** État d'une ligne : choisie (aria-selected), classe. */
  protected abstract optionState(option: ListOption): { selected?: boolean; className?: string }
  /** Choix d'une option (clic, Entrée). */
  protected abstract pick(option: ListOption): void
  /** Contenu du pied (null : pas de pied). */
  protected abstract footer(): Child[] | null
  /** La recherche s'affiche. */
  protected abstract withSearch(): boolean

  /** Option active à l'ouverture. */
  protected initialActive(): number {
    return 0
  }

  /** Plusieurs choix possibles (aria-multiselectable). */
  protected multiple(): boolean {
    return false
  }

  /** La recherche a changé (une source distante relance sa requête). */
  protected searchChanged(): void {}

  /** Le panneau va s'ouvrir. */
  protected opening(): void {}

  /** Le panneau s'est fermé. */
  protected closed(): void {}

  /** Une touche du panneau propre au composant (Espace coche) ; rend true si elle est traitée. */
  protected panelKey(_event: KeyboardEvent): boolean {
    return false
  }

  // --- Comportement commun ---

  /** Libellé du bouton. */
  protected setButtonLabel(text: string, empty: boolean): void {
    const value = this.button.querySelector('.tif-select-value')!
    value.textContent = text
    this.button.classList.toggle('tif-is-empty', empty)
  }

  /** Ouvre la liste ; `start` commence la recherche (lettre tapée sur le bouton). */
  open(start = ''): void {
    if (this.button.disabled || this.floating.isOpen || !this.emit('show', undefined, true)) {
      return
    }
    this.search = start
    this.opening()
    this.#build()
    this.active = start ? 0 : Math.max(0, this.initialActive())
    this.renderList()
    this.floating.open()
    this.button.setAttribute('aria-expanded', 'true')
    if (this.#searchInput) {
      this.#searchInput.focus()
      this.#searchInput.setSelectionRange(start.length, start.length)
    } else {
      this.#list?.focus()
    }
    this.#reveal()
    this.emit('shown')
  }

  close(): void {
    this.floating.close('api')
  }

  /** Construit le panneau : recherche, liste, pied. */
  #build(): void {
    const parts: HTMLElement[] = []
    this.#searchInput = null
    if (this.withSearch()) {
      const input = h('input', {
        type: 'text',
        class: 'tif-listbox-search-input',
        placeholder: t('search.placeholder'),
        'aria-label': t('search.inList'),
        'aria-controls': this.#listId,
        autocomplete: 'off',
      })
      input.value = this.search
      const clear = h('button', { type: 'button', class: 'tif-icon-btn', 'aria-label': t('search.clear'), title: t('search.clear'), hidden: !this.search }, icon('close'))
      input.addEventListener('input', () => {
        this.search = input.value
        clear.hidden = !input.value
        this.active = 0
        this.searchChanged()
        this.renderList()
      })
      clear.addEventListener('click', () => {
        input.value = ''
        input.dispatchEvent(new Event('input'))
        input.focus()
      })
      this.#searchInput = input
      parts.push(h('div', { class: 'tif-listbox-search' }, icon('search'), input, clear))
    }
    this.#list = h('div', {
      class: 'tif-listbox',
      id: this.#listId,
      role: 'listbox',
      tabindex: this.withSearch() ? '-1' : '0',
      'aria-label': this.button.getAttribute('aria-label') ?? undefined,
      'aria-multiselectable': this.multiple() ? 'true' : undefined,
    })
    parts.push(this.#list)
    this.#foot = h('div', { class: 'tif-listbox-foot' })
    parts.push(this.#foot)
    this.panel.replaceChildren(...parts)
  }

  /** Redessine les options et le pied (après une recherche, un choix, une réponse de la source). */
  renderList(): void {
    const list = this.#list
    if (!list) {
      return
    }
    const words = wordsOf(this.search)
    this.#shown = this.matches()
    this.active = Math.min(this.active, Math.max(0, this.#shown.length - 1))
    const nodes: HTMLElement[] = []
    if (this.#shown.length === 0) {
      nodes.push(h('div', { class: 'tif-no-results' }, t('search.noResults')))
    }
    this.#shown.forEach((option, i) => {
      // Intitulé de groupe avant la première option de chaque groupe.
      if (option.group && option.group !== this.#shown[i - 1]?.group) {
        nodes.push(h('div', { class: 'tif-option-group', role: 'presentation' }, option.group))
      }
      const state = this.optionState(option)
      const row = h(
        'div',
        {
          role: 'option',
          class: ['tif-option', option.group ? 'tif-in-group' : '', state.className ?? ''].filter(Boolean).join(' '),
          'aria-selected': state.selected === undefined ? undefined : String(state.selected),
          'data-active': String(i === this.active),
          'data-index': String(i),
        },
        ...this.optionContent(option, words),
      )
      row.addEventListener('mousedown', (event) => {
        event.preventDefault()
        this.active = i
        this.pick(option)
      })
      row.addEventListener('mouseenter', () => this.#setActive(i, false))
      nodes.push(row)
    })
    list.replaceChildren(...nodes)
    this.renderFoot()
    this.floating.position()
  }

  renderFoot(): void {
    const foot = this.#foot
    if (!foot) {
      return
    }
    const content = this.footer()
    foot.hidden = content === null
    // Le texte (compteur) prend la place libre : interrupteur et boutons se calent à droite.
    foot.replaceChildren(
      ...(content ?? [])
        .filter((c): c is Node | string => c != null && c !== false)
        .map((c) => (typeof c === 'string' ? h('span', { class: 'tif-listbox-count' }, c) : c)),
    )
  }

  #setActive(index: number, byKeyboard: boolean): void {
    this.active = index
    for (const row of this.#list?.querySelectorAll<HTMLElement>('[role="option"]') ?? []) {
      row.dataset.active = String(Number(row.dataset.index) === index)
    }
    if (byKeyboard) {
      this.#reveal()
    }
  }

  /** L'option active reste visible, en ne faisant défiler que la liste. */
  #reveal(): void {
    const list = this.#list
    const row = list?.querySelector<HTMLElement>('[data-active="true"]')
    if (!list || !row) {
      return
    }
    const top = row.offsetTop - list.offsetTop
    if (top < list.scrollTop) {
      list.scrollTop = top
    } else if (top + row.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = top + row.offsetHeight - list.clientHeight
    }
  }

  #buttonKey(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      this.open()
    } else if (this.withSearch() && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      // Une lettre tapée sur la liste fermée l'ouvre et commence la recherche.
      event.preventDefault()
      this.open(event.key)
    }
  }

  #panelKey(event: KeyboardEvent): void {
    if (event.target instanceof HTMLElement && event.target.closest('.tif-listbox-foot')) {
      return
    }
    const count = this.#shown.length
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      this.#setActive(Math.min(this.active + 1, count - 1), true)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      this.#setActive(Math.max(this.active - 1, 0), true)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const option = this.#shown[this.active]
      if (option) {
        this.pick(option)
      }
    } else if (this.panelKey(event)) {
      return
    } else if (event.key === 'Tab') {
      this.close()
    }
  }

  /** Option active, pour les composants. */
  protected activeOption(): ListOption | undefined {
    return this.#shown[this.active]
  }

  focus(): void {
    this.button.focus()
  }

  override dispose(): void {
    this.listeners.abort()
    this.floating.dispose()
    this.button.remove()
    super.dispose()
  }
}

/** Pastille (type d'une option, par exemple). */
export const pill = (text: string) => h('span', { class: 'tif-pill' }, text)

/** Interrupteur du pied de liste (« Afficher les désactivés »). */
export function footSwitch(label: string, checked: boolean, onChange: (checked: boolean) => void): HTMLLabelElement {
  const input = h('input', { type: 'checkbox', role: 'switch', class: 'tif-switch' })
  input.checked = checked
  input.addEventListener('change', () => onChange(input.checked))
  return h('label', { class: 'tif-listbox-switch' }, input, label)
}

/** Options lues dans des <option> / <optgroup> : data-pill, data-inactive. */
export function optionsFromElements(parent: ParentNode): ListOption[] {
  const options: ListOption[] = []
  for (const option of parent.querySelectorAll('option')) {
    const group = option.parentElement instanceof HTMLOptGroupElement ? option.parentElement.label : undefined
    options.push({
      value: option.value,
      label: option.label || option.textContent || option.value,
      group: group || undefined,
      pill: option.dataset.pill || undefined,
      inactive: option.hasAttribute('data-inactive') || undefined,
    })
  }
  return options
}
