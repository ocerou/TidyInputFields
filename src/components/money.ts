// Montant avec devise (nouveau composant) : au repos, le montant mis en forme dans la langue (« 1 234,50 », avec
// les décimales de la devise) et la devise à la suite ; au focus, la saisie brute (« 1234,5 »), qui accepte la
// virgule comme le point et ignore les espaces. La saisie est validée en quittant la zone ou par Entrée ; une saisie
// illisible garde le montant d'avant, Échap l'annule. La devise est fixe (`currency`) ou se choisit dans une liste
// (`currencies`), envoyée sous `currencyName`.
//
// Valeur : le montant en nombre JSON (« 1234.5 »), '' si vide, dans un champ caché (ou le champ habillé).
import { Component, type Options } from '../core/component.ts'
import { h } from '../core/dom.ts'
import { getLocale, t } from '../i18n/i18n.ts'
import { dispatchChange, toggleAttribute } from './field.ts'

/**
 * Montant lu dans une saisie (« 1 234,50 », « 1234.5 », « 1.234,5 », « -12 ») ; null si illisible, '' si vide.
 * Espaces et apostrophes (séparateurs suisses) sont ignorés. Avec virgule et point, le dernier des deux est la
 * séparation décimale. Avec un seul des deux : répété, il sépare les milliers ; unique, il est décimal, sauf s'il est
 * le séparateur de milliers de la langue et suivi de trois chiffres exactement (« 1.234 » en allemand : 1234).
 */
