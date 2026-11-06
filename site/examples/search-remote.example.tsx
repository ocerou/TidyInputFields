import * as Tif from 'tidyinputfields'
import { contactLabel, searchContacts } from './data.ts'
import { TifField } from './tif-react.tsx'

export const html = `
<div id="contact"></div>
`

// @js
export function js(root: HTMLElement) {
  new Tif.TifSearchSelect(root.querySelector<HTMLElement>('#contact')!, {
    name: 'contact',
    label: 'Contact',
    value: 'c42',
    // Asked at each keystroke (debounced): (query, { limit, onlyActive, signal }) => { options, total }
    source: searchContacts,
    // Label of the current value: GET /contacts/{id}
    sourceLabel: contactLabel,
    link: 'https://example.com/contacts/{value}',
    linkTitle: 'Open the contact',
    create: true,
  })
  root.addEventListener('create.tif.search-select', (event) => {
    alert(`Create a contact named "${(event as CustomEvent).detail.search}"`)
  })
}

// @react
export function ReactExample() {
  return (
    <TifField
      component="search-select"
      name="contact"
      label="Contact"
      value="c42"
      options={{ source: searchContacts, sourceLabel: contactLabel }}
    />
  )
}
