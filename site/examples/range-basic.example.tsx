import { useState } from 'react'
import * as Tif from 'tidyinputfields'
import { TifField } from 'tidyinputfields/react'

export const tag = `
<div class="bd-stack">
  <tif-range name="volume" value="40"></tif-range>
  <tif-range name="discount" min="0" max="50" step="5" value="15" unit="%" ticks></tif-range>
  <tif-range name="duration" min="1" max="24" value="12" id="duration" ticks></tif-range>
</div>
`

export const attributes = `
<div class="bd-stack">
  <input type="range" name="volume" value="40" data-tif="range">
  <input type="range" name="discount" min="0" max="50" step="5" value="15" data-tif="range" data-tif-unit="%" data-tif-ticks>
  <input type="range" name="duration" min="1" max="24" value="12" data-tif="range" data-tif-ticks id="duration">
</div>
`

export const apiHtml = `
<div class="bd-stack">
  <div id="duration"></div>
</div>
`

// @tag
export function tagScript(root: HTMLElement) {
  // A unit that agrees with the number is a function: set it in JavaScript.
  Tif.TifRange.getInstance(root.querySelector('#duration'))!.setOptions({ unit: (n: number | null) => (n === 1 ? 'month' : 'months') })
}

// @attributes
export function attributesScript(root: HTMLElement) {
  Tif.TifRange.getInstance(root.querySelector('#duration'))!.setOptions({ unit: (n: number | null) => (n === 1 ? 'month' : 'months') })
}

// @api
export function api(root: HTMLElement) {
  const duration = new Tif.TifRange(root.querySelector<HTMLElement>('#duration')!, {
    name: 'duration',
    min: 1,
    max: 24,
    value: '12',
    ticks: true,
    unit: (n: number | null) => (n === 1 ? 'month' : 'months'),
  })
  duration.control.addEventListener('change', () => console.log(duration.number))
}

// @react
export function ReactExample() {
  const [discount, setDiscount] = useState('15')
  return (
    <div className="bd-stack">
      <TifField component="range" name="discount" min="0" max="50" step="5" unit="%" ticks value={discount} onChange={(v) => setDiscount(String(v))} />
      <output>discount = {discount}</output>
    </div>
  )
}
