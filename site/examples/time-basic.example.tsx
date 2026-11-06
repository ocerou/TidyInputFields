import * as Tif from 'tidyinputfields'
import { TifField } from './tif-react.tsx'

export const tag = `
<div class="bd-row">
  <tif-time name="start" value="09:30"></tif-time>
  <tif-time name="end" minute-step="5"></tif-time>
</div>
`

export const attributes = `
<div class="bd-row">
  <input type="time" name="start" value="09:30" data-tif="time">
  <input type="time" name="end" data-tif="time" data-tif-minute-step="5">
</div>
`

export const apiHtml = `
<div class="bd-row">
  <div id="start"></div>
  <div id="end"></div>
</div>
`

// @api
export function api(root: HTMLElement) {
  new Tif.TifTime(root.querySelector<HTMLElement>('#start')!, { name: 'start', value: '09:30' })
  new Tif.TifTime(root.querySelector<HTMLElement>('#end')!, { name: 'end', minuteStep: 5 })
}

// @react
export function ReactExample() {
  return (
    <div className="bd-row">
      <TifField component="time" name="start" value="09:30" />
      <TifField component="time" name="end" minute-step="5" />
    </div>
  )
}
