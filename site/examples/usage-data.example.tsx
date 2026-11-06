import { useLayoutEffect, useRef } from 'react'
import * as Tif from 'tidyinputfields'

export const html = `
<input name="duration" value="12" data-tif="unit" data-tif-unit="months">
`

// @react
export function ReactExample() {
  // An existing field can be dressed after rendering. useLayoutEffect (not useEffect): the field is given
  // back to React before React removes it, since some components wrap it in their own frame.
  const input = useRef<HTMLInputElement>(null)
  useLayoutEffect(() => {
    const unit = new Tif.TifUnit(input.current!, { unit: 'months' })
    return () => unit.dispose()
  }, [])
  return (
    <div>
      <input ref={input} name="duration" defaultValue="12" />
    </div>
  )
}
