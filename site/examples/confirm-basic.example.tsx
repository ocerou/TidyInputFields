import { useState } from 'react'
import * as Tif from 'tidyinputfields'

export const html = `
<div class="bd-row">
  <button type="button" class="tif-btn" id="delete">Delete the contact</button>
  <output id="answer"></output>
</div>
`

// @js
export function js(root: HTMLElement) {
  root.querySelector('#delete')!.addEventListener('click', async (event) => {
    const ok = await Tif.confirm({
      title: 'Delete the contact?',
      message: 'Their activities are kept.',
      confirmLabel: 'Delete',
      danger: true,
      // Inside a Bootstrap modal, the dialog hangs in it.
      anchor: event.currentTarget as Element,
    })
    root.querySelector('#answer')!.textContent = ok ? 'Deleted' : 'Cancelled'
  })
}

// @react
export function ReactExample() {
  const [answer, setAnswer] = useState('')
  const ask = async () => {
    const ok = await Tif.confirm({ title: 'Delete the contact?', message: 'Their activities are kept.', confirmLabel: 'Delete', danger: true })
    setAnswer(ok ? 'Deleted' : 'Cancelled')
  }
  return (
    <div className="bd-row">
      <button type="button" className="tif-btn" onClick={ask}>
        Delete the contact
      </button>
      <output>{answer}</output>
    </div>
  )
}
