// Interrupteur oui / non : une case à cocher native affichée en bascule (role="switch"). La valeur du composant est
// l'état coché (booléen) ; l'option `value` reste la valeur envoyée par le formulaire quand c'est coché.
import type { Options } from '../core/component.ts'
import { FIELD_DEFAULTS, NativeField } from './field.ts'

export class TifSwitch extends NativeField<HTMLInputElement> {
  static override NAME = 'switch'
  static override DEFAULTS: Options = { ...FIELD_DEFAULTS, value: 'on', checked: false }

  protected override classes(): string[] {
    return ['tif-switch']
  }

  protected override prepare(control: HTMLInputElement): void {
    control.type = 'checkbox'
  }

  constructor(element: HTMLElement, options: Options = {}) {
    super(element, options)
    // Un interrupteur n'a de sens que sur une case à cocher, même posé sur un <input> sans type.
    this.control.type = 'checkbox'
    this.control.setAttribute('role', 'switch')
  }

  protected override applyOption(key: string, value: unknown): boolean {
    if (key === 'checked') {
      this.control.checked = Boolean(value)
      return true
    }
    if (key === 'placeholder') {
      return true
    }
    return super.applyOption(key, value)
  }

  override get value(): unknown {
    return this.control.checked
  }

  override set value(value: unknown) {
    this.control.checked = value === true || value === 'true' || value === 'on' || value === 1
  }

  /** Coche ou décoche (inverse sans argument), comme un clic : émet input et change. */
  toggle(force?: boolean): void {
    const next = force ?? !this.control.checked
    if (next !== this.control.checked) {
      this.control.click()
    }
  }

  override dispose(): void {
    if (!this.created) {
      this.control.removeAttribute('role')
    }
    super.dispose()
  }
}
