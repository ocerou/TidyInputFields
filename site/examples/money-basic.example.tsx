import { useState } from 'react'
import * as Tif from 'tidyinputfields'
import { TifField } from 'tidyinputfields/react'

export const tag = `
<form class="bd-stack" id="money-form">
  <tif-money name="price" value="1234.5"></tif-money>
  <tif-money name="budget" currency="USD" currencies='["EUR","USD","GBP","CHF","JPY"]' currency-name="budget_currency"></tif-money>
  <output></output>
</form>
`

export const attributes = `
<form class="bd-stack" id="money-form">
  <input type="number" name="price" value="1234.5" data-tif="money">
  <input name="budget" data-tif="money" data-tif-currency="USD" data-tif-currencies='["EUR","USD","GBP","CHF","JPY"]'
         data-tif-currency-name="budget_currency">
  <output></output>
</form>
`

export const apiHtml = `
<form class="bd-stack" id="money-form">
  <div id="price"></div>
  <output></output>
</form>
`

// @tag
export function tagScript(root: HTMLElement) {
  // The form receives a JSON number ("1234.5") and the currency code.
  const form = root.querySelector<HTMLFormElement>('#money-form')!
  const show = () => (form.querySelector('output')!.textContent = JSON.stringify(Object.fromEntries(new FormData(form))))
  form.addEventListener('change', show)
  show()
}

// @attributes
export function attributesScript(root: HTMLElement) {
  const form = root.querySelector<HTMLFormElement>('#money-form')!
  const show = () => (form.querySelector('output')!.textContent = JSON.stringify(Object.fromEntries(new FormData(form))))
  form.addEventListener('change', show)
  show()
}

// @api
export function api(root: HTMLElement) {
  const host = root.querySelector<HTMLElement>('#price')!
  const price = new Tif.TifMoney(host, { name: 'price', value: 1234.5, currency: 'EUR', label: 'Price' })
  host.addEventListener('change', () => (root.querySelector('output')!.textContent = `amount = ${price.amount} ${price.currency}`))
}

// @react
export function ReactExample() {
  const [price, setPrice] = useState('1234.5')
  return (
    <div className="bd-stack">
      <TifField component="money" name="price" currency="EUR" value={price} onChange={(v) => setPrice(String(v))} />
      <output>price = "{price}"</output>
    </div>
  )
}
