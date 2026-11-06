// Zone de texte de plusieurs lignes, sans mise en forme.
import type { Options } from '../core/component.ts'
import { FIELD_DEFAULTS, NativeField } from './field.ts'

export class TifTextarea extends NativeField<HTMLTextAreaElement> {
  static override NAME = 'textarea'
  static override CONTROL = 'textarea' as const
  static override DEFAULTS: Options = { ...FIELD_DEFAULTS, rows: 3, maxlength: 0 }

  protected override classes(): string[] {
    return ['tif-input', 'tif-textarea']
  }

  protected override applyOption(key: string, value: unknown): boolean {
    switch (key) {
      case 'rows':
        this.control.rows = Math.max(1, Number(value) || 3)
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
