import { TifField } from './tif-react.tsx'
import * as Tif from 'tidyinputfields'

export const html = `
<div id="duration"></div>
<button type="button" class="tif-btn" id="plus">+ 1</button>
`

// @js
export function js(root: HTMLElement) {
  const unit = new Tif.TifUnit(root.querySelector<HTMLElement>('#duration')!, {
    name: 'duration',
    value: '1',
    // The unit agrees with the number.
    unit: (n: number | null) => (n === 1 ? 'month' : 'months'),
  })
  root.querySelector('#plus')!.addEventListener('click', () => {
    unit.value = String(Number(unit.value) + 1)
  })
  // Found again later from its element:
  console.assert(Tif.TifUnit.getInstance('#duration') === unit)
}

// @react
export function ReactExample() {
  return <TifField component="unit" name="duration" value="1" options={{ unit: (n: number | null) => (n === 1 ? 'month' : 'months') }} />
}
