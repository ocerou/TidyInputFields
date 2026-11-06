import * as Tif from 'tidyinputfields'
import { contactLabel, searchContacts } from './data.ts'
import { TifField } from './tif-react.tsx'

export const html = `
<div id="account"></div>
`

// @js
export function js(root: HTMLElement) {
  new Tif.TifLookup(root.querySelector<HTMLElement>('#account')!, {
    name: 'account',
    placeholder: 'Type two letters: "lyon 01"…',
    // Suggestions: (query, { limit, signal }) => options
    source: async (query: string, context: { limit: number; signal: AbortSignal }) =>
      (await searchContacts(query, { ...context, onlyActive: true })).options,
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
