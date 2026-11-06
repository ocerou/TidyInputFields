// Champ de recherche (repris de MyCRM, InputLookup) : choix d'un enregistrement parmi une liste trop longue pour un
// menu déroulant. On tape quelques lettres, la `source` rend les premières correspondances, proposées sous la zone ;
// la zone montre ensuite le libellé du choix, une croix le retire. Clavier : ↑ ↓, Entrée, Échap (ajoutés par rapport à
// MyCRM, qui ne proposait que la souris). La valeur (l'identifiant) vit dans un champ caché.
import { Component, type Options } from '../core/component.ts'
import { h, uid } from '../core/dom.ts'
import { Floating } from '../core/floating.ts'
import { icon } from '../core/icons.ts'
import { t } from '../i18n/i18n.ts'
import { highlight, wordsOf } from '../utils/search.ts'
import { dispatchChange, toggleAttribute } from './field.ts'
import type { ListOption } from './list.ts'

/** Source des suggestions : les correspondances de la recherche. */
export type LookupSource = (query: string, context: { limit: number; signal: AbortSignal }) => Promise<ListOption[]>

export class TifLookup extends Component {
  static override NAME = 'lookup'
  static override DEFAULTS: Options = {
    name: '',
    value: '',
    placeholder: '',
    disabled: false,
    required: false,
    label: '',
    inputId: '',
    quiet: false,
    /** Nombre de lettres avant de chercher. */
    minChars: 2,
    /** Nombre de suggestions demandées. */
    limit: 10,
    /** Suggestions (fonction, en JavaScript seulement). */
    source: null as LookupSource | null,
    /** Libellé d'une valeur (fonction, en JavaScript seulement) ; sans elle, la valeur s'affiche. */
    sourceLabel: null as ((value: string) => Promise<string | null>) | null,
  }

  readonly holder: HTMLInputElement
  readonly input: HTMLInputElement
  readonly zone: HTMLSpanElement
  readonly panel: HTMLDivElement
  readonly floating: Floating
  readonly #clear: HTMLButtonElement
  readonly #nativeType: string | null
  readonly #listeners = new AbortController()
  readonly #listId = uid('tif-lookup')
  #label = ''
  #suggestions: ListOption[] = []
  #active = 0
  #request: AbortController | null = null
  #timer: ReturnType<typeof setTimeout> | undefined

  constructor(element: HTMLElement, options: Options = {}) {
    super(element, options)
    const native = element instanceof HTMLInputElement ? element : null
    this.#nativeType = native ? native.type : null
    this.holder = native ?? h('input', { type: 'hidden' })
    if (native) {
      if (!this.options.value && native.value) {
        this.options.value = native.value
      }
      native.type = 'hidden'
    }
    this.input = h('input', {
      type: 'text',
      class: 'tif-lookup-input',
      autocomplete: 'off',
      role: 'combobox',
      'aria-autocomplete': 'list',
      'aria-expanded': 'false',
      'aria-controls': this.#listId,
    })
    this.#clear = h('button', { type: 'button', class: 'tif-icon-btn tif-lookup-clear', hidden: true }, icon('close'))
    this.zone = h('span', { class: 'tif tif-field tif-lookup' }, icon('search'), this.input, this.#clear)
    if (native) {
      native.after(this.zone)
    } else {
      element.append(this.holder, this.zone)
    }
    this.panel = h('div', { class: 'tif-listbox-panel tif-lookup-panel' })
    this.floating = new Floating(this.zone, this.panel, {
      matchWidth: true,
      returnFocus: this.input,
      onClose: () => this.input.setAttribute('aria-expanded', 'false'),
    })
    const signal = this.#listeners.signal
    this.input.addEventListener('input', () => this.#typed(), { signal })
    this.input.addEventListener('keydown', (event) => this.#keydown(event), { signal })
    this.input.addEventListener(
      'blur',
      (event) => {
        if (this.floating.owns(event.relatedTarget as Node | null)) {
          return
        }
        this.#abort()
        this.floating.close('api')
        this.input.value = this.#label
      },
      { signal },
    )
    this.#clear.addEventListener('click', () => {
      this.#choose(null)
      this.input.focus()
    }, { signal })
    this.panel.addEventListener('mousedown', (event) => event.preventDefault(), { signal })
    this.#apply(Object.keys(this.options))
  }

  /** Identifiant choisi, '' sans choix. */
  override get value(): string {
    return this.holder.value
  }

  override set value(value: unknown) {
    this.holder.value = value == null ? '' : String(value)
    this.#label = this.holder.value
    this.#show()
    this.#loadLabel()
  }

  /** Libellé affiché du choix courant. */
  get text(): string {
    return this.#label
  }

  protected override optionsChanged(keys: string[]): void {
    this.#apply(keys)
  }

  #apply(keys: string[]): void {
    const o = this.options
    if (keys.includes('name')) {
      this.holder.name = String(o.name ?? '')
    }
    if (keys.includes('value')) {
      this.value = o.value
    }
    if (keys.includes('placeholder')) {
      this.input.placeholder = String(o.placeholder || t('search.placeholder'))
    }
    if (keys.includes('disabled')) {
      this.input.disabled = Boolean(o.disabled)
      this.holder.disabled = Boolean(o.disabled)
    }
    if (keys.includes('required')) {
      this.input.required = Boolean(o.required)
    }
    if (keys.includes('label')) {
      toggleAttribute(this.input, 'aria-label', o.label ? String(o.label) : null)
    }
    if (keys.includes('inputId') && o.inputId) {
      this.input.id = String(o.inputId)
    }
    if (keys.includes('quiet')) {
      this.zone.classList.toggle('tif-quiet', Boolean(o.quiet))
    }
    this.#clear.title = t('common.clear')
    this.#clear.setAttribute('aria-label', t('common.clear'))
    this.#show()
  }

