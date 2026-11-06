import { useState } from 'react'
import { TifField } from 'tidyinputfields/react'

export const html = `
<div class="bd-stack">
  <tif-date name="due" id="due"></tif-date>
  <output id="log">Open the calendar, choose a day…</output>
</div>
`

// @js
export function js(root: HTMLElement) {
  const date = root.querySelector('#due')!
  const log = root.querySelector('#log')!
  const write = (text: string) => (log.textContent = `${text}\n${log.textContent}`.split('\n').slice(0, 4).join('\n'))
  // Lifecycle events, Bootstrap style: <name>.tif.<component>.
  date.addEventListener('show.tif.date', () => write('show.tif.date'))
  date.addEventListener('hidden.tif.date', () => write('hidden.tif.date'))
  // Native events, from the field that holds the value.
  date.addEventListener('change', (event) => write(`change → ${(event.target as HTMLInputElement).value}`))
}

// @react
export function ReactExample() {
  const [due, setDue] = useState('')
  return (
    <div className="bd-stack">
      <TifField component="date" name="due" value={due} onChange={(value) => setDue(String(value))} />
      <output>{due ? `change → ${due}` : 'Choose a day…'}</output>
    </div>
  )
}
