import { useState } from 'react'
import * as Tif from 'tidyinputfields'
import { TifField } from './tif-react.tsx'

export const html = `
<div class="bd-stack">
  <tif-period name="signed" field="Signature" all-label="All signatures" id="signed"></tif-period>
  <tif-period name="window" all-label="Any time" relative-only></tif-period>
  <output id="range">No date limit</output>
</div>
`

// @js
export function js(root: HTMLElement) {
  const signed = root.querySelector('#signed')!
  signed.addEventListener('change', () => {
    const period = Tif.TifPeriod.getInstance(signed)!
    // value: the period itself (relative periods follow the calendar); range: its bounds today.
    root.querySelector('#range')!.textContent = JSON.stringify({ value: period.value, range: period.range })
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
