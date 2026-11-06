// Liste déroulante native, pour les listes courtes. Ses choix viennent des <option> écrites dans la balise
// (<tif-select><option>…</option></tif-select>), du <select> habillé, ou de l'option `options` (tableau).
import type { Options } from '../core/component.ts'
import { h } from '../core/dom.ts'
import { FIELD_DEFAULTS, NativeField } from './field.ts'

/** Un choix ; avec `group`, les choix sont rangés sous des intitulés (optgroup). */
export type SelectOption = { value: string; label: string; group?: string; disabled?: boolean }

export class TifSelect extends NativeField<HTMLSelectElement> {
  static override NAME = 'select'
  static override CONTROL = 'select' as const
  static override DEFAULTS: Options = { ...FIELD_DEFAULTS, options: null as SelectOption[] | null }

  protected override classes(): string[] {
    return ['tif-input', 'tif-select']
  }

  protected override prepare(control: HTMLSelectElement): void {
    // Les <option> écrites dans la balise passent dans la liste créée.
    // Copie : déplacer un enfant modifie la collection vivante qu'on parcourt.
    for (const child of Array.from(this.element.children)) {
      if (child instanceof HTMLOptionElement || child instanceof HTMLOptGroupElement) {
        control.append(child)
      }
    }
  }

  protected override applyOption(key: string, value: unknown): boolean {
    switch (key) {
      case 'options':
        if (Array.isArray(value)) {
          this.fill(value as SelectOption[])
        }
        return true
      case 'placeholder':
        this.setPlaceholder(String(value ?? ''))
        return true
      default:
        return super.applyOption(key, value)
    }
  }

  protected fill(options: SelectOption[]): void {
    const kept = this.control.value
    const groups = new Map<string, HTMLOptGroupElement>()
    const nodes: (HTMLOptionElement | HTMLOptGroupElement)[] = []
    for (const o of options) {
      const option = h('option', { value: o.value, disabled: o.disabled }, o.label)
      if (o.group) {
        let group = groups.get(o.group)
        if (!group) {
          group = h('optgroup', { label: o.group })
          groups.set(o.group, group)
          nodes.push(group)
        }
        group.append(option)
      } else {
        nodes.push(option)
      }
    }
    const placeholder = this.control.querySelector(':scope > option[data-tif-placeholder]')
    this.control.replaceChildren(...(placeholder ? [placeholder] : []), ...nodes)
    this.control.value = kept
  }

  /** Choix vide en tête, affiché tant que rien n'est choisi, non proposé dans la liste. */
  protected setPlaceholder(text: string): void {
    const existing = this.control.querySelector<HTMLOptionElement>(':scope > option[data-tif-placeholder]')
    if (!text) {
      existing?.remove()
      return
    }
    const option = existing ?? h('option', { value: '', 'data-tif-placeholder': true, disabled: true, hidden: true })
    option.textContent = text
    if (!existing) {
      const hadValue = this.control.selectedIndex > 0 || this.control.value !== ''
      this.control.prepend(option)
      if (!hadValue) {
        this.control.value = ''
      }
    }
  }

  override dispose(): void {
    if (!this.created) {
      this.control.querySelector(':scope > option[data-tif-placeholder]')?.remove()
    }
    super.dispose()
  }
}
