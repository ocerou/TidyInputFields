// Note en étoiles (nouveau composant) : de 0 à `max` étoiles, comme un groupe de boutons radio. Un clic choisit la
// note (un clic sur la note courante la retire, si `clearable`) ; au survol, les étoiles montrent la note qu'on
// choisirait. Clavier : ← → (ou ↑ ↓) d'une étoile, Origine et Fin, 0 ou Suppr pour retirer la note. En lecture seule,
// une note décimale (3,5) remplit l'étoile en partie.
//
// Valeur : le nombre d'étoiles (« 0 » sans note), dans un champ caché (ou le champ habillé).
import { Component, type Options } from '../core/component.ts'
import { h } from '../core/dom.ts'
import { icon } from '../core/icons.ts'
import { getLocale, t } from '../i18n/i18n.ts'
import { dispatchChange, toggleAttribute } from './field.ts'

export class TifRating extends Component {
  static override NAME = 'rating'
  static override DEFAULTS: Options = {
    name: '',
    value: 0,
    max: 5,
    /** Un clic sur la note courante la retire. */
    clearable: true,
    readonly: false,
    disabled: false,
    /** Nom lu par les lecteurs d'écran (« Note » par défaut). */
    label: '',
    inputId: '',
  }

  readonly holder: HTMLInputElement
  readonly group: HTMLSpanElement
  readonly #native: { type: string } | null
  readonly #listeners = new AbortController()
  #hover = 0

  constructor(element: HTMLElement, options: Options = {}) {
    super(element, options)
    const native = element instanceof HTMLInputElement ? element : null
    this.#native = native ? { type: native.type } : null
    this.holder = native ?? h('input', { type: 'hidden' })
    if (native) {
      if (!Number(this.options.value) && native.value) {
        this.options.value = native.value
      }
      native.type = 'hidden'
    }
    this.group = h('span', { class: 'tif tif-rating', role: 'radiogroup' })
    if (native) {
      native.after(this.group)
    } else {
      element.append(this.holder, this.group)
    }
    const signal = this.#listeners.signal
    this.group.addEventListener('keydown', (event) => this.#keydown(event), { signal })
    this.group.addEventListener(
      'mouseleave',
      () => {
        this.#hover = 0
        this.#paint()
      },
      { signal },
    )
    this.#apply(Object.keys(this.options))
  }

  /** Nombre d'étoiles (0 : sans note). */
  override get value(): number {
    return Number(this.holder.value) || 0
  }

  override set value(value: unknown) {
    this.holder.value = String(this.#clamp(Number(value) || 0))
    this.#render()
  }

  #max(): number {
    return Math.max(1, Math.round(Number(this.options.max) || 5))
  }

  /** Une note saisie tient entre 0 et max ; en lecture seule elle peut être décimale (au demi près à l'écran). */
  #clamp(n: number): number {
    const bounded = Math.min(this.#max(), Math.max(0, n))
    return this.options.readonly ? bounded : Math.round(bounded)
  }

  #interactive(): boolean {
    return !this.options.readonly && !this.options.disabled
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
      this.holder.value = String(this.#clamp(Number(o.value) || 0))
    }
    if (keys.includes('disabled')) {
      this.holder.disabled = Boolean(o.disabled)
    }
    if (keys.includes('inputId') && o.inputId) {
      this.group.id = String(o.inputId)
    }
    this.#render()
  }

