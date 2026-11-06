import { useMemo, useState } from 'react'
import * as Tif from 'tidyinputfields'
import type { ListSource } from 'tidyinputfields'
import { TifField } from 'tidyinputfields/react'
import { demoCities } from './data.ts'

export const tag = `
<div class="bd-stack">
  <tif-search-select name="person" label="Person" value="p8" active-filter="Active people only" id="person"></tif-search-select>
  <output></output>
</div>
`

export const attributes = `
<div class="bd-stack">
  <select name="person" data-tif="search-select" data-tif-label="Person" data-tif-active-filter="Active people only" id="person">
    <option value="p8" selected>p8</option>
  </select>
  <output></output>
</div>
`

export const apiHtml = `
<div class="bd-stack">
  <div id="person"></div>
  <output></output>
</div>
`

// @shared
type Person = { id: string; name: string; city: string; active: boolean }

/**
 * Source of the list: called after each keystroke (debounced). `signal` cancels the request when the user types
 * again: pass it to fetch. Returns the options and the total of matches (“first 20 of 120: refine the search”).
 */
function peopleSource(city = ''): ListSource {
  return async (query, { limit, onlyActive, signal }) => {
    const params = new URLSearchParams({ search: query, limit: String(limit), active: String(onlyActive), city })
    const response = await fetch(`/api/demo/people?${params}`, { signal })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`) // the list shows “No result”
    }
    const page = (await response.json()) as { items: Person[]; total: number }
    return {
      options: page.items.map((p) => ({ value: p.id, label: p.name, group: city ? undefined : p.city, inactive: !p.active })),
      total: page.total,
    }
  }
}

/** Label of the current value, asked when the field shows a value it has not loaded yet (p8 → its name). */
async function personName(id: string): Promise<string | null> {
  const response = await fetch(`/api/demo/people/${encodeURIComponent(id)}`)
  return response.ok ? ((await response.json()) as Person).name : null
}

// @tag
export function tagScript(root: HTMLElement) {
  // A function cannot be written in an attribute: the source is given in JavaScript.
  const field = root.querySelector('#person')!
  Tif.TifSearchSelect.getInstance(field)!.setOptions({ source: peopleSource(), sourceLabel: personName, value: 'p8' })
  field.addEventListener('change', () => (root.querySelector('output')!.textContent = String((field as Tif.TifElement).value)))
}

// @attributes
export function attributesScript(root: HTMLElement) {
  const field = root.querySelector<HTMLSelectElement>('#person')!
  Tif.TifSearchSelect.getInstance(field)!.setOptions({ source: peopleSource(), sourceLabel: personName, value: 'p8' })
  field.addEventListener('change', () => (root.querySelector('output')!.textContent = field.value))
}

// @api
export function api(root: HTMLElement) {
  const person = new Tif.TifSearchSelect(root.querySelector<HTMLElement>('#person')!, {
    name: 'person',
    label: 'Person',
    value: 'p8',
    source: peopleSource(),
    sourceLabel: personName,
    limit: 20,
    activeFilter: 'Active people only', // footer switch, passed to the source as onlyActive
  })
  person.element.addEventListener('change', () => (root.querySelector('output')!.textContent = String(person.value)))
}

// @react
const cities = { options: [{ value: '', label: 'All cities' }, ...demoCities.map((c) => ({ value: c, label: c }))] }

export function ReactExample() {
  const [city, setCity] = useState('')
  const [person, setPerson] = useState('')

  // The source depends on the city: a new one when the city changes, and the list is asked again. useMemo keeps
  // the same object between renders (otherwise the options would be set again at each render).
  const options = useMemo(() => ({ source: peopleSource(city), sourceLabel: personName }), [city])

  return (
    <div className="bd-stack">
      <TifField
        component="select"
        name="city"
        label="City"
        value={city}
        options={cities}
        onChange={(v) => {
          setCity(String(v))
          setPerson('') // the chosen person may not live in the new city
        }}
      />
      <TifField component="search-select" name="person" label="Person" active-filter="Active people only" value={person} options={options} onChange={(v) => setPerson(String(v))} />
      <output>{JSON.stringify({ city, person })}</output>
    </div>
  )
}
