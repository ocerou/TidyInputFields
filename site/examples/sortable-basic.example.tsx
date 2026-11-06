import { useState } from 'react'
import * as Tif from 'tidyinputfields'
import { TifField } from './tif-react.tsx'

export const tag = `
<form style="width: 100%">
  <tif-sortable-list name="domains" reorderable add label="Domains" remove-detail="The mailbox is not deleted.">
    <li data-key="example.com">example.com</li>
    <li data-key="example.org">example.org</li>
    <li data-key="example.net">example.net</li>
  </tif-sortable-list>
  <output></output>
</form>
`

export const attributes = `
<form style="width: 100%">
  <div data-tif="sortable-list" data-tif-name="domains" data-tif-reorderable data-tif-add data-tif-label="Domains"
       data-tif-remove-detail="The mailbox is not deleted.">
    <ul>
      <li data-key="example.com">example.com</li>
      <li data-key="example.org">example.org</li>
      <li data-key="example.net">example.net</li>
    </ul>
  </div>
  <output></output>
</form>
`

export const apiHtml = `
<form style="width: 100%">
  <div id="domains"></div>
  <output></output>
</form>
`

// @tag
export function tagScript(root: HTMLElement) {
  const form = root.querySelector('form')!
  // "+" clicked: open your own dialog, then add the item.
  form.addEventListener('add.tif.sortable-list', (event) => {
    const domain = prompt('Domain name', 'example.io')
    if (domain) {
      Tif.TifSortableList.getInstance(event.target as HTMLElement)!.add({ key: domain, label: domain })
    }
  })
  // The form sends the keys, in order.
  form.addEventListener('change', () => (form.querySelector('output')!.textContent = JSON.stringify(new FormData(form).getAll('domains'))))
}

// @attributes
export function attributesScript(root: HTMLElement) {
  const form = root.querySelector('form')!
  form.addEventListener('add.tif.sortable-list', (event) => {
    const domain = prompt('Domain name', 'example.io')
    if (domain) {
      Tif.TifSortableList.getInstance(event.target as HTMLElement)!.add({ key: domain, label: domain })
    }
  })
  form.addEventListener('change', () => (form.querySelector('output')!.textContent = JSON.stringify(new FormData(form).getAll('domains'))))
}

// @api
export function api(root: HTMLElement) {
  const host = root.querySelector<HTMLElement>('#domains')!
  const list = new Tif.TifSortableList(host, {
    name: 'domains',
    reorderable: true,
    add: true,
    label: 'Domains',
    removeDetail: 'The mailbox is not deleted.',
    items: ['example.com', 'example.org', 'example.net'].map((domain) => ({ key: domain, label: domain })),
  })
  host.addEventListener('add.tif.sortable-list', () => {
    const domain = prompt('Domain name', 'example.io')
    if (domain) {
      list.add({ key: domain, label: domain })
    }
  })
  host.addEventListener('change', () => (root.querySelector('output')!.textContent = JSON.stringify(list.value)))
}

// @react
export function ReactExample() {
  const [keys, setKeys] = useState<string[]>([])
  return (
    <div style={{ width: '100%' }}>
      <TifField
        component="sortable-list"
        name="domains"
        reorderable
        label="Domains"
        onChange={(v) => setKeys(v as string[])}
        options={{ items: ['example.com', 'example.org', 'example.net'].map((d) => ({ key: d, label: d })) }}
      />
      <output>{JSON.stringify(keys)}</output>
    </div>
  )
}
