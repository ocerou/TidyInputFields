import { useState } from 'react'
import * as Tif from 'tidyinputfields'
import { TifField } from 'tidyinputfields/react'

export const tag = `
<div class="bd-stack">
  <tif-rating name="quality" value="3"></tif-rating>
  <tif-rating name="effort" max="10" label="Effort" style="--tif-rating-color: var(--tif-accent, #0e7c86)"></tif-rating>
  <tif-rating value="3.5" readonly></tif-rating>
</div>
`

export const attributes = `
<div class="bd-stack">
  <input name="quality" value="3" data-tif="rating">
  <input name="effort" data-tif="rating" data-tif-max="10" data-tif-label="Effort" style="--tif-rating-color: var(--tif-accent, #0e7c86)">
  <input value="3.5" data-tif="rating" data-tif-readonly>
</div>
`

export const apiHtml = `
<div class="bd-stack">
  <div id="quality"></div>
  <output></output>
</div>
`

// @api
export function api(root: HTMLElement) {
  const host = root.querySelector<HTMLElement>('#quality')!
  const quality = new Tif.TifRating(host, { name: 'quality', value: 3, label: 'Quality' })
  host.addEventListener('change', () => (root.querySelector('output')!.textContent = `quality = ${quality.value}`))
}

// @react
export function ReactExample() {
  const [quality, setQuality] = useState(3)
  return (
    <div className="bd-stack">
      <TifField component="rating" name="quality" value={quality} onChange={(v) => setQuality(Number(v))} />
      <output>quality = {quality}</output>
    </div>
  )
}
