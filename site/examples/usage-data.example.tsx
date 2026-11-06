import { useRef } from 'react'
import * as Tif from 'tidyinputfields'
import { useTif } from 'tidyinputfields/react'

export const html = `
<input name="duration" value="12" data-tif="unit" data-tif-unit="months">
`

// @react
export function ReactExample() {
  // An existing field rendered by React, dressed after rendering and given back before React removes it.
  const input = useRef<HTMLInputElement>(null)
  useTif(Tif.TifUnit, input, { unit: 'months' })
  return (
    <div>
      <input ref={input} name="duration" defaultValue="12" />
    </div>
  )
}
