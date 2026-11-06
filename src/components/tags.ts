// Étiquettes (nouveau composant, absent de MyCRM) : une zone où chaque mot tapé devient une étiquette. Entrée, la
// virgule ou le point-virgule la créent ; Retour arrière dans la zone vide retire la dernière ; un collage est
// découpé ; pas de doublon. Avec `options`, des suggestions s'affichent sous la zone (recherche par mots, ↑ ↓,
// Entrée) ; `allowNew` (vrai par défaut) accepte aussi des étiquettes hors de la liste ; `max` limite leur nombre.
//
// Valeur : la liste des étiquettes ; le formulaire reçoit une valeur par étiquette (champs cachés de même nom).
// Posé sur un <input> existant, le composant s'en sert comme zone de saisie et lit sa valeur (« a, b, c »).
import { Component, type Options } from '../core/component.ts'
import { h } from '../core/dom.ts'
import { Floating } from '../core/floating.ts'
import { icon } from '../core/icons.ts'
import { t } from '../i18n/i18n.ts'
import { comparable, highlight, matchesWords, wordsOf } from '../utils/search.ts'
import { toggleAttribute } from './field.ts'
import { optionsFromElements, type ListOption } from './list.ts'

/** Valeurs lues dans un tableau, du JSON ou un texte séparé par des virgules. */
function toList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String)
  }
  const text = value == null ? '' : String(value).trim()
  if (text.startsWith('[')) {
    try {
      return (JSON.parse(text) as unknown[]).map(String)
    } catch {
      // Pas du JSON : texte séparé par des virgules.
    }
  }
  return text.split(/[,;\n]/).map((v) => v.trim()).filter(Boolean)
}

export class TifTags extends Component {
  static override NAME = 'tags'
  static override DEFAULTS: Options = {
    name: '',
    value: [] as string[],
    /** Suggestions : { value, label }[] (ou les <option> écrites dans la balise). */
    options: [] as ListOption[],
    /** Accepte des étiquettes hors des suggestions. */
    allowNew: true,
    /** Nombre maximal d'étiquettes (0 : pas de limite). */
    max: 0,
    /** Caractères qui créent l'étiquette en cours, en plus d'Entrée. */
    separators: ',;',
    placeholder: '',
    disabled: false,
    required: false,
    label: '',
    inputId: '',
    quiet: false,
  }

  readonly zone: HTMLSpanElement
  readonly input: HTMLInputElement
  readonly panel: HTMLDivElement
  readonly floating: Floating
  readonly #values: HTMLSpanElement
  readonly #native: { name: string; value: string; placeholder: string } | null
  readonly #listeners = new AbortController()
  #tags: { value: string; label: string }[] = []
  #suggestions: ListOption[] = []
  #active = 0

  constructor(element: HTMLElement, options: Options = {}) {
    super(element, options)
    const native = element instanceof HTMLInputElement ? element : null
    this.#native = native ? { name: native.name, value: native.value, placeholder: native.placeholder } : null
    if (!native) {
      const written = optionsFromElements(element)
      if (written.length && !(this.options.options as ListOption[]).length) {
        this.options.options = written
      }
      for (const node of Array.from(element.querySelectorAll('option, optgroup'))) {
        node.remove()
      }
    }
    if (native) {
      if (!toList(this.options.value).length && native.value) {
        this.options.value = native.value
      }
      if (!this.options.name && native.name) {
        this.options.name = native.name
      }
      // La zone de saisie ne s'envoie pas : ce sont les champs cachés, un par étiquette.
      native.removeAttribute('name')
      native.value = ''
    }
    this.input = native ?? h('input', { type: 'text' })
    this.input.classList.add('tif-tags-input')
    this.input.autocomplete = 'off'
    this.#values = h('span', { hidden: true })
    this.zone = h('span', { class: 'tif tif-field tif-tags' })
    if (native) {
      native.before(this.zone)
    } else {
      element.append(this.zone)
    }
    this.zone.append(this.input, this.#values)
    this.panel = h('div', { class: 'tif-listbox-panel tif-tags-panel' })
    this.floating = new Floating(this.zone, this.panel, { matchWidth: true, returnFocus: this.input })
    this.#listen()
    this.#tags = this.#resolve(toList(this.options.value))
    this.#apply(Object.keys(this.options))
  }

  /** Étiquettes, dans l'ordre (leurs valeurs). */
  override get value(): string[] {
    return this.#tags.map((tag) => tag.value)
  }

  override set value(value: unknown) {
    this.#tags = this.#resolve(toList(value))
    this.#render()
  }

  #all(): ListOption[] {
    return (this.options.options as ListOption[] | null) ?? []
  }

