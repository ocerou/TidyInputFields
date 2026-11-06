import { useState } from 'react'
import { TifField } from './tif-react.tsx'

export const html = `
<form id="domains-form" style="width: 100%">
  <tif-sortable-list name="domains" reorderable add label="Domains" remove-detail="The mailbox is not deleted.">
    <li data-key="example.com">example.com</li>
    <li data-key="example.org">example.org</li>
    <li data-key="example.net">example.net</li>
  </tif-sortable-list>
  <output></output>
</form>
`

// @js
export function js(root: HTMLElement) {
  const form = root.querySelector<HTMLFormElement>('#domains-form')!
  const list = form.querySelector('tif-sortable-list')!
  // "+" clicked: open your own dialog, then add the item.
  list.addEventListener('add.tif.sortable-list', () => {
    const domain = prompt('Domain name', 'example.io')
    if (domain) {
      ;(list as HTMLElement & { instance: { add: (item: { key: string; label: string }) => void } }).instance.add({ key: domain, label: domain })
    }
  })
  const show = () => (form.querySelector('output')!.textContent = JSON.stringify(new FormData(form).getAll('domains')))
  form.addEventListener('change', show)
  queueMicrotask(show)
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
        options={{
          items: ['example.com', 'example.org', 'example.net'].map((d) => ({ key: d, label: d })),
        }}
      />
      <output>{JSON.stringify(keys)}</output>
    </div>
  )
}
