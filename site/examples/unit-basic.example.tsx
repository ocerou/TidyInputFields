import { TifField } from './tif-react.tsx'
import * as Tif from 'tidyinputfields'

export const html = `
<div class="bd-stack">
  <div id="duration"></div>
  <tif-unit name="price" unit="€" value="1250" align="right" style="width: 160px"></tif-unit>
  <span id="read-only"></span>
</div>
`

// @js
export function js(root: HTMLElement) {
  // The unit follows the digits and agrees with the number: type 1, then 12.
  const months = (n: number | null) => (n === 1 ? 'month' : 'months')
  new Tif.TifUnit(root.querySelector<HTMLElement>('#duration')!, { name: 'duration', value: '1', unit: months })
  // Read-only: the same rendering, without a field.
  root.querySelector('#read-only')!.append(Tif.unitValue(3, (n) => (n === 1 ? 'day' : 'days')))
}

// @react
export function ReactExample() {
  const months = (n: number | null) => (n === 1 ? 'month' : 'months')
  return (
    <div className="bd-stack">
      <TifField component="unit" name="duration" value="1" options={{ unit: months }} />
      <TifField component="unit" name="price" unit="€" value="1250" align="right" style={{ width: 160 }} />
    </div>
  )
}
