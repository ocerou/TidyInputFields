// Zone de nombre avec unité (repris de MyCRM, InputUnit) : l'unité, en gris, suit immédiatement le chiffre saisi et se
// décale avec lui (« 12 mois ») ; elle s'accorde au nombre si `unit` est une fonction. `align` : `left` (par défaut,
// liste de paramètres) ou `right` (tableau : le groupe chiffre + unité est calé à droite de la zone).
import type { Options } from '../core/component.ts'
import { h } from '../core/dom.ts'
import { unitLabel, type Unit } from '../utils/unit.ts'
import { FIELD_DEFAULTS, NativeField } from './field.ts'

export class TifUnit extends NativeField<HTMLInputElement> {
  static override NAME = 'unit'
  static override DEFAULTS: Options = { ...FIELD_DEFAULTS, unit: '' as Unit, align: 'left' as 'left' | 'right' }

  // Champs déclarés sans initialisation : ils sont posés pendant le constructeur de la classe de base.
  declare zone: HTMLSpanElement | undefined
  declare unitElement: HTMLSpanElement | undefined
  declare listeners: AbortController | undefined

  constructor(element: HTMLElement, options: Options = {}) {
    super(element, options)
    const control = this.control
    control.type = 'text'
    control.inputMode = control.inputMode || 'decimal'
    control.autocomplete = 'off'
    this.unitElement = h('span', { class: 'tif-unit-label' })
    this.zone = h('span', { class: 'tif tif-field tif-unit' })
    control.before(this.zone)
    this.zone.append(control, this.unitElement)
    const listeners = new AbortController()
    this.listeners = listeners
    control.addEventListener('input', () => this.refresh(), { signal: listeners.signal })
    // Un clic dans la zone, hors du chiffre (sur l'unité, la marge), place le curseur dans le chiffre.
    this.zone.addEventListener(
      'mousedown',
      (event) => {
        if (event.target !== control) {
          event.preventDefault()
          control.focus()
        }
      },
      { signal: listeners.signal },
    )
    this.applyOptions(['align', 'quiet'])
    this.refresh()
  }

  protected override classes(): string[] {
    return ['tif-unit-input', 'tif-mono']
  }

  protected override quietTarget(): HTMLElement {
    return this.zone ?? this.control
  }

  protected override applyOption(key: string, value: unknown): boolean {
    switch (key) {
      case 'unit':
        this.refresh()
        return true
      case 'align':
        this.zone?.classList.toggle('tif-unit-end', value === 'right' || value === 'end')
        return true
      case 'quiet':
        if (!this.zone) {
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

  override set value(value: unknown) {
    this.control.value = value == null ? '' : String(value)
    this.refresh()
  }

  override get value(): unknown {
    return this.control.value
  }

  /** La zone s'ajuste au chiffre, l'unité le suit et s'accorde. */
  protected refresh(): void {
    if (!this.unitElement) {
      return
    }
    const text = this.control.value
    this.control.style.width = `${Math.max(1, text.length) + 0.5}ch`
    this.unitElement.textContent = unitLabel((this.options.unit as Unit) ?? '', text)
  }

  override dispose(): void {
    this.listeners?.abort()
    this.control.style.width = ''
    if (this.created) {
      this.zone?.remove()
    } else if (this.zone) {
      this.zone.replaceWith(this.control)
    }
    super.dispose()
  }
}

/** Valeur en lecture avec son unité, au même endroit que dans la zone (« 12 mois »). */
export function unitValue(value: unknown, unit: Unit, align: 'left' | 'right' = 'left'): HTMLSpanElement {
  return h(
    'span',
    { class: `tif tif-unit-value${align === 'right' ? ' tif-unit-end' : ''}` },
    h('span', { class: 'tif-mono' }, value == null ? '' : String(value)),
    h('span', { class: 'tif-unit-label' }, unitLabel(unit, value)),
  )
}
