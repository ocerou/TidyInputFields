import { useState } from 'react'
import * as Tif from 'tidyinputfields'
import { TifField } from 'tidyinputfields/react'

export const tag = `
<form class="bd-stack">
  <tif-date name="due" label="Due date"></tif-date>
  <tif-date name="start" value="2026-11-06" first-day="1"></tif-date>
</form>
`

export const attributes = `
<form class="bd-stack">
  <input type="date" name="due" data-tif="date" data-tif-label="Due date">
  <input type="date" name="start" value="2026-11-06" data-tif="date" data-tif-first-day="1">
</form>
`

export const apiHtml = `
<form class="bd-stack">
  <div id="due"></div>
  <output></output>
</form>
`

// @api
export function api(root: HTMLElement) {
  const host = root.querySelector<HTMLElement>('#due')!
  const due = new Tif.TifDate(host, { name: 'due', label: 'Due date', value: '2027-03-15' })
  // The form receives ISO dates; the field shows the format of the language.
  host.addEventListener('change', () => (root.querySelector('output')!.textContent = `due = "${due.value}"`))
}

// @react
export function ReactExample() {
  const [due, setDue] = useState('')
  return (
    <div className="bd-stack">
      <TifField component="date" name="due" label="Due date" value={due} onChange={(v) => setDue(String(v))} />
      <output>due = "{due}"</output>
    </div>
  )
}
