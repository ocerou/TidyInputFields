// Liste de choix multiple (repris de MyCRM, InputMultiSelect), pour les filtres : au repos, une liste déroulante qui
// montre « Tous les … » quand rien n'est coché, le libellé du choix quand il y en a un, « 3 secteurs » au-delà (le
// détail en infobulle). Ouverte, une case par option, cochée ou non sans refermer le panneau ; une recherche en tête à
// partir de `searchThreshold` options ; en pied, « Tout cocher » (les options affichées) tant que rien n'est coché,
// « Tout décocher » ensuite. Une option avec `selects` est un raccourci sans case (« Mes comptes ») qui remplace la
// sélection par ses valeurs. Clavier : ↑ ↓, Entrée ou Espace pour cocher, Échap pour fermer.
//
// Les valeurs vivent dans un <select multiple> (celui qu'on habille, ou un caché) : le formulaire les envoie toutes.
import type { Options } from '../core/component.ts'
import { h } from '../core/dom.ts'
import { t } from '../i18n/i18n.ts'
import { byGroup, highlight, matchesWords, wordsOf } from '../utils/search.ts'
import { dispatchChange } from './field.ts'
import { ListSelect, optionsFromElements, type ListOption } from './list.ts'

/** Valeurs lues dans un tableau, du JSON ou une liste séparée par des virgules. */
function toValues(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String)
  }
  const text = value == null ? '' : String(value).trim()
  if (!text) {
    return []
  }
  if (text.startsWith('[')) {
    try {
      return (JSON.parse(text) as unknown[]).map(String)
    } catch {
      // Pas du JSON : liste séparée par des virgules.
    }
  }
  return text.split(',').map((v) => v.trim()).filter(Boolean)
}

export class TifMultiSelect extends ListSelect {
  static override NAME = 'multi-select'
  static override DEFAULTS: Options = {
    name: '',
    value: [] as string[],
    options: [] as ListOption[],
    /** Libellé quand rien n'est coché (« Tous les types ») ; c'est aussi le nom accessible de la liste. */
    label: '',
    /** Nom au pluriel pour « 3 secteurs » ; par défaut, le libellé sans « Tous les » / « Toutes les ». */
    unit: '',
    groupOrder: [] as string[],
    searchThreshold: 8,
    disabled: false,
    quiet: false,
  }

  /** Le <select multiple> qui porte les valeurs. */
  readonly holder: HTMLSelectElement
  readonly #native: HTMLSelectElement | null

  constructor(element: HTMLElement, options: Options = {}) {
    super(element, options)
    const native = element instanceof HTMLSelectElement ? element : null
    this.#native = native
    const source = native ?? element
    const written = optionsFromElements(source)
    if (written.length && !(this.options.options as ListOption[]).length) {
      this.options.options = written
    }
    if (native) {
      native.multiple = true
      if (!toValues(this.options.value).length) {
        this.options.value = [...native.selectedOptions].map((o) => o.value)
      }
      native.hidden = true
      this.holder = native
      native.after(this.button)
    } else {
      for (const option of Array.from(element.querySelectorAll('option, optgroup'))) {
        option.remove()
      }
      this.holder = h('select', { multiple: true, hidden: true, class: 'tif-multi-value', tabindex: '-1', 'aria-hidden': 'true' })
      element.append(this.holder, this.button)
    }
    this.#apply(Object.keys(this.options))
  }

  /** Valeurs cochées, dans l'ordre des options. */
  override get value(): string[] {
    return [...this.holder.selectedOptions].map((o) => o.value)
  }

  override set value(value: unknown) {
    this.#setValues(toValues(value))
  }

