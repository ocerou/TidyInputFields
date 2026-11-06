// Sélecteur (repris de MyCRM, InputSelector) : un choix obligatoire parmi quelques options affichées côte à côte,
// comme des boutons radio. Toutes les options ont la largeur du plus long libellé ; l'option choisie prend la couleur
// primaire ; les flèches du clavier passent d'une option à l'autre.
//
// La valeur vit dans un <select> : celui qu'on habille (<select data-tif="selector">, masqué), ou un <select> caché
// créé dans le conteneur, avec les <option> écrites dans la balise ou l'option `options`. Le formulaire l'envoie.
import { Component, type Options } from '../core/component.ts'
import { h } from '../core/dom.ts'
import { icon, type IconName } from '../core/icons.ts'
import { dispatchChange } from './field.ts'

/** Une option ; `icon` : petite icône après le libellé (un état de l'option). */
export type SelectorOption = { value: string; label: string; title?: string; icon?: IconName }

export class TifSelector extends Component {
  static override NAME = 'selector'
  static override DEFAULTS: Options = {
    options: [] as SelectorOption[],
    value: '',
    name: '',
    disabled: false,
    /** Nom lu par les lecteurs d'écran, quand aucune étiquette visible n'est liée. */
    label: '',
  }

  /** Le <select> qui porte la valeur. */
  readonly select: HTMLSelectElement
  /** Le groupe de boutons affiché. */
  readonly group: HTMLDivElement
  readonly #created: boolean
  readonly #listeners = new AbortController()

  constructor(element: HTMLElement, options: Options = {}) {
    super(element, options)
    const native = element instanceof HTMLSelectElement ? element : null
    this.#created = !native
    this.select = native ?? h('select', { hidden: true, class: 'tif-selector-value', tabindex: '-1', 'aria-hidden': 'true' })
    if (!native) {
      // Copie : déplacer un enfant modifie la collection vivante qu'on parcourt.
      for (const child of Array.from(element.children)) {
        if (child instanceof HTMLOptionElement) {
          this.select.append(child)
        }
      }
      element.append(this.select)
    } else {
      native.hidden = true
    }
    this.group = h('div', { class: 'tif tif-selector', role: 'radiogroup' })
    this.select.after(this.group)
    this.group.addEventListener('keydown', (event) => this.#keydown(event), { signal: this.#listeners.signal })
    this.group.addEventListener(
      'click',
      (event) => {
        const button = (event.target as Element).closest<HTMLButtonElement>('button[role="radio"]')
        if (button && !button.disabled) {
          this.#choose(button.value, true)
        }
      },
      { signal: this.#listeners.signal },
    )
    // Une valeur changée sur le <select> lui-même (par l'application) se reflète dans les boutons.
    this.select.addEventListener('change', () => this.#render(), { signal: this.#listeners.signal })
    this.#apply(Object.keys(this.options))
  }

  /** Les options affichées : celles de l'option `options`, sinon celles du <select>. */
  get choices(): SelectorOption[] {
    const given = this.options.options as SelectorOption[] | undefined
    if (given?.length) {
      return given
    }
    return [...this.select.options].map((o) => ({ value: o.value, label: o.label || o.textContent || o.value, title: o.title || undefined }))
  }

  override get value(): string {
    return this.select.value
  }

  override set value(value: unknown) {
    this.#choose(String(value ?? ''), false)
  }

  protected override optionsChanged(keys: string[]): void {
    this.#apply(keys)
  }

  #apply(keys: string[]): void {
    const o = this.options
    if (keys.includes('options') && (o.options as SelectorOption[] | undefined)?.length) {
      const kept = this.select.value || String(o.value ?? '')
      this.select.replaceChildren(...(o.options as SelectorOption[]).map((c) => h('option', { value: c.value }, c.label)))
      this.select.value = kept
    }
    if (keys.includes('name') && o.name) {
      this.select.name = String(o.name)
    }
    if (keys.includes('value') && o.value !== '' && o.value != null) {
      this.select.value = String(o.value)
    }
    if (keys.includes('disabled')) {
      this.select.disabled = Boolean(o.disabled)
    }
    if (keys.includes('label')) {
      if (o.label) {
        this.group.setAttribute('aria-label', String(o.label))
      } else {
        this.group.removeAttribute('aria-label')
      }
    }
    this.#render()
  }

  #render(): void {
    const value = this.select.value
    const choices = this.choices
    const disabled = this.select.disabled
    const focusable = choices.some((c) => c.value === value) ? value : choices[0]?.value
    this.group.toggleAttribute('aria-disabled', disabled)
    this.group.replaceChildren(
      ...choices.map((c) =>
        h(
          'button',
          {
            type: 'button',
            role: 'radio',
            value: c.value,
            'aria-checked': String(c.value === value),
            tabindex: c.value === focusable ? '0' : '-1',
            title: c.title,
            disabled,
          },
          c.label,
          c.icon && icon(c.icon),
        ),
      ),
    )
  }

  #choose(value: string, byUser: boolean): void {
    if (!this.choices.some((c) => c.value === value) || value === this.select.value) {
      return
    }
    this.select.value = value
    this.#render()
    if (byUser) {
      dispatchChange(this.select)
    }
  }

  #keydown(event: KeyboardEvent): void {
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0
    if (!step || this.select.disabled) {
      return
    }
    event.preventDefault()
    const choices = this.choices
    // De droite à gauche, les flèches gauche et droite s'inversent.
    const rtl = getComputedStyle(this.group).direction === 'rtl' && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')
    const index = Math.max(0, choices.findIndex((c) => c.value === this.select.value))
    const next = (index + (rtl ? -step : step) + choices.length) % choices.length
    this.#choose(choices[next].value, true)
    this.group.querySelectorAll<HTMLButtonElement>('button[role="radio"]')[next]?.focus()
  }

  /** Donne le focus à l'option choisie. */
  focus(): void {
    this.group.querySelector<HTMLButtonElement>('button[tabindex="0"]')?.focus()
  }

  override dispose(): void {
    this.#listeners.abort()
    this.group.remove()
    if (this.#created) {
      this.select.remove()
    } else {
      this.select.hidden = false
    }
    super.dispose()
  }
}
