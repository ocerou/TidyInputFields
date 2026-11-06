import { useState } from 'react'
import * as Tif from 'tidyinputfields'
import { TifField } from 'tidyinputfields/react'

export const tag = `
<div class="bd-stack">
  <label class="bd-row"><tif-switch name="active" checked></tif-switch> Active</label>
  <label class="bd-row"><tif-switch name="archived" disabled></tif-switch> Archived (disabled)</label>
</div>
`

export const attributes = `
<div class="bd-stack">
  <label class="bd-row"><input type="checkbox" name="active" checked data-tif="switch"> Active</label>
  <label class="bd-row"><input type="checkbox" name="archived" disabled data-tif="switch"> Archived (disabled)</label>
</div>
`

export const apiHtml = `
<div class="bd-stack">
  <label class="bd-row"><span id="active"></span> Active</label>
  <button type="button" class="tif-btn" id="toggle">Toggle</button>
</div>
`

// @api
export function api(root: HTMLElement) {
  const active = new Tif.TifSwitch(root.querySelector<HTMLElement>('#active')!, { name: 'active', checked: true })
  // The value is the checked state; toggle() switches it as a click would (input and change are sent).
  root.querySelector('#toggle')!.addEventListener('click', () => active.toggle())
}

// @react
export function ReactExample() {
  const [active, setActive] = useState(true)
  return (
    <div className="bd-stack">
      <label className="bd-row">
        <TifField component="switch" name="active" value={active} onChange={(v) => setActive(v === true)} /> Active: {String(active)}
      </label>
      <label className="bd-row">
        <TifField component="switch" name="archived" disabled /> Archived (disabled)
      </label>
    </div>
  )
}
