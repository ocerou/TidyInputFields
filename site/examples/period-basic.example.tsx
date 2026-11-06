import { useState } from 'react'
import * as Tif from 'tidyinputfields'
import { TifField } from 'tidyinputfields/react'

export const tag = `
<div class="bd-stack">
  <tif-period name="signed" field="Signature" all-label="All signatures"></tif-period>
  <tif-period name="window" all-label="Any time" relative-only
              value='{"operator":"period","unit":"quarter","from":0,"to":0}'></tif-period>
</div>
`

export const attributes = `
<div class="bd-stack">
  <input type="hidden" name="signed" data-tif="period" data-tif-field="Signature" data-tif-all-label="All signatures">
  <input type="hidden" name="window" data-tif="period" data-tif-all-label="Any time" data-tif-relative-only
         value='{"operator":"period","unit":"quarter","from":0,"to":0}'>
</div>
`

export const apiHtml = `
<div class="bd-stack">
  <div id="signed"></div>
  <output>No date limit</output>
</div>
`

// @api
export function api(root: HTMLElement) {
  const host = root.querySelector<HTMLElement>('#signed')!
  const signed = new Tif.TifPeriod(host, {
    name: 'signed',
    field: 'Signature',
    allLabel: 'All signatures',
    value: { operator: 'period', unit: 'month', from: 0, to: 0 },
  })
  // value: the period itself (relative periods follow the calendar); range: its bounds today.
  host.addEventListener('change', () => {
    root.querySelector('output')!.textContent = JSON.stringify({ value: signed.value, range: signed.range })
  })
}

// @react
export function ReactExample() {
  const [period, setPeriod] = useState<Tif.DatePeriod | null>(null)
  return (
    <div className="bd-stack">
      <TifField component="period" name="signed" field="Signature" all-label="All signatures" onChange={(v) => setPeriod(v as Tif.DatePeriod | null)} />
      <output>{period ? JSON.stringify(Tif.periodRange(period)) : 'No date limit'}</output>
    </div>
  )
}