  #all(): ListOption[] {
    return (this.options.options as ListOption[] | null) ?? []
  }

  /** Recopie les choix dans le <select multiple>, cochés selon `values`. */
  #setValues(values: string[]): void {
    const choices = this.#all().filter((o) => !o.selects)
    const known = new Set(choices.map((o) => o.value))
    this.holder.replaceChildren(
      ...choices.map((o) => h('option', { value: o.value, selected: values.includes(o.value) }, o.label)),
      // Valeurs inconnues des options : gardées, pour ne rien perdre.
      ...values.filter((v) => !known.has(v)).map((v) => h('option', { value: v, selected: true }, v)),
    )
    for (const option of this.holder.options) {
      option.selected = values.includes(option.value)
    }
    this.#render()
  }

  protected override optionsChanged(keys: string[]): void {
    this.#apply(keys)
  }

  #apply(keys: string[]): void {
    const o = this.options
    if (keys.includes('name') && o.name) {
      this.holder.name = String(o.name)
    }
    if (keys.includes('options') || keys.includes('value')) {
      this.#setValues(keys.includes('value') ? toValues(o.value) : this.value)
    }
    if (keys.includes('disabled')) {
      this.button.disabled = Boolean(o.disabled)
      this.holder.disabled = Boolean(o.disabled)
      if (o.disabled) {
        this.close()
      }
    }
    if (keys.includes('quiet')) {
      this.button.classList.toggle('tif-quiet', Boolean(o.quiet))
    }
    this.#render()
  }

  #label(): string {
    return String(this.options.label || '')
  }

  #render(): void {
    const values = this.value
    const chosen = this.#all().filter((o) => !o.selects && values.includes(o.value))
    const label = this.#label()
    // Pluriel : « 3 secteurs » ; par défaut le libellé sans « Tous les ».
    let plural = String(this.options.unit || '')
    if (!plural) {
      try {
        plural = label.replace(new RegExp(t('multi.allPrefix')), '')
      } catch {
        plural = label
      }
    }
    const shown = values.length === 0 ? label : values.length === 1 && chosen.length === 1 ? chosen[0].label : `${values.length} ${plural}`
    this.setButtonLabel(shown, values.length === 0)
    this.button.title = chosen.length > 1 ? chosen.map((o) => o.label).join(', ') : ''
    if (label) {
      this.button.setAttribute('aria-label', label)
    }
    this.button.classList.toggle('tif-filter-set', values.length > 0)
  }

  protected override localeChanged(): void {
    this.#render()
  }

  // --- Liste ---

  protected withSearch(): boolean {
    return this.#all().length >= Number(this.options.searchThreshold)
  }

  protected override multiple(): boolean {
    return true
  }

  protected matches(): ListOption[] {
    const words = wordsOf(this.search)
    return byGroup(this.#all(), (this.options.groupOrder as string[]) ?? []).filter((o) => matchesWords(o.label, words))
  }

  protected optionContent(option: ListOption, words: string[]) {
    const checked = !option.selects && this.value.includes(option.value)
    const box = !option.selects && h('input', { type: 'checkbox', tabindex: '-1', 'aria-hidden': 'true', class: 'tif-option-box' })
    if (box) {
      box.checked = checked
    }
    return [box, h('span', { class: 'tif-option-label' }, highlight(option.label, words))]
  }

  protected optionState(option: ListOption) {
    return {
      selected: option.selects ? undefined : this.value.includes(option.value),
      className: option.selects ? 'tif-option-shortcut' : 'tif-option-check',
    }
  }

  protected pick(option: ListOption): void {
    const values = this.value
    let next: string[]
    if (option.selects) {
      // Raccourci : ne garde que ses valeurs ; si la sélection est déjà exactement la sienne, la vide.
      const same = values.length === option.selects.length && option.selects.every((v) => values.includes(v))
      next = same ? [] : [...option.selects]
    } else {
      next = values.includes(option.value) ? values.filter((v) => v !== option.value) : [...values, option.value]
    }
    this.#commit(next)
  }

  #commit(next: string[]): void {
    const before = this.value.join('\n')
    this.#setValues(next)
    this.renderList()
    if (this.value.join('\n') !== before) {
      dispatchChange(this.holder)
    }
  }

  /** Espace coche l'option active (hors de la zone de recherche, où il s'écrit). */
  protected override panelKey(event: KeyboardEvent): boolean {
    if (event.key === ' ' && !(event.target instanceof HTMLInputElement)) {
      event.preventDefault()
      const option = this.activeOption()
      if (option) {
        this.pick(option)
      }
      return true
    }
    return false
  }

  protected footer() {
    const values = this.value
    const matches = this.matches()
    const count = values.length ? t('multi.checked', { count: values.length }) : t('search.choices', { count: this.#all().filter((o) => !o.selects).length })
    let action: HTMLButtonElement | null = null
    if (values.length > 0) {
      action = h('button', { type: 'button', class: 'tif-link-btn' }, t('multi.uncheckAll'))
      action.addEventListener('click', () => this.#commit([]))
    } else if (matches.length > 0) {
      action = h('button', { type: 'button', class: 'tif-link-btn' }, t('multi.checkAll'))
      action.addEventListener('click', () => this.#commit(matches.filter((o) => !o.selects).map((o) => o.value)))
    }
    action?.addEventListener('mousedown', (event) => event.preventDefault())
    return [count, action]
  }

  override dispose(): void {
    if (this.#native) {
      this.#native.hidden = false
    } else {
      this.holder.remove()
    }
    super.dispose()
  }
}
