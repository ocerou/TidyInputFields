import { useState } from 'react'
import { TifField } from 'tidyinputfields/react'
import { TifRichText, type RichTextMention } from 'tidyinputfields/rich-text'

export const tag = `
<form class="bd-stack" id="rich-form">
  <tif-rich-text name="notes" placeholder="Meeting notes.">
    <h2>Agenda</h2>
    <ul><li><p>Budget <strong>2027</strong></p></li><li><p>Next steps</p></li></ul>
    <p>Select some text to format it, type <code>/</code> for blocks, <code>/:</code> for an emoji.</p>
  </tif-rich-text>
  <pre class="bd-output"></pre>
</form>
`

export const attributes = `
<form class="bd-stack" id="rich-form">
  <textarea name="notes" data-tif="rich-text" data-tif-placeholder="Meeting notes.">
First line of plain text.
Each line becomes a paragraph.</textarea>
  <pre class="bd-output"></pre>
</form>
`

export const apiHtml = `
<form class="bd-stack" id="rich-form">
  <div id="notes"></div>
  <pre class="bd-output"></pre>
</form>
`

// @tag
export function tagScript(root: HTMLElement) {
  // The form receives the HTML; "change" comes when the editor is left.
  const form = root.querySelector<HTMLFormElement>('#rich-form')!
  const show = () => (form.querySelector('pre')!.textContent = String(new FormData(form).get('notes')))
  form.addEventListener('change', show)
  show()
}

// @attributes
export function attributesScript(root: HTMLElement) {
  const form = root.querySelector<HTMLFormElement>('#rich-form')!
  const show = () => (form.querySelector('pre')!.textContent = String(new FormData(form).get('notes')))
  form.addEventListener('change', show)
  show()
}

// @api
export function api(root: HTMLElement) {
  const people: RichTextMention[] = [
    { id: 'ada', label: 'Ada Lovelace', detail: 'Analyst', group: 'Team' },
    { id: 'alan', label: 'Alan Turing', detail: 'Engineer', group: 'Team' },
    { id: 'grace', label: 'Grace Hopper', detail: 'Admiral', group: 'Guests' },
  ]
  const editor = new TifRichText(root.querySelector<HTMLElement>('#notes')!, {
    name: 'notes',
    value: '<p>Type <strong>@</strong> to mention someone, or paste an image.</p>',
    // "@": the people matching what is typed (your API would answer here).
    mentions: (query: string) => people.filter((p) => p.label.toLowerCase().includes(query.toLowerCase())),
    // Images: send the file to your server, return its address (and its id to store only the id).
    uploadImage: async (file: File) => ({ src: URL.createObjectURL(file), alt: file.name }),
  })
  const show = () => (root.querySelector('pre')!.textContent = editor.value)
  editor.element.addEventListener('input', show)
  show()
}

// @react
export function ReactExample() {
  const [notes, setNotes] = useState('<p>Edited in <em>React</em>.</p>')
  return (
    <div className="bd-stack">
      <TifField component="rich-text" name="notes" value={notes} onChange={(v) => setNotes(v as string)} />
      <pre className="bd-output">{notes}</pre>
    </div>
  )
}
