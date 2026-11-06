// Curseur (nouveau composant) : le curseur natif (<input type="range">), habillé aux couleurs de la librairie, la
// partie remplie en couleur primaire, et sa valeur affichée à côté, avec son unité (texte, ou fonction du nombre pour
// l'accorder). `ticks` affiche les bornes sous le curseur. Le champ natif porte la valeur : le formulaire l'envoie,
// et le clavier du navigateur (flèches, Page précédente / suivante, Origine, Fin) reste celui de tout curseur.
import type { Options } from '../core/component.ts'
import { h } from '../core/dom.ts'
import { getLocale } from '../i18n/i18n.ts'
import { unitLabel, type Unit } from '../utils/unit.ts'
import { FIELD_DEFAULTS, NativeField, toggleAttribute } from './field.ts'

export class TifRange extends NativeField<HTMLInputElement> {
  static override NAME = 'range'
  static override DEFAULTS: Options = {
    ...FIELD_DEFAULTS,
    min: 0,
    max: 100,
    step: 1,
    /** Unité affichée après la valeur : un texte, ou une fonction du nombre (JavaScript seulement). */
    unit: '' as Unit,
    /** Affiche les bornes sous le curseur. */
    ticks: false,
    /** Affiche la valeur à côté du curseur. */
    showValue: true,
  }

  // Posés pendant le constructeur de la classe de base (voir field.ts) : champs `declare`, méthodes ordinaires.
  declare frame: HTMLSpanElement | undefined
  declare output: HTMLOutputElement | undefined
  declare bounds: HTMLSpanElement | undefined
  declare listeners: AbortController | undefined

  constructor(element: HTMLElement, options: Options = {}) {
    super(element, options)
    const control = this.control
    control.type = 'range'
    this.output = h('output', { class: 'tif-range-value tif-mono', 'aria-hidden': 'true' })
    this.bounds = h('span', { class: 'tif-range-bounds', 'aria-hidden': 'true' })
    this.frame = h('span', { class: 'tif tif-range' })
    control.before(this.frame)
    this.frame.append(h('span', { class: 'tif-range-track' }, control, this.bounds), this.output)
    const listeners = new AbortController()
    this.listeners = listeners
    control.addEventListener('input', () => this.refresh(), { signal: listeners.signal })
    this.applyOptions(['min', 'max', 'step', 'quiet'])
    this.refresh()
  }

  protected override classes(): string[] {
    return ['tif-range-input']
  }

  protected override prepare(control: HTMLInputElement): void {
    control.type = 'range'
  }

  protected override quietTarget(): HTMLElement {
    return this.frame ?? this.control
  }

  protected override applyOption(key: string, value: unknown): boolean {
    switch (key) {
      case 'min':
      case 'max':
      case 'step':
        toggleAttribute(this.control, key, value === '' || value == null ? null : String(value))
        this.refresh()
        return true
      case 'unit':
      case 'ticks':
      case 'showValue':
        this.refresh()
        return true
      case 'placeholder':
      case 'readonly':
        return true
      case 'quiet':
        if (!this.frame) {
          return true
        }
        return super.applyOption(key, value)
      case 'value':
        super.applyOption(key, value)
        this.refresh()
        return true
      default:
        return super.applyOption(key, value)
    }
  }

  /** Valeur en nombre. */
  get number(): number {
    return Number(this.control.value)
  }

  override get value(): unknown {
    return this.control.value
  }

  override set value(value: unknown) {
    this.control.value = String(value ?? '')
    this.refresh()
  }

  /** Texte d'une valeur : le nombre dans la langue, suivi de l'unité. */
  protected label(value: number): string {
    const unit = unitLabel((this.options.unit as Unit) ?? '', value)
    const number = new Intl.NumberFormat(getLocale()).format(value)
    return unit ? `${number} ${unit}` : number
  }

  /** Partie remplie, valeur affichée et bornes. */
  protected refresh(): void {
    if (!this.frame || !this.output || !this.bounds) {
      return
    }
    const control = this.control
    const min = Number(control.min || 0)
    const max = Number(control.max || 100)
    const value = Number(control.value)
    const fill = max > min ? ((value - min) / (max - min)) * 100 : 0
    this.frame.style.setProperty('--tif-range-fill', `${fill}%`)
    const text = this.label(value)
    this.output.textContent = text
    this.output.hidden = !this.options.showValue
    control.setAttribute('aria-valuetext', text)
    this.bounds.hidden = !this.options.ticks
    this.bounds.replaceChildren(h('span', {}, this.label(min)), h('span', {}, this.label(max)))
  }

  protected override localeChanged(): void {
    this.refresh()
  }

  override dispose(): void {
    this.listeners?.abort()
    this.control.removeAttribute('aria-valuetext')
    if (this.created) {
      this.frame?.remove()
    } else if (this.frame) {
      this.frame.replaceWith(this.control)
    }
    super.dispose()
  }
}
