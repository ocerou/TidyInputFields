import { TifField } from './tif-react.tsx'
import * as Tif from 'tidyinputfields'

export const html = `
<div class="bd-row">
  <tif-select name="country" placeholder="Choose a country">
    <option value="fr">France</option>
    <option value="de">Germany</option>
    <option value="it">Italy</option>
  </tif-select>
  <div id="product"></div>
</div>
`

// @js
export function js(root: HTMLElement) {
  // Options and groups from an array.
  new Tif.TifSelect(root.querySelector<HTMLElement>('#product')!, {
    name: 'product',
    value: 'pro',
    options: [
      { value: 'free', label: 'Free', group: 'Plans' },
      { value: 'pro', label: 'Pro', group: 'Plans' },
      { value: 'audit', label: 'Audit', group: 'Services' },
      { value: 'training', label: 'Training', group: 'Services' },
    ],
  })
}

// @react
export function ReactExample() {
  return (
    <div className="bd-row">
      <TifField
        component="select"
        name="country"
        placeholder="Choose a country"
        options={{ options: [{ value: 'fr', label: 'France' }, { value: 'de', label: 'Germany' }, { value: 'it', label: 'Italy' }] }}
      />
      <TifField
        component="select"
        name="product"
        value="pro"
        options={{
          options: [
            { value: 'free', label: 'Free', group: 'Plans' },
            { value: 'pro', label: 'Pro', group: 'Plans' },
            { value: 'audit', label: 'Audit', group: 'Services' },
            { value: 'training', label: 'Training', group: 'Services' },
          ],
        }}
      />
    </div>
  )
}
