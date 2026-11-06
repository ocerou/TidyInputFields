import * as Tif from 'tidyinputfields'
import { owners } from './data.ts'
import { TifField } from 'tidyinputfields/react'

export const tag = `
<tif-multi-select name="owners" label="All owners" unit="owners" search-threshold="0"
  options='[{"value":"mine","label":"Mine","selects":["ada"]},
            {"value":"teams","label":"My teams","selects":["sales","support"]},
            {"value":"ada","label":"Ada Lovelace","group":"Users"},
            {"value":"alan","label":"Alan Turing","group":"Users"},
            {"value":"sales","label":"Sales","group":"Teams"},
            {"value":"support","label":"Support","group":"Teams"}]'>
</tif-multi-select>
`

export const attributes = `
<select name="owners" multiple data-tif="multi-select" data-tif-label="All owners" data-tif-unit="owners"
  data-tif-search-threshold="0"
  data-tif-options='[{"value":"mine","label":"Mine","selects":["ada"]},
                     {"value":"teams","label":"My teams","selects":["sales","support"]},
                     {"value":"ada","label":"Ada Lovelace","group":"Users"},
                     {"value":"alan","label":"Alan Turing","group":"Users"},
                     {"value":"sales","label":"Sales","group":"Teams"},
                     {"value":"support","label":"Support","group":"Teams"}]'>
</select>
`

export const apiHtml = `
<div id="owners"></div>
`

// @api
export function api(root: HTMLElement) {
  new Tif.TifMultiSelect(root.querySelector<HTMLElement>('#owners')!, {
    name: 'owners',
    label: 'All owners',
    unit: 'owners',
    searchThreshold: 0,
    options: [
      // A shortcut has no box: it replaces the selection with its values.
      { value: 'mine', label: 'Mine', selects: ['ada'] },
      { value: 'teams', label: 'My teams', selects: ['sales', 'support'] },
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
