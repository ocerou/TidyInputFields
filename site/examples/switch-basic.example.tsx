import { useState } from 'react'
import { TifField } from './tif-react.tsx'

export const html = `
<div class="bd-stack">
  <label class="bd-row"><tif-switch name="active" checked></tif-switch> Active</label>
  <label class="bd-row"><tif-switch name="newsletter"></tif-switch> Newsletter</label>
  <label class="bd-row"><input type="checkbox" name="archived" data-tif="switch" disabled> Archived (disabled)</label>
</div>
`

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
