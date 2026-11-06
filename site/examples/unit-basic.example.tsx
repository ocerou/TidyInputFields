import * as Tif from 'tidyinputfields'
import { TifField } from 'tidyinputfields/react'

export const tag = `
<div class="bd-stack">
  <tif-unit name="duration" unit="months" value="12" id="duration"></tif-unit>
  <tif-unit name="price" unit="€" value="1250" align="right" style="width: 160px"></tif-unit>
</div>
`

export const attributes = `
<div class="bd-stack">
  <input name="duration" value="12" data-tif="unit" data-tif-unit="months" id="duration">
  <input name="price" value="1250" data-tif="unit" data-tif-unit="€" data-tif-align="right" style="width: 160px">
</div>
`

export const apiHtml = `
<div class="bd-stack">
  <div id="duration"></div>
  <div id="price" style="width: 160px"></div>
  <span id="read-only"></span>
</div>
`

// @tag
export function tagScript(root: HTMLElement) {
  // An attribute is text: a unit that agrees with the number is a function, set in JavaScript.
  Tif.TifUnit.getInstance(root.querySelector('#duration'))!.setOptions({ unit: (n: number | null) => (n === 1 ? 'month' : 'months') })
}

// @attributes
export function attributesScript(root: HTMLElement) {
  Tif.TifUnit.getInstance(root.querySelector('#duration'))!.setOptions({ unit: (n: number | null) => (n === 1 ? 'month' : 'months') })
}

// @api
export function api(root: HTMLElement) {
  // The unit follows the digits and agrees with the number: type 1, then 12.
  new Tif.TifUnit(root.querySelector<HTMLElement>('#duration')!, {
    name: 'duration',
    value: '12',
    unit: (n: number | null) => (n === 1 ? 'month' : 'months'),
  })
  new Tif.TifUnit(root.querySelector<HTMLElement>('#price')!, { name: 'price', value: '1250', unit: '€', align: 'right' })
  // Read-only: the same rendering, without a field.
  root.querySelector('#read-only')!.append(Tif.unitValue(3, (n) => (n === 1 ? 'day' : 'days')))
}

// @react
export function ReactExample() {
  const months = (n: number | null) => (n === 1 ? 'month' : 'months')
  return (
    <div className="bd-stack">
      <TifField component="unit" name="duration" value="12" options={{ unit: months }} />
      <TifField component="unit" name="price" unit="€" value="1250" align="right" style={{ width: 160 }} />
    </div>
  )
}
