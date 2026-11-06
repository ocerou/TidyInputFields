import * as Tif from 'tidyinputfields'
import { owners } from './data.ts'
import { TifField } from './tif-react.tsx'

export const html = `
<div id="owner"></div>
`

// @js
export function js(root: HTMLElement) {
  new Tif.TifSearchSelect(root.querySelector<HTMLElement>('#owner')!, {
    name: 'owner',
    label: 'Owner',
    options: owners, // { value, label, group, pill, inactive }
    groupOrder: ['Teams'], // Teams first
    required: true, // orange while empty
  })
}

// @react
export function ReactExample() {
  return <TifField component="search-select" name="owner" label="Owner" required options={{ options: owners, groupOrder: ['Teams'] }} />
}