  /** Étiquettes d'après leurs valeurs : le libellé de la suggestion quand il y en a une. */
  #resolve(values: string[]): { value: string; label: string }[] {
    const seen = new Set<string>()
    const tags: { value: string; label: string }[] = []
    for (const value of values) {
      const option = this.#all().find((o) => o.value === value)
      const key = comparable(value)
      if (!seen.has(key)) {
        seen.add(key)
        tags.push({ value, label: option?.label ?? value })
      }
    }
    return tags
  }

  #full(): boolean {
    const max = Number(this.options.max) || 0
    return max > 0 && this.#tags.length >= max
  }

  /** Ajoute une étiquette (texte tapé ou suggestion) ; rend true si elle a été ajoutée. */
  add(text: string, option?: ListOption): boolean {
    const label = (option?.label ?? text).trim()
    if (!label || this.#full()) {
      return false
    }
    // Un texte qui correspond à une suggestion prend sa valeur ; sinon il faut allowNew.
    const known = option ?? this.#all().find((o) => comparable(o.label) === comparable(label) || comparable(o.value) === comparable(label))
    if (!known && !this.options.allowNew) {
      return false
    }
    const value = known?.value ?? label
    if (this.#tags.some((tag) => comparable(tag.value) === comparable(value))) {
      return false
    }
    this.#tags.push({ value, label: known?.label ?? label })
    this.#render()
    this.#changed()
    return true
  }

  /** Retire une étiquette par sa valeur. */
  remove(value: string): void {
    const before = this.#tags.length
    this.#tags = this.#tags.filter((tag) => tag.value !== value)
    if (this.#tags.length !== before) {
      this.#render()
      this.#changed()
    }
  }

  #changed(): void {
    this.element.dispatchEvent(new Event('input', { bubbles: true }))
    this.element.dispatchEvent(new Event('change', { bubbles: true }))
  }

  #listen(): void {
    const signal = this.#listeners.signal
    // Un clic dans la zone, hors d'une étiquette, place le curseur dans la saisie.
    this.zone.addEventListener(
      'mousedown',
      (event) => {
        if (event.target === this.zone) {
          event.preventDefault()
          this.input.focus()
        }
      },
      { signal },
    )
    this.input.addEventListener('input', () => this.#typed(), { signal })
    this.input.addEventListener('keydown', (event) => this.#keydown(event), { signal })
    this.input.addEventListener(
      'paste',
      (event) => {
        const text = event.clipboardData?.getData('text') ?? ''
        if (/[,;\n]/.test(text)) {
          event.preventDefault()
          for (const part of text.split(/[,;\n]/)) {
            this.add(part)
          }
          this.input.value = ''
        }
      },
      { signal },
    )
    this.input.addEventListener(
      'blur',
      (event) => {
        if (this.floating.owns(event.relatedTarget as Node | null)) {
          return
        }
        this.floating.close('api')
        // Le texte laissé dans la zone devient une étiquette, comme avec Entrée.
        if (this.input.value.trim() && this.add(this.input.value)) {
          this.input.value = ''
        }
      },
      { signal },
    )
    this.panel.addEventListener('mousedown', (event) => event.preventDefault(), { signal })
  }

  #typed(): void {
    const separators = String(this.options.separators ?? '')
    const text = this.input.value
    // L'espace tapé après une virgule (« a, b ») ne reste pas seul dans la zone.
    if (text !== '' && text.trim() === '') {
      this.input.value = ''
      this.floating.close('api')
      return
    }
    const last = text.slice(-1)
    if (last && separators.includes(last)) {
      if (this.add(text.slice(0, -1))) {
        this.input.value = ''
      } else {
        this.input.value = text.slice(0, -1)
      }
      this.floating.close('api')
      return
    }
    this.#suggest()
  }

  /** Suggestions correspondant à la saisie, sans celles déjà choisies. */
  #suggest(): void {
    const words = wordsOf(this.input.value)
    const chosen = new Set(this.#tags.map((tag) => comparable(tag.value)))
    this.#suggestions = words.length
      ? this.#all().filter((o) => !chosen.has(comparable(o.value)) && matchesWords(o.label, words)).slice(0, 20)
      : []
    this.#active = 0
    if (!this.#suggestions.length || this.#full()) {
      this.floating.close('api')
      return
    }
    this.panel.replaceChildren(
      h(
        'div',
        { class: 'tif-listbox', role: 'listbox' },
        ...this.#suggestions.map((option, i) => {
          const row = h(
            'div',
            { role: 'option', class: 'tif-option', 'data-active': String(i === 0), 'aria-selected': String(i === 0) },
            h('span', { class: 'tif-option-label' }, highlight(option.label, words)),
          )
          row.addEventListener('mousedown', (event) => {
            event.preventDefault()
            this.#pick(option)
          })
          row.addEventListener('mouseenter', () => this.#mark(i))
          return row
        }),
      ),
    )
    if (!this.floating.isOpen) {
      this.floating.open()
    } else {
      this.floating.position()
    }
  }

  #mark(index: number): void {
    this.#active = index
    this.panel.querySelectorAll<HTMLElement>('[role="option"]').forEach((row, i) => {
      row.dataset.active = String(i === index)
      row.setAttribute('aria-selected', String(i === index))
    })
  }

  #pick(option: ListOption): void {
    this.add(option.label, option)
    this.input.value = ''
    this.floating.close('api')
    this.input.focus()
  }

  #keydown(event: KeyboardEvent): void {
    const open = this.floating.isOpen
    if (event.key === 'ArrowDown' && open) {
      event.preventDefault()
      this.#mark(Math.min(this.#active + 1, this.#suggestions.length - 1))
    } else if (event.key === 'ArrowUp' && open) {
      event.preventDefault()
      this.#mark(Math.max(this.#active - 1, 0))
    } else if (event.key === 'Enter') {
      // Entrée crée l'étiquette au lieu d'envoyer le formulaire, tant qu'il y a quelque chose à créer.
      if (open && this.#suggestions[this.#active]) {
        event.preventDefault()
        this.#pick(this.#suggestions[this.#active])
      } else if (this.input.value.trim()) {
        event.preventDefault()
        if (this.add(this.input.value)) {
          this.input.value = ''
        }
      }
    } else if (event.key === 'Backspace' && this.input.value === '' && this.#tags.length) {
      event.preventDefault()
      this.remove(this.#tags[this.#tags.length - 1].value)
    }
  }

  protected override optionsChanged(keys: string[]): void {
    if (keys.includes('value') || keys.includes('options')) {
      this.#tags = this.#resolve(keys.includes('value') ? toList(this.options.value) : this.value)
    }
    this.#apply(keys)
  }

  #apply(keys: string[]): void {
    const o = this.options
    if (keys.includes('disabled')) {
      this.input.disabled = Boolean(o.disabled)
      this.zone.toggleAttribute('aria-disabled', Boolean(o.disabled))
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
    this.#render()
  }

  #render(): void {
    const o = this.options
    const disabled = Boolean(o.disabled)
    for (const chip of this.zone.querySelectorAll('.tif-tag')) {
      chip.remove()
    }
    for (const tag of this.#tags) {
      const remove = h('button', { type: 'button', class: 'tif-tag-remove', tabindex: '-1', 'aria-label': t('tags.remove', { label: tag.label }), title: t('tags.remove', { label: tag.label }), hidden: disabled }, icon('close'))
      remove.addEventListener('click', () => {
        this.remove(tag.value)
        this.input.focus()
      })
      this.input.before(h('span', { class: 'tif-tag', 'data-value': tag.value }, h('span', { class: 'tif-tag-label' }, tag.label), remove))
    }
    const full = this.#full()
    this.input.readOnly = full
    this.input.placeholder = full ? t('tags.full') : this.#tags.length ? '' : String(o.placeholder || this.#native?.placeholder || t('tags.add'))
    this.zone.classList.toggle('tif-missing', Boolean(o.required) && this.#tags.length === 0)
    // Valeurs envoyées par le formulaire : une par étiquette.
    this.#values.replaceChildren(...(o.name ? this.#tags.map((tag) => h('input', { type: 'hidden', name: String(o.name), value: tag.value, disabled })) : []))
  }

  protected override localeChanged(): void {
    this.#render()
  }

  focus(): void {
    this.input.focus()
  }

  override dispose(): void {
    this.#listeners.abort()
    this.floating.dispose()
    for (const chip of this.zone.querySelectorAll('.tif-tag')) {
      chip.remove()
    }
    this.#values.remove()
    if (this.#native) {
      this.input.classList.remove('tif-tags-input')
      this.input.readOnly = false
      this.input.placeholder = this.#native.placeholder
      this.input.value = this.value.join(', ')
      if (this.#native.name) {
        this.input.name = this.#native.name
      }
      this.zone.replaceWith(this.input)
    } else {
      this.zone.remove()
    }
    super.dispose()
  }
}
