import * as Tif from 'tidyinputfields'
import { owners } from './data.ts'
import { TifField } from './tif-react.tsx'

export const tag = `
<tif-search-select name="owner" label="Owner" required group-order='["Teams"]'>
  <optgroup label="Users">
    <option value="ada" data-pill="User">Ada Lovelace</option>
    <option value="alan" data-pill="User">Alan Turing</option>
    <option value="eric" data-pill="User" data-inactive>Éric Dupont</option>
    <option value="grace" data-pill="User">Grace Hopper</option>
  </optgroup>
  <optgroup label="Teams">
    <option value="sales" data-pill="Team">Sales</option>
    <option value="support" data-pill="Team">Support</option>
  </optgroup>
</tif-search-select>
`

export const attributes = `
<select name="owner" data-tif="search-select" data-tif-label="Owner" data-tif-required data-tif-group-order='["Teams"]'>
  <option value=""></option>
  <optgroup label="Users">
    <option value="ada" data-pill="User">Ada Lovelace</option>
    <option value="alan" data-pill="User">Alan Turing</option>
    <option value="eric" data-pill="User" data-inactive>Éric Dupont</option>
    <option value="grace" data-pill="User">Grace Hopper</option>
  </optgroup>
  <optgroup label="Teams">
    <option value="sales" data-pill="Team">Sales</option>
    <option value="support" data-pill="Team">Support</option>
  </optgroup>
</select>
`

export const apiHtml = `
<div id="owner"></div>
`

// @api
export function api(root: HTMLElement) {
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
