import { TifField } from 'tidyinputfields/react'

export const html = `
<div class="bd-row">
  <tif-selector name="a" value="b"><option value="a">Default</option><option value="b">Theme</option></tif-selector>
  <div style="--tif-accent: #b4235a; --tif-focus-ring: rgb(180 35 90 / 0.2); --tif-radius: 999px">
    <tif-selector name="b" value="b"><option value="a">Rounded</option><option value="b">Pink</option></tif-selector>
  </div>
  <div data-tif-theme="dark" style="padding: 10px; background: #12161a; border-radius: 8px">
    <tif-date name="c" value="2027-01-15"></tif-date>
  </div>
</div>
`

// @react
export function ReactExample() {
  return (
    <div className="bd-row">
      <TifField component="selector" name="a" value="b" options={{ options: [{ value: 'a', label: 'Default' }, { value: 'b', label: 'Theme' }] }} />
      <div style={{ '--tif-accent': '#b4235a', '--tif-focus-ring': 'rgb(180 35 90 / 0.2)', '--tif-radius': '999px' } as React.CSSProperties}>
        <TifField component="selector" name="b" value="b" options={{ options: [{ value: 'a', label: 'Rounded' }, { value: 'b', label: 'Pink' }] }} />
      </div>
      <div data-tif-theme="dark" style={{ padding: 10, background: '#12161a', borderRadius: 8 }}>
        <TifField component="date" name="c" value="2027-01-15" />
      </div>
    </div>
  )
}
