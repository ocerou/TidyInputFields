import { useState } from 'react'
import { TifField } from './tif-react.tsx'

export const html = `
<div class="bd-stack">
  <tif-selector name="mode" label="Update mode" value="keep">
    <option value="keep">Keep</option>
    <option value="update">Update</option>
    <option value="ask">Ask each time</option>
  </tif-selector>
  <select name="size" data-tif="selector">
    <option>S</option><option selected>M</option><option>L</option><option>XL</option>
  </select>
</div>
`

// @react
export function ReactExample() {
  const [mode, setMode] = useState('keep')
  return (
    <div className="bd-stack">
      <TifField
        component="selector"
        name="mode"
        label="Update mode"
        value={mode}
        onChange={(v) => setMode(String(v))}
        options={{
          options: [
            { value: 'keep', label: 'Keep' },
            { value: 'update', label: 'Update' },
            { value: 'ask', label: 'Ask each time' },
          ],
        }}
      />
      <output>mode = {mode}</output>
    </div>
  )
}
