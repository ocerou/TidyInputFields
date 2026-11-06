import * as Tif from 'tidyinputfields'
import { TifField } from './tif-react.tsx'

export const tag = `
<div class="bd-stack">
  <tif-text name="title" placeholder="Title" required></tif-text>
  <tif-text name="email" type="email" placeholder="name@example.com" autocomplete="email"></tif-text>
  <tif-number name="quantity" min="0" step="1" value="3"></tif-number>
  <tif-textarea name="notes" rows="3" placeholder="Notes" style="width: 100%"></tif-textarea>
</div>
`

export const attributes = `
<div class="bd-stack">
  <input name="title" placeholder="Title" required data-tif="text">
  <input name="email" type="email" placeholder="name@example.com" autocomplete="email" data-tif="text">
  <input name="quantity" type="number" min="0" step="1" value="3" data-tif="number">
  <textarea name="notes" rows="3" placeholder="Notes" style="width: 100%" data-tif="textarea"></textarea>
</div>
`

export const apiHtml = `
<div class="bd-stack">
  <div id="title"></div>
  <div id="email"></div>
  <div id="quantity"></div>
  <div id="notes" style="width: 100%"></div>
</div>
`

// @api
export function api(root: HTMLElement) {
  const host = (id: string) => root.querySelector<HTMLElement>(`#${id}`)!
  new Tif.TifText(host('title'), { name: 'title', placeholder: 'Title', required: true })
  new Tif.TifText(host('email'), { name: 'email', type: 'email', placeholder: 'name@example.com', autocomplete: 'email' })
  const quantity = new Tif.TifNumber(host('quantity'), { name: 'quantity', min: 0, step: 1, value: '3' })
  new Tif.TifTextarea(host('notes'), { name: 'notes', rows: 3, placeholder: 'Notes' })
  quantity.control.addEventListener('change', () => console.log(quantity.number))
}

// @react
export function ReactExample() {
  return (
    <div className="bd-stack">
      <TifField component="text" name="title" placeholder="Title" required />
      <TifField component="text" name="email" type="email" placeholder="name@example.com" autocomplete="email" />
      <TifField component="number" name="quantity" min="0" step="1" value="3" />
      <TifField component="textarea" name="notes" rows="3" placeholder="Notes" style={{ width: '100%' }} />
    </div>
  )
}
