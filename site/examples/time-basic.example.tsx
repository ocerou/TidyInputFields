import { TifField } from './tif-react.tsx'

export const html = `
<div class="bd-row">
  <tif-time name="start" value="09:30"></tif-time>
  <tif-time name="end" minute-step="5" placeholder="hh:mm"></tif-time>
</div>
`

// @react
export function ReactExample() {
  return (
    <div className="bd-row">
      <TifField component="time" name="start" value="09:30" />
      <TifField component="time" name="end" minute-step="5" />
    </div>
  )
}
