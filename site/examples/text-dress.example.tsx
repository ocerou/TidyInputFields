import { useLayoutEffect, useRef } from 'react'
import * as Tif from 'tidyinputfields'

export const html = `
<div class="bd-stack">
  <label class="bd-label">Existing field, dressed
    <input name="city" placeholder="City" data-tif="text">
  </label>
  <label class="bd-label">Already a Bootstrap field: keeps Bootstrap's look
    <input name="zip" class="form-control" placeholder="Zip code" data-tif="text">
  </label>
</div>
`

// @react
export function ReactExample() {
  const city = useRef<HTMLInputElement>(null)
  useLayoutEffect(() => {
    const text = new Tif.TifText(city.current!)
    return () => text.dispose()
  }, [])
  return (
    <label className="bd-label">
      Existing field, dressed
      <input ref={city} name="city" placeholder="City" />
    </label>
  )
}
