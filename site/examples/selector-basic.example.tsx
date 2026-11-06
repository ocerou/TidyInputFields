import { useState } from 'react'
import * as Tif from 'tidyinputfields'
import { TifField } from './tif-react.tsx'

export const tag = `
<tif-selector name="mode" label="Update mode" value="keep">
  <option value="keep">Keep</option>
  <option value="update">Update</option>
  <option value="ask">Ask each time</option>
</tif-selector>
`

export const attributes = `
<select name="mode" data-tif="selector" data-tif-label="Update mode">
  <option value="keep" selected>Keep</option>
  <option value="update">Update</option>
  <option value="ask">Ask each time</option>
</select>
`

export const apiHtml = `
<div class="bd-stack">
  <div id="mode"></div>
  <output id="chosen"></output>
</div>
`

// @api
export function api(root: HTMLElement) {
  const host = root.querySelector<HTMLElement>('#mode')!
  const mode = new Tif.TifSelector(host, {
    name: 'mode',
    label: 'Update mode',
    value: 'keep',
    options: [
      { value: 'keep', label: 'Keep' },
      { value: 'update', label: 'Update', title: 'Overwrite with the new values' },
      { value: 'ask', label: 'Ask each time', icon: 'warning' },
    ],
  })
  host.addEventListener('change', () => (root.querySelector('#chosen')!.textContent = `mode = ${mode.value}`))
}

// @react
export function ReactExample() {
  const [mode, setMode] = useState('keep')
  return (
    <div className="bd-stack">
      <TifField
        component="selector"
        name="mode"
        label="Update mode"
        value={mode}
        onChange={(v) => setMode(String(v))}
        options={{
          options: [
            { value: 'keep', label: 'Keep' },
            { value: 'update', label: 'Update' },
            { value: 'ask', label: 'Ask each time' },
          ],
        }}
      />
      <output>mode = {mode}</output>
    </div>
  )
}
