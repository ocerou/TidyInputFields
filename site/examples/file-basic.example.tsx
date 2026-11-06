import { useState } from 'react'
import * as Tif from 'tidyinputfields'
import { TifField } from 'tidyinputfields/react'

export const tag = `
<form class="bd-stack" id="files-form" enctype="multipart/form-data">
  <tif-file name="documents" multiple accept="image/*,.pdf" max-size="5MB" max-files="3"></tif-file>
  <output></output>
</form>
`

export const attributes = `
<form class="bd-stack" id="files-form" enctype="multipart/form-data">
  <input type="file" name="documents" multiple accept="image/*,.pdf" data-tif="file" data-tif-max-size="5MB" data-tif-max-files="3">
  <output></output>
</form>
`

export const apiHtml = `
<form class="bd-stack" id="files-form" enctype="multipart/form-data">
  <div id="documents"></div>
  <output></output>
</form>
`

// @tag
export function tagScript(root: HTMLElement) {
  // The files stay in the native <input type="file">: the form sends them.
  const form = root.querySelector<HTMLFormElement>('#files-form')!
  form.addEventListener('change', () => {
    const files = new FormData(form).getAll('documents') as File[]
    form.querySelector('output')!.textContent = JSON.stringify(files.filter((f) => f.name).map((f) => f.name))
  })
}

// @attributes
export function attributesScript(root: HTMLElement) {
  const form = root.querySelector<HTMLFormElement>('#files-form')!
  form.addEventListener('change', () => {
    const files = new FormData(form).getAll('documents') as File[]
    form.querySelector('output')!.textContent = JSON.stringify(files.filter((f) => f.name).map((f) => f.name))
  })
}

// @api
export function api(root: HTMLElement) {
  const host = root.querySelector<HTMLElement>('#documents')!
  const documents = new Tif.TifFile(host, { name: 'documents', multiple: true, accept: 'image/*,.pdf', maxSize: '5MB', maxFiles: 3 })
  host.addEventListener('change', () => {
    root.querySelector('output')!.textContent = documents.value.map((f) => `${f.name} (${Tif.formatSize(f.size)})`).join(', ')
  })
}

// @react
export function ReactExample() {
  const [files, setFiles] = useState<File[]>([])
  return (
    <div className="bd-stack">
      <TifField component="file" name="documents" multiple accept="image/*,.pdf" max-size="5MB" onChange={(v) => setFiles(v as File[])} />
      <output>{JSON.stringify(files.map((f) => f.name))}</output>
    </div>
  )
}
