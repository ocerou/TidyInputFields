// Zone de texte d'une ligne (texte, e-mail, recherche, adresse, téléphone, secret) : un champ natif habillé.
import type { Options } from '../core/component.ts'
import { FIELD_DEFAULTS, NativeField } from './field.ts'

export type TextType = 'text' | 'email' | 'search' | 'url' | 'tel' | 'password'

export class TifText extends NativeField<HTMLInputElement> {
  static override NAME = 'text'
  static override DEFAULTS: Options = { ...FIELD_DEFAULTS, type: 'text' as TextType, autocomplete: '', maxlength: 0 }

  protected override prepare(control: HTMLInputElement): void {
    control.type = String(this.options.type || 'text')
  }

  protected override applyOption(key: string, value: unknown): boolean {
    switch (key) {
      case 'type':
        this.control.type = String(value || 'text')
        return true
      case 'autocomplete':
        if (value) {
          this.control.autocomplete = String(value) as AutoFill
        } else {
          this.control.removeAttribute('autocomplete')
        }
        return true
      case 'maxlength':
        if (Number(value) > 0) {
          this.control.maxLength = Number(value)
        } else {
          this.control.removeAttribute('maxlength')
        }
        return true
      default:
        return super.applyOption(key, value)
    }
  }
}