export function parseAmount(text: string, locale = getLocale()): number | '' | null {
  let s = text.replace(/[\s  '’]/g, '')
  if (s === '') {
    return ''
  }
  const group = new Intl.NumberFormat(locale).formatToParts(12345).find((p) => p.type === 'group')?.value ?? ''
  const last = Math.max(s.lastIndexOf(','), s.lastIndexOf('.'))
  if (s.includes(',') && s.includes('.')) {
    s = `${s.slice(0, last).replace(/[.,]/g, '')}.${s.slice(last + 1)}`
  } else if (last >= 0) {
    const mark = s[last]
    const count = s.split(mark).length - 1
    const thousands = count > 1 || (mark === group && /^-?\d{1,3}[.,]\d{3}$/.test(s))
    s = thousands ? s.split(mark).join('') : s.replace(mark, '.')
  }
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) {
    return null
  }
  return Number(s)
}

export class TifMoney extends Component {
  static override NAME = 'money'
  static override DEFAULTS: Options = {
    name: '',
    value: '',
    /** Code ISO de la devise (« EUR », « USD »…). */
    currency: 'EUR',
    /** Devises proposées dans une liste (codes ISO) ; vide : devise fixe. */
    currencies: [] as string[],
    /** Nom sous lequel le formulaire envoie la devise choisie. */
    currencyName: '',
    /** Décimales ; par défaut celles de la devise (2 pour l'euro, 0 pour le yen). */
    decimals: -1,
    min: '',
    max: '',
    placeholder: '',
    required: false,
    disabled: false,
    label: '',
    inputId: '',
    quiet: false,
  }

  readonly holder: HTMLInputElement
  readonly input: HTMLInputElement
  readonly zone: HTMLSpanElement
  readonly #currency: HTMLSpanElement
  readonly #select: HTMLSelectElement
  readonly #native: { type: string; id: string } | null
  readonly #listeners = new AbortController()

  constructor(element: HTMLElement, options: Options = {}) {
    super(element, options)
    const native = element instanceof HTMLInputElement ? element : null
    this.#native = native ? { type: native.type, id: native.id } : null
    this.holder = native ?? h('input', { type: 'hidden' })
    if (native) {
      if (this.options.value === '' && native.value) {
        this.options.value = native.value
      }
      native.type = 'hidden'
    }
    this.input = h('input', { type: 'text', class: 'tif-money-input tif-mono', inputmode: 'decimal', autocomplete: 'off' })
    this.#currency = h('span', { class: 'tif-money-currency' })
    this.#select = h('select', { class: 'tif-money-select' })
    this.zone = h('span', { class: 'tif tif-field tif-money' }, this.input, this.#currency, this.#select)
    if (native) {
      if (native.id && !this.options.inputId) {
        this.options.inputId = native.id
        native.removeAttribute('id')
      }
      native.after(this.zone)
    } else {
      element.append(this.holder, this.zone)
    }
    const signal = this.#listeners.signal
    this.input.addEventListener('focus', () => this.#edit(), { signal })
    this.input.addEventListener('blur', () => this.validate(), { signal })
    this.input.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Enter') {
          this.validate()
          this.#edit()
        } else if (event.key === 'Escape') {
          this.#edit()
        }
      },
      { signal },
    )
    this.#select.addEventListener(
      'change',
      () => {
        this.options.currency = this.#select.value
        this.#show()
      },
      { signal },
    )
    // Un clic sur la devise (texte) place le curseur dans le montant.
    this.#currency.addEventListener('mousedown', (event) => {
      event.preventDefault()
      this.input.focus()
    }, { signal })
    this.#apply(Object.keys(this.options))
  }

  /** Montant en nombre JSON (« 1234.5 »), '' si vide. */
  override get value(): string {
    return this.holder.value
  }

  override set value(value: unknown) {
    const parsed = value === '' || value == null ? '' : typeof value === 'number' ? value : parseAmount(String(value), 'en')
    this.holder.value = parsed === null || parsed === '' ? '' : String(this.#round(parsed))
    this.#show()
  }

  /** Montant en nombre, null si vide. */
  get amount(): number | null {
    return this.holder.value === '' ? null : Number(this.holder.value)
  }

  /** Devise choisie (code ISO). */
  get currency(): string {
    return String(this.options.currency || 'EUR').toUpperCase()
  }

  #decimals(): number {
    const given = Number(this.options.decimals)
    if (given >= 0) {
      return given
    }
    try {
      return new Intl.NumberFormat('en', { style: 'currency', currency: this.currency }).resolvedOptions().maximumFractionDigits ?? 2
    } catch {
      return 2
    }
  }

  #round(n: number): number {
    const factor = 10 ** this.#decimals()
    return Math.round(n * factor) / factor
  }

  /** Montant au repos : séparateurs de la langue, décimales de la devise. */
  #formatted(n: number): string {
    const d = this.#decimals()
    return new Intl.NumberFormat(getLocale(), { minimumFractionDigits: d, maximumFractionDigits: d }).format(n)
  }

  /** Symbole de la devise dans la langue (« € », « $US », « CHF »). */
  #symbol(): string {
    try {
      return (
        new Intl.NumberFormat(getLocale(), { style: 'currency', currency: this.currency, currencyDisplay: 'narrowSymbol' })
          .formatToParts(0)
          .find((p) => p.type === 'currency')?.value ?? this.currency
      )
    } catch {
      return this.currency
    }
  }

  /** Saisie brute : le nombre avec le séparateur décimal de la langue, sans séparateur de milliers. */
  #edit(): void {
    const n = this.amount
    this.input.value = n === null ? '' : new Intl.NumberFormat(getLocale(), { useGrouping: false, maximumFractionDigits: 20 }).format(n)
    this.input.select()
  }

  /** Valide la saisie : le montant lu est transmis s'il change (une saisie illisible garde le montant d'avant). */
  validate(): boolean {
    const parsed = parseAmount(this.input.value)
    const next = parsed === null ? this.holder.value : parsed === '' ? '' : String(this.#round(parsed))
    const changed = next !== this.holder.value
    this.holder.value = next
    this.#show()
    if (changed) {
      dispatchChange(this.holder)
    }
    return changed
  }

  #show(): void {
    if (document.activeElement !== this.input) {
      const n = this.amount
      this.input.value = n === null ? '' : this.#formatted(n)
    }
    const list = (this.options.currencies as string[] | null) ?? []
    this.#select.hidden = list.length === 0
    this.#currency.hidden = list.length > 0
    this.#currency.textContent = this.#symbol()
    this.#currency.title = this.currency
    if (list.length) {
      const codes = list.map((c) => String(c).toUpperCase())
      if (this.#select.options.length !== codes.length || [...this.#select.options].some((o, i) => o.value !== codes[i])) {
        this.#select.replaceChildren(...codes.map((code) => h('option', { value: code }, code)))
      }
      this.#select.value = this.currency
    }
    this.zone.classList.toggle('tif-missing', Boolean(this.options.required) && this.holder.value === '')
  }

  protected override optionsChanged(keys: string[]): void {
    this.#apply(keys)
  }

  #apply(keys: string[]): void {
    const o = this.options
    if (keys.includes('name')) {
      this.holder.name = String(o.name ?? '')
    }
    if (keys.includes('currencyName')) {
      if (o.currencyName) {
        this.#select.name = String(o.currencyName)
      } else {
        this.#select.removeAttribute('name')
      }
    }
    if (keys.includes('value')) {
      this.value = o.value
    }
    if (keys.includes('placeholder')) {
      this.input.placeholder = String(o.placeholder || '')
    }
    if (keys.includes('required')) {
      this.input.required = Boolean(o.required)
    }
    if (keys.includes('disabled')) {
      this.input.disabled = Boolean(o.disabled)
      this.#select.disabled = Boolean(o.disabled)
      this.holder.disabled = Boolean(o.disabled)
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
    this.#select.setAttribute('aria-label', t('money.currency'))
    this.#show()
  }

  protected override localeChanged(): void {
    this.#apply([])
  }

  focus(): void {
    this.input.focus()
  }

  override dispose(): void {
    this.#listeners.abort()
    this.zone.remove()
    if (this.#native) {
      this.holder.type = this.#native.type
      if (this.#native.id) {
        this.holder.id = this.#native.id
      }
    } else {
      this.holder.remove()
    }
    super.dispose()
  }
}
