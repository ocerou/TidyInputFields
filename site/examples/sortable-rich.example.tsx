import * as Tif from 'tidyinputfields'

export const html = `
<div id="contacts" style="width: 100%"></div>
`

// @js
export function js(root: HTMLElement) {
  const pill = (text: string) => Tif.h('span', { class: 'tif-pill' }, text)
  new Tif.TifSortableList(root.querySelector<HTMLElement>('#contacts')!, {
    numbered: false,
    removeTitle: 'Remove the billing contact',
    items: [
      // Content can be any node: a link, extra text, a pill aligned to the right…
      { key: '1', label: 'Ada Lovelace', href: '#/sortable-list', title: 'Open the contact', content: Tif.h('span', {}, 'Ada Lovelace ', Tif.h('small', {}, 'ada@example.com')) },
      { key: '2', label: 'Alan Turing', content: Tif.h('span', { class: 'bd-row' }, 'Alan Turing', pill('Main')) },
      { key: '3', label: 'Grace Hopper', fixed: true },
    ],
  })
}
