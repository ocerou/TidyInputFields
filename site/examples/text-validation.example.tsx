import { useState, type FormEvent } from 'react'
import { TifField } from './tif-react.tsx'

export const html = `
<form class="bd-stack" id="contact" novalidate>
  <tif-text name="name" placeholder="Name (required)" required></tif-text>
  <tif-text name="email" type="email" placeholder="E-mail (required)" required></tif-text>
  <tif-date name="due" required></tif-date>
  <button class="tif-btn tif-btn-primary">Send</button>
</form>
`

// @js
export function js(root: HTMLElement) {
  const form = root.querySelector<HTMLFormElement>('#contact')!
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    // Same convention as Bootstrap: .was-validated shows the native validity of every field.
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
