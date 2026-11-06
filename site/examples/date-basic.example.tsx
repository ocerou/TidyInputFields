import { useState } from 'react'
import { TifField } from './tif-react.tsx'

export const html = `
<form class="bd-stack" id="dates">
  <tif-date name="due" label="Due date"></tif-date>
  <input type="date" name="start" value="2026-11-06" data-tif="date">
  <output></output>
</form>
`

// @js
export function js(root: HTMLElement) {
  const form = root.querySelector<HTMLFormElement>('#dates')!
  const show = () => (form.querySelector('output')!.textContent = JSON.stringify(Object.fromEntries(new FormData(form))))
  // The form receives ISO dates; the field shows the format of the language.
  form.addEventListener('change', show)
  queueMicrotask(show)
}

// @react
export function ReactExample() {
  const [due, setDue] = useState('')
  return (
    <div className="bd-stack">
      <TifField component="date" name="due" label="Due date" value={due} onChange={(v) => setDue(String(v))} />
      <output>due = "{due}"</output>
    </div>
  )
}
