import { useState } from 'react'
import { TifField } from './tif-react.tsx'

export const html = `
<form class="bd-stack" id="filters">
  <select name="sector" multiple data-tif="multi-select" data-tif-label="All sectors" data-tif-unit="sectors">
    <option>Bank</option><option>Insurance</option><option>Industry</option><option>Retail</option>
    <option>Public</option><option>Health</option><option>Energy</option><option>Transport</option>
  </select>
  <tif-multi-select name="type" label="All types" value='["client"]'>
    <option value="prospect">Prospect</option>
    <option value="client">Client</option>
    <option value="partner">Partner</option>
  </tif-multi-select>
  <output></output>
</form>
`

// @js
export function js(root: HTMLElement) {
  const form = root.querySelector<HTMLFormElement>('#filters')!
  const show = () => {
    const data = new FormData(form)
    form.querySelector('output')!.textContent = JSON.stringify({ sector: data.getAll('sector'), type: data.getAll('type') })
  }
  form.addEventListener('change', show)
  queueMicrotask(show)
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
