// Zone numérique : chiffres alignés (police à chasse fixe), bornes et pas par min, max et step.
import type { Options } from '../core/component.ts'
import { FIELD_DEFAULTS, NativeField, toggleAttribute } from './field.ts'

export class TifNumber extends NativeField<HTMLInputElement> {
  static override NAME = 'number'
  static override DEFAULTS: Options = { ...FIELD_DEFAULTS, min: '', max: '', step: '' }

  protected override classes(): string[] {
    return ['tif-input', 'tif-mono']
  }

  protected override prepare(control: HTMLInputElement): void {
    control.type = 'number'
  }

  protected override applyOption(key: string, value: unknown): boolean {
    if (key === 'min' || key === 'max' || key === 'step') {
      toggleAttribute(this.control, key, value === '' || value == null ? null : String(value))
      return true
    }
    return super.applyOption(key, value)
  }

  /** Valeur en nombre, null si la zone est vide ou illisible. */
  get number(): number | null {
    const n = this.control.valueAsNumber
    return Number.isNaN(n) ? null : n
  }
}
