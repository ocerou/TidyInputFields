import { useState } from 'react'
import { countries } from './data.ts'
import { TifField } from './tif-react.tsx'

export const html = `
<div class="bd-row">
  <tif-search-select name="country" label="Country" empty-label="— None —" value="fr">
    <option value="be">Belgium</option>
    <option value="fr">France</option>
    <option value="de">Germany</option>
    <option value="it">Italy</option>
    <option value="es">Spain</option>
  </tif-search-select>
  <select name="language" data-tif="search-select" data-tif-required>
    <option value=""></option>
    <option value="en">English</option>
    <option value="fr">French</option>
  </select>
</div>
`

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
