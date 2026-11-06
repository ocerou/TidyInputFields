import { useState } from 'react'
import * as Tif from 'tidyinputfields'
import { TifField } from 'tidyinputfields/react'

export const tag = `
<form id="filters" class="bd-stack">
  <tif-multi-select name="type" label="All types" value='["client"]'>
    <option value="prospect">Prospect</option>
    <option value="client">Client</option>
    <option value="partner">Partner</option>
  </tif-multi-select>
  <output></output>
</form>
`

export const attributes = `
<form id="filters" class="bd-stack">
  <select name="type" multiple data-tif="multi-select" data-tif-label="All types">
    <option value="prospect">Prospect</option>
    <option value="client" selected>Client</option>
    <option value="partner">Partner</option>
  </select>
  <output></output>
</form>
`

export const apiHtml = `
<form id="filters" class="bd-stack">
  <div id="type"></div>
  <output></output>
</form>
`

// @tag
export function tagScript(root: HTMLElement) {
  // The form sends every checked value.
  const form = root.querySelector<HTMLFormElement>('#filters')!
  form.addEventListener('change', () => (form.querySelector('output')!.textContent = JSON.stringify(new FormData(form).getAll('type'))))
}

// @attributes
export function attributesScript(root: HTMLElement) {
  const form = root.querySelector<HTMLFormElement>('#filters')!
  form.addEventListener('change', () => (form.querySelector('output')!.textContent = JSON.stringify(new FormData(form).getAll('type'))))
}

// @api
export function api(root: HTMLElement) {
  const type = new Tif.TifMultiSelect(root.querySelector<HTMLElement>('#type')!, {
    name: 'type',
    label: 'All types',
    unit: 'types', // “2 types”
    value: ['client'],
    options: [
      { value: 'prospect', label: 'Prospect' },
      { value: 'client', label: 'Client' },
      { value: 'partner', label: 'Partner' },
    ],
  })
  root.querySelector('form')!.addEventListener('change', () => (root.querySelector('output')!.textContent = JSON.stringify(type.value)))
}

// @react
export function ReactExample() {
  const [types, setTypes] = useState<string[]>(['client'])
  return (
    <div className="bd-stack">
      <TifField
        component="multi-select"
        name="type"
        label="All types"
        value={types}
        onChange={(v) => setTypes(v as string[])}
        options={{
          options: [
            { value: 'prospect', label: 'Prospect' },
            { value: 'client', label: 'Client' },
            { value: 'partner', label: 'Partner' },
          ],
        }}
      />
      <output>{JSON.stringify(types)}</output>
    </div>
  )
}
