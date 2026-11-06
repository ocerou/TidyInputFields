import * as Tif from 'tidyinputfields'
import { TifField } from 'tidyinputfields/react'

export const tag = `
<tif-select name="product" placeholder="Choose a product" value="pro">
  <optgroup label="Plans"><option value="free">Free</option><option value="pro">Pro</option></optgroup>
  <optgroup label="Services"><option value="audit">Audit</option><option value="training">Training</option></optgroup>
</tif-select>
`

export const attributes = `
<select name="product" data-tif="select" data-tif-placeholder="Choose a product">
  <optgroup label="Plans"><option value="free">Free</option><option value="pro" selected>Pro</option></optgroup>
  <optgroup label="Services"><option value="audit">Audit</option><option value="training">Training</option></optgroup>
</select>
`

export const apiHtml = `
<div id="product"></div>
`

// @api
export function api(root: HTMLElement) {
  new Tif.TifSelect(root.querySelector<HTMLElement>('#product')!, {
    name: 'product',
    placeholder: 'Choose a product',
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
    <TifField
      component="select"
      name="product"
      placeholder="Choose a product"
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
  )
}
