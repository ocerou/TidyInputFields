import { useState } from 'react'
import * as Tif from 'tidyinputfields'
import { countries } from './data.ts'
import { TifField } from './tif-react.tsx'

export const tag = `
<tif-search-select name="country" label="Country" empty-label="— None —" value="fr">
  <option value="be">Belgium</option>
  <option value="fr">France</option>
  <option value="de">Germany</option>
  <option value="it">Italy</option>
  <option value="es">Spain</option>
</tif-search-select>
`

export const attributes = `
<select name="country" data-tif="search-select" data-tif-label="Country" data-tif-empty-label="— None —">
  <option value="be">Belgium</option>
  <option value="fr" selected>France</option>
  <option value="de">Germany</option>
  <option value="it">Italy</option>
  <option value="es">Spain</option>
</select>
`

export const apiHtml = `
<div id="country"></div>
`

// @api
export function api(root: HTMLElement) {
  new Tif.TifSearchSelect(root.querySelector<HTMLElement>('#country')!, {
    name: 'country',
    label: 'Country',
    emptyLabel: '— None —',
    value: 'fr',
    options: countries, // { value, label }[]
  })
}

// @react
export function ReactExample() {
  const [country, setCountry] = useState('fr')
  return (
    <div className="bd-row">
      <TifField
        component="search-select"
        name="country"
        label="Country"
        empty-label="— None —"
        value={country}
        onChange={(v) => setCountry(String(v))}
        options={{ options: countries }}
      />
      <output>{country || 'none'}</output>
    </div>
  )
}
