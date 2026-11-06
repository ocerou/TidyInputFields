import { TifField } from './tif-react.tsx'

export const html = `
<div class="bd-stack">
  <tif-text name="title" placeholder="Title"></tif-text>
  <tif-text name="email" type="email" placeholder="name@example.com" autocomplete="email"></tif-text>
  <tif-text name="secret" type="password" placeholder="Password"></tif-text>
  <tif-number name="quantity" min="0" step="1" value="3"></tif-number>
  <tif-textarea name="notes" rows="3" placeholder="Notes" style="width: 100%"></tif-textarea>
</div>
`

// @react
export function ReactExample() {
  return (
    <div className="bd-stack">
      <TifField component="text" name="title" placeholder="Title" />
      <TifField component="text" name="email" type="email" placeholder="name@example.com" autocomplete="email" />
      <TifField component="text" name="secret" type="password" placeholder="Password" />
      <TifField component="number" name="quantity" min="0" step="1" value="3" />
      <TifField component="textarea" name="notes" rows="3" placeholder="Notes" style={{ width: '100%' }} />
    </div>
  )
}
