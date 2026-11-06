// Composants de la librairie, enregistrés à l'import : data-tif="…", balises <tif-…> et plugins jQuery.
import { register } from '../core/registry.ts'
import { TifColorPicker } from './color-picker.ts'
import { TifDate } from './date.ts'
import { TifDateTime } from './date-time.ts'
import { TifLookup } from './lookup.ts'
import { TifMultiSelect } from './multi-select.ts'
import { TifNumber } from './number.ts'
import { TifPeriod } from './period.ts'
import { TifSearchSelect } from './search-select.ts'
import { TifSelect } from './select.ts'
import { TifSelector } from './selector.ts'
import { TifSortableList } from './sortable-list.ts'
import { TifSwitch } from './switch.ts'
import { TifTags } from './tags.ts'
import { TifText } from './text.ts'
import { TifTextarea } from './textarea.ts'
import { TifTime } from './time.ts'
import { TifUnit } from './unit.ts'

export { NativeField, FIELD_DEFAULTS } from './field.ts'
export { TifText, type TextType } from './text.ts'
export { TifNumber } from './number.ts'
export { TifTextarea } from './textarea.ts'
export { TifSelect, type SelectOption } from './select.ts'
export { TifSwitch } from './switch.ts'
export { TifUnit, unitValue } from './unit.ts'
export { TifSelector, type SelectorOption } from './selector.ts'
export { TextPicker, PICKER_DEFAULTS } from './picker.ts'
export { TifDate } from './date.ts'
export { TifTime } from './time.ts'
export { TifDateTime } from './date-time.ts'
export { TifPeriod, periodLabel, periodUnitName, toPeriod } from './period.ts'
export { ListSelect, type ListOption } from './list.ts'
export { TifSearchSelect, type ListSource } from './search-select.ts'
export { TifMultiSelect } from './multi-select.ts'
export { TifLookup, type LookupSource } from './lookup.ts'
export { TifSortableList, type SortableItem } from './sortable-list.ts'
export { TifColorPicker, colorSample, colorValue } from './color-picker.ts'
export { TifTags } from './tags.ts'
export { parseColor, splitColor, composeColor, type Color } from '../utils/color.ts'
export type { Unit } from '../utils/unit.ts'
export type { DatePeriod, PeriodUnit } from '../utils/period.ts'
export { periodRange } from '../utils/period.ts'

for (const type of [
  TifText,
  TifNumber,
  TifTextarea,
  TifSelect,
  TifSwitch,
  TifUnit,
  TifSelector,
  TifDate,
  TifTime,
  TifDateTime,
  TifPeriod,
  TifSearchSelect,
  TifMultiSelect,
  TifLookup,
  TifSortableList,
  TifColorPicker,
  TifTags,
]) {
  register(type)
}
