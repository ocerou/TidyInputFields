import * as Tif from 'tidyinputfields'
import { owners } from './data.ts'
import { TifField } from './tif-react.tsx'

export const html = `
<div id="owners"></div>
`

// @js
export function js(root: HTMLElement) {
  new Tif.TifMultiSelect(root.querySelector<HTMLElement>('#owners')!, {
    name: 'owners',
    label: 'All owners',
    unit: 'owners',
    searchThreshold: 0,
    options: [
      // A shortcut has no box: it replaces the selection with its values.
      { value: 'mine', label: 'Mine', selects: ['ada'] },
      { value: 'my-teams', label: 'My teams', selects: ['sales', 'support'] },
      ...owners,
    ],
  })
}

// @react
export function ReactExample() {
  return (
    <TifField
      component="multi-select"
      name="owners"
      label="All owners"
      unit="owners"
      options={{ searchThreshold: 0, options: [{ value: 'mine', label: 'Mine', selects: ['ada'] }, ...owners] }}
    />
  )
}
