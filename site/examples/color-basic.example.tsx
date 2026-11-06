import { useState } from 'react'
import * as Tif from 'tidyinputfields'
import { TifField } from './tif-react.tsx'

export const tag = `
<form class="bd-stack">
  <tif-color-picker name="brand" value="#062B6F" label="Brand colour"></tif-color-picker>
  <tif-color-picker name="highlight" value="#F2B70580"></tif-color-picker>
  <tif-color-picker name="background"></tif-color-picker>
</form>
`

export const attributes = `
<form class="bd-stack">
  <input type="color" name="brand" value="#062b6f" data-tif="color-picker" data-tif-label="Brand colour">
  <input name="highlight" value="#F2B70580" data-tif="color-picker">
  <input name="background" data-tif="color-picker">
</form>
`

export const apiHtml = `
<div class="bd-stack">
  <div id="brand"></div>
  <output></output>
  <span id="read-only"></span>
</div>
`

// @api
export function api(root: HTMLElement) {
  const host = root.querySelector<HTMLElement>('#brand')!
  const brand = new Tif.TifColorPicker(host, { name: 'brand', label: 'Brand colour', value: '#062B6F' })
  // "#RRGGBB" when opaque, "#RRGGBBAA" otherwise, "" without a colour.
  host.addEventListener('change', () => (root.querySelector('output')!.textContent = `brand = "${brand.value}"`))
  // Read-only: a sample and the code.
  root.querySelector('#read-only')!.append(Tif.colorValue('#0E7C86'))
}

// @react
export function ReactExample() {
  const [brand, setBrand] = useState('#062B6F')
  return (
    <div className="bd-stack">
      <TifField component="color-picker" name="brand" label="Brand colour" value={brand} onChange={(v) => setBrand(String(v))} />
      <output>brand = "{brand}"</output>
    </div>
  )
}
