import * as Tif from 'tidyinputfields'
import { contactLabel, searchContacts } from './data.ts'
import { TifField } from 'tidyinputfields/react'

export const tag = `
<tif-lookup name="account" placeholder='Type two letters: "lyon 01"…' id="account"></tif-lookup>
`

export const attributes = `
<input name="account" data-tif="lookup" data-tif-placeholder='Type two letters: "lyon 01"…' id="account">
`

export const apiHtml = `
<div id="account"></div>
`

// @tag
export function tagScript(root: HTMLElement) {
  // The suggestions come from a function: set it in JavaScript.
  Tif.TifLookup.getInstance(root.querySelector('#account'))!.setOptions({
    source: async (query: string, context: { limit: number; signal: AbortSignal }) => (await searchContacts(query, { ...context, onlyActive: true })).options,
    sourceLabel: contactLabel,
  })
}

// @attributes
export function attributesScript(root: HTMLElement) {
  Tif.TifLookup.getInstance(root.querySelector('#account'))!.setOptions({
    source: async (query: string, context: { limit: number; signal: AbortSignal }) => (await searchContacts(query, { ...context, onlyActive: true })).options,
    sourceLabel: contactLabel,
  })
}

// @api
export function api(root: HTMLElement) {
  new Tif.TifLookup(root.querySelector<HTMLElement>('#account')!, {
    name: 'account',
    placeholder: 'Type two letters: "lyon 01"…',
    // Suggestions: (query, { limit, signal }) => options
    source: async (query: string, context: { limit: number; signal: AbortSignal }) => (await searchContacts(query, { ...context, onlyActive: true })).options,
    sourceLabel: contactLabel,
  })
}

// @react
export function ReactExample() {
  return (
    <TifField
      component="lookup"
      name="account"
      placeholder="Type two letters…"
      options={{
        source: async (query: string, context: { limit: number; signal: AbortSignal }) => (await searchContacts(query, { ...context, onlyActive: true })).options,
        sourceLabel: contactLabel,
      }}
    />
  )
}
