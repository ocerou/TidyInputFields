import { useState } from 'react'
import { TifField } from 'tidyinputfields/react'

export const html = `
<form class="bd-stack" id="signup">
  <tif-text name="name" placeholder="Full name" required></tif-text>
  <tif-date name="start"></tif-date>
  <tif-selector name="plan" value="pro">
    <option value="free">Free</option>
    <option value="pro">Pro</option>
    <option value="team">Team</option>
  </tif-selector>
  <output></output>
</form>
`

// @js
export function js(root: HTMLElement) {
  const form = root.querySelector<HTMLFormElement>('#signup')!
  const show = () => {
    form.querySelector('output')!.textContent = JSON.stringify(Object.fromEntries(new FormData(form)))
  }
  form.addEventListener('change', show)
  // The tags create their fields when they enter the page.
  queueMicrotask(show)
}

// @react
export function ReactExample() {
  const [values, setValues] = useState({ name: '', start: '', plan: 'pro' })
  const set = (key: string) => (value: unknown) => setValues((v) => ({ ...v, [key]: value }))
  return (
    <form className="bd-stack">
      <TifField component="text" name="name" placeholder="Full name" required value={values.name} onChange={set('name')} />
      <TifField component="date" name="start" value={values.start} onChange={set('start')} />
      <TifField
        component="selector"
        name="plan"
        value={values.plan}
        onChange={set('plan')}
        options={{ options: [{ value: 'free', label: 'Free' }, { value: 'pro', label: 'Pro' }, { value: 'team', label: 'Team' }] }}
      />
      <output>{JSON.stringify(values)}</output>
    </form>
  )
}
