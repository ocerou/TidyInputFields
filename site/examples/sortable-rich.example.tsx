import * as Tif from 'tidyinputfields'
import { TifField } from './tif-react.tsx'

export const tag = `
<tif-sortable-list numbered="false" remove-title="Remove the billing contact" style="width: 100%">
  <li data-key="1" data-href="#/sortable-list" data-label="Ada Lovelace">Ada Lovelace <small>ada@example.com</small></li>
  <li data-key="2" data-label="Alan Turing"><span class="bd-row">Alan Turing <span class="tif-pill">Main</span></span></li>
  <li data-key="3" data-fixed>Grace Hopper</li>
</tif-sortable-list>
`

export const attributes = `
<div data-tif="sortable-list" data-tif-numbered="false" data-tif-remove-title="Remove the billing contact" style="width: 100%">
  <ul>
    <li data-key="1" data-href="#/sortable-list" data-label="Ada Lovelace">Ada Lovelace <small>ada@example.com</small></li>
    <li data-key="2" data-label="Alan Turing"><span class="bd-row">Alan Turing <span class="tif-pill">Main</span></span></li>
    <li data-key="3" data-fixed>Grace Hopper</li>
  </ul>
</div>
`

export const apiHtml = `
<div id="contacts" style="width: 100%"></div>
`

// @api
export function api(root: HTMLElement) {
  const pill = (text: string) => Tif.h('span', { class: 'tif-pill' }, text)
  new Tif.TifSortableList(root.querySelector<HTMLElement>('#contacts')!, {
    numbered: false,
    removeTitle: 'Remove the billing contact',
    items: [
      // Content can be any node: a link, extra text, a pill…; a fixed item cannot be removed.
      { key: '1', label: 'Ada Lovelace', href: '#/sortable-list', title: 'Open the contact', content: Tif.h('span', {}, 'Ada Lovelace ', Tif.h('small', {}, 'ada@example.com')) },
      { key: '2', label: 'Alan Turing', content: Tif.h('span', { class: 'bd-row' }, 'Alan Turing', pill('Main')) },
      { key: '3', label: 'Grace Hopper', fixed: true },
    ],
  })
}

// @react
export function ReactExample() {
  return (
    <TifField
      component="sortable-list"
      numbered={false}
      remove-title="Remove the billing contact"
      style={{ width: '100%' }}
      options={{
        items: [
          { key: '1', label: 'Ada Lovelace', href: '#/sortable-list', title: 'Open the contact' },
          { key: '2', label: 'Alan Turing' },
          { key: '3', label: 'Grace Hopper', fixed: true },
        ],
      }}
    />
  )
}