  #show(): void {
    if (document.activeElement !== this.input || !this.floating.isOpen) {
      this.input.value = this.#label
    }
    this.#clear.hidden = !this.holder.value || this.input.disabled
  }

  #loadLabel(): void {
    const value = this.holder.value
    const labelOf = this.options.sourceLabel as ((value: string) => Promise<string | null>) | null
    if (!value || typeof labelOf !== 'function') {
      return
    }
    void labelOf(value).then((label) => {
      if (this.holder.value === value && !this.disposed) {
        this.#label = label ?? t('search.notFound')
        this.#show()
      }
    })
  }

  protected override localeChanged(): void {
    this.#apply(['placeholder'])
  }

  #abort(): void {
    clearTimeout(this.#timer)
    this.#request?.abort()
  }

  /** Suggestions, un court instant après la frappe, à partir de `minChars` lettres. */
  #typed(): void {
    this.#abort()
    const query = this.input.value.trim()
    const source = this.options.source as LookupSource | null
    if (typeof source !== 'function' || query.length < Number(this.options.minChars)) {
      this.floating.close('api')
      return
    }
    const request = new AbortController()
    this.#request = request
    this.#timer = setTimeout(() => {
      source(query, { limit: Number(this.options.limit) || 10, signal: request.signal })
        .then((options) => {
          if (request.signal.aborted) {
            return
          }
          this.#suggestions = options
          this.#active = 0
          this.#render()
        })
        .catch(() => undefined)
    }, 250)
  }

  #render(): void {
    if (this.#suggestions.length === 0) {
      this.floating.close('api')
      return
    }
    const words = wordsOf(this.input.value)
    const list = h(
      'div',
      { class: 'tif-listbox', role: 'listbox', id: this.#listId },
      ...this.#suggestions.map((option, i) => {
        const row = h(
          'div',
          { role: 'option', class: 'tif-option', 'data-active': String(i === this.#active), 'aria-selected': String(i === this.#active), id: `${this.#listId}-${i}` },
          h('span', { class: 'tif-option-label' }, highlight(option.label, words)),
        )
        row.addEventListener('mousedown', (event) => {
          event.preventDefault()
          this.#choose(option)
        })
        row.addEventListener('mouseenter', () => {
          this.#active = i
          this.#mark()
        })
        return row
      }),
    )
    this.panel.replaceChildren(list)
    if (!this.floating.isOpen) {
      this.floating.open()
      this.input.setAttribute('aria-expanded', 'true')
    } else {
      this.floating.position()
    }
    this.#mark()
  }

  #mark(): void {
    for (const row of this.panel.querySelectorAll<HTMLElement>('[role="option"]')) {
      const active = row.id === `${this.#listId}-${this.#active}`
      row.dataset.active = String(active)
      row.setAttribute('aria-selected', String(active))
    }
    this.input.setAttribute('aria-activedescendant', `${this.#listId}-${this.#active}`)
  }

  #keydown(event: KeyboardEvent): void {
    const open = this.floating.isOpen
    if (event.key === 'ArrowDown' && open) {
      event.preventDefault()
      this.#active = Math.min(this.#active + 1, this.#suggestions.length - 1)
      this.#mark()
    } else if (event.key === 'ArrowUp' && open) {
      event.preventDefault()
      this.#active = Math.max(this.#active - 1, 0)
      this.#mark()
    } else if (event.key === 'Enter' && open) {
      event.preventDefault()
      const option = this.#suggestions[this.#active]
      if (option) {
        this.#choose(option)
      }
    } else if (event.key === 'Escape' && !open) {
      this.input.value = this.#label
    }
  }

  #choose(option: ListOption | null): void {
    this.#abort()
    this.floating.close('api')
    this.#suggestions = []
    const next = option?.value ?? ''
    this.#label = option?.label ?? ''
    this.input.value = this.#label
    if (next !== this.holder.value) {
      this.holder.value = next
      dispatchChange(this.holder)
    }
    this.#show()
  }

  focus(): void {
    this.input.focus()
  }

  override dispose(): void {
    this.#abort()
    this.#listeners.abort()
    this.floating.dispose()
    this.zone.remove()
    if (this.#nativeType !== null) {
      this.holder.type = this.#nativeType
    } else {
      this.holder.remove()
    }
    super.dispose()
  }
}
