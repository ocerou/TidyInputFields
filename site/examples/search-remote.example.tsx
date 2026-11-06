import * as Tif from 'tidyinputfields'
import { contactLabel, searchContacts } from './data.ts'
import { TifField } from 'tidyinputfields/react'

export const tag = `
<tif-search-select name="contact" label="Contact" value="c42" create
                   link="https://example.com/contacts/{value}" link-title="Open the contact" id="contact">
</tif-search-select>
`

export const attributes = `
<select name="contact" data-tif="search-select" data-tif-label="Contact" data-tif-create
        data-tif-link="https://example.com/contacts/{value}" data-tif-link-title="Open the contact" id="contact">
  <option value="c42" selected>c42</option>
</select>
`

export const apiHtml = `
<div id="contact"></div>
`

// @tag
export function tagScript(root: HTMLElement) {
  // The source is a function: set it in JavaScript.
  Tif.TifSearchSelect.getInstance(root.querySelector('#contact'))!.setOptions({ source: searchContacts, sourceLabel: contactLabel, value: 'c42' })
  root.addEventListener('create.tif.search-select', (event) => alert(`Create "${(event as CustomEvent).detail.search}"`))
}

// @attributes
export function attributesScript(root: HTMLElement) {
  Tif.TifSearchSelect.getInstance(root.querySelector('#contact'))!.setOptions({ source: searchContacts, sourceLabel: contactLabel, value: 'c42' })
  root.addEventListener('create.tif.search-select', (event) => alert(`Create "${(event as CustomEvent).detail.search}"`))
}

// @api
export function api(root: HTMLElement) {
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
  root.addEventListener('create.tif.search-select', (event) => alert(`Create "${(event as CustomEvent).detail.search}"`))
}

// @react
export function ReactExample() {
  return <TifField component="search-select" name="contact" label="Contact" value="c42" options={{ source: searchContacts, sourceLabel: contactLabel }} />
}
