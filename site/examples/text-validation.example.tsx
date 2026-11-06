import { useState, type FormEvent } from 'react'
import * as Tif from 'tidyinputfields'
import { TifField } from 'tidyinputfields/react'

export const tag = `
<form class="bd-stack" novalidate>
  <tif-text name="name" placeholder="Name (required)" required></tif-text>
  <tif-text name="email" type="email" placeholder="E-mail (required)" required></tif-text>
  <tif-date name="due" required></tif-date>
  <button class="tif-btn tif-btn-primary">Send</button>
</form>
`

export const attributes = `
<form class="bd-stack" novalidate>
  <input name="name" placeholder="Name (required)" required data-tif="text">
  <input name="email" type="email" placeholder="E-mail (required)" required data-tif="text">
  <input name="due" type="date" required data-tif="date">
  <button class="tif-btn tif-btn-primary">Send</button>
</form>
`

export const apiHtml = `
<form class="bd-stack" novalidate>
  <div id="name"></div>
  <div id="email"></div>
  <div id="due"></div>
  <button class="tif-btn tif-btn-primary">Send</button>
</form>
`

// @tag
export function tagScript(root: HTMLElement) {
  const form = root.querySelector('form')!
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    // Same convention as Bootstrap: .was-validated shows the native validity of every field.
    form.classList.add('was-validated')
    if (form.checkValidity()) {
      alert(JSON.stringify(Object.fromEntries(new FormData(form))))
    }
  })
}

// @attributes
export function attributesScript(root: HTMLElement) {
  const form = root.querySelector('form')!
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    form.classList.add('was-validated')
    if (form.checkValidity()) {
      alert(JSON.stringify(Object.fromEntries(new FormData(form))))
    }
  })
}

// @api
export function api(root: HTMLElement) {
  new Tif.TifText(root.querySelector<HTMLElement>('#name')!, { name: 'name', placeholder: 'Name (required)', required: true })
  new Tif.TifText(root.querySelector<HTMLElement>('#email')!, { name: 'email', type: 'email', placeholder: 'E-mail (required)', required: true })
  new Tif.TifDate(root.querySelector<HTMLElement>('#due')!, { name: 'due', required: true })
  const form = root.querySelector('form')!
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    form.classList.add('was-validated')
    if (form.checkValidity()) {
      alert(JSON.stringify(Object.fromEntries(new FormData(form))))
    }
  })
}

// @react
export function ReactExample() {
  const [validated, setValidated] = useState(false)
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setValidated(true)
    if (event.currentTarget.checkValidity()) {
      alert(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))))
    }
  }
  return (
    <form className={`bd-stack${validated ? ' was-validated' : ''}`} noValidate onSubmit={submit}>
      <TifField component="text" name="name" placeholder="Name (required)" required />
      <TifField component="text" name="email" type="email" placeholder="E-mail (required)" required />
      <TifField component="date" name="due" required />
      <button className="tif-btn tif-btn-primary">Send</button>
    </form>
  )
}
