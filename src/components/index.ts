// Composants de la librairie, enregistrés à l'import : data-tif="…", balises <tif-…> et plugins jQuery.
import { register } from '../core/registry.ts'
import { TifNumber } from './number.ts'
import { TifSelect } from './select.ts'
import { TifSelector } from './selector.ts'
import { TifSwitch } from './switch.ts'
import { TifText } from './text.ts'
import { TifTextarea } from './textarea.ts'
import { TifUnit } from './unit.ts'

export { NativeField, FIELD_DEFAULTS } from './field.ts'
export { TifText, type TextType } from './text.ts'
export { TifNumber } from './number.ts'
export { TifTextarea } from './textarea.ts'
export { TifSelect, type SelectOption } from './select.ts'
export { TifSwitch } from './switch.ts'
export { TifUnit, unitValue } from './unit.ts'
export { TifSelector, type SelectorOption } from './selector.ts'
export type { Unit } from '../utils/unit.ts'

for (const type of [TifText, TifNumber, TifTextarea, TifSelect, TifSwitch, TifUnit, TifSelector]) {
  register(type)
}