  /** Choisit une note, comme l'utilisateur (input, change). */
  #choose(n: number): void {
    const next = this.#clamp(n)
    if (next === this.value) {
      return
    }
    this.holder.value = String(next)
    this.#render()
    dispatchChange(this.holder)
  }

  #render(): void {
    const max = this.#max()
    const value = this.value
    const interactive = this.#interactive()
    const label = String(this.options.label || t('rating.label'))
    this.group.setAttribute('aria-label', label)
    this.group.toggleAttribute('aria-disabled', Boolean(this.options.disabled))
    this.group.toggleAttribute('aria-readonly', Boolean(this.options.readonly))
    // En lecture seule, une seule image accessible : « 3,5 étoiles sur 5 ».
    if (!interactive) {
      this.group.setAttribute('role', 'img')
      // « Note : 3,5 étoiles sur 5 » / « Rating: 3.5 stars out of 5 » : la ponctuation de la langue.
      this.group.setAttribute('aria-label', t('period.labelled', { field: label, period: this.#describe(value) }))
    } else {
      this.group.setAttribute('role', 'radiogroup')
    }
    const focusable = Math.max(1, Math.round(value))
    this.group.replaceChildren(
      ...Array.from({ length: max }, (_, i) => {
        const n = i + 1
        const star = h(
          interactive ? 'button' : 'span',
          interactive
            ? {
                type: 'button',
                class: 'tif-star',
                role: 'radio',
                'aria-checked': String(n === Math.round(value)),
                'aria-label': this.#describe(n),
                tabindex: n === focusable ? '0' : '-1',
                'data-star': String(n),
              }
            : { class: 'tif-star', 'aria-hidden': 'true', 'data-star': String(n) },
          h('span', { class: 'tif-star-empty' }, icon('star')),
          h('span', { class: 'tif-star-full' }, icon('starFill')),
        )
        if (interactive) {
          star.addEventListener('click', () => {
            const clearable = Boolean(this.options.clearable)
            this.#choose(clearable && n === this.value ? 0 : n)
            this.group.querySelector<HTMLElement>(`[data-star="${Math.max(1, this.value)}"]`)?.focus()
          })
          star.addEventListener('mouseenter', () => {
            this.#hover = n
            this.#paint()
          })
        }
        return star
      }),
    )
    toggleAttribute(this.group, 'title', interactive ? null : this.#describe(value))
    this.#paint()
  }

  /** Remplissage des étoiles : la note survolée, sinon la note choisie (en partie pour une note décimale). */
  #paint(): void {
    const shown = this.#hover || this.value
    this.group.classList.toggle('tif-rating-hover', this.#hover > 0)
    for (const star of this.group.querySelectorAll<HTMLElement>('.tif-star')) {
      const n = Number(star.dataset.star)
      const fill = Math.min(1, Math.max(0, shown - (n - 1)))
      // Au demi près : 3,3 montre trois étoiles et demie, 3,2 trois étoiles.
      const rounded = Math.round(fill * 2) / 2
      star.style.setProperty('--tif-star-fill', `${rounded * 100}%`)
    }
  }

  #describe(n: number): string {
    if (!n) {
      return t('rating.none')
    }
    // Le nombre sert au pluriel ; affiché, il prend le format de la langue (« 3,5 »).
    const count = new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 1 }).format(n)
    return t('rating.stars', { count: n, max: this.#max() }).replace(String(n), count)
  }

  #keydown(event: KeyboardEvent): void {
    if (!this.#interactive()) {
      return
    }
    const rtl = getComputedStyle(this.group).direction === 'rtl'
    const moves: Record<string, number> = {
      ArrowRight: rtl ? -1 : 1,
      ArrowLeft: rtl ? 1 : -1,
      ArrowUp: 1,
      ArrowDown: -1,
    }
    let next: number | null = null
    if (event.key in moves) {
      next = this.value + moves[event.key]
    } else if (event.key === 'Home') {
      next = 1
    } else if (event.key === 'End') {
      next = this.#max()
    } else if (event.key === '0' || event.key === 'Delete' || event.key === 'Backspace') {
      next = 0
    } else if (/^[1-9]$/.test(event.key)) {
      next = Number(event.key)
    }
    if (next === null) {
      return
    }
    event.preventDefault()
    this.#choose(next)
    this.group.querySelector<HTMLElement>(`[data-star="${Math.max(1, this.value)}"]`)?.focus()
  }

  protected override localeChanged(): void {
    this.#render()
  }

  focus(): void {
    this.group.querySelector<HTMLElement>('[tabindex="0"]')?.focus()
  }

  override dispose(): void {
    this.#listeners.abort()
    this.group.remove()
    if (this.#native) {
      this.holder.type = this.#native.type
    } else {
      this.holder.remove()
    }
    super.dispose()
  }
}
