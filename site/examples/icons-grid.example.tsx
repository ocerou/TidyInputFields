import * as Tif from 'tidyinputfields'

export const html = `
<div id="icons" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; width: 100%"></div>
`

// @js
export function js(root: HTMLElement) {
  const grid = root.querySelector('#icons')!
  for (const name of Tif.iconNames()) {
    grid.append(Tif.h('span', { class: 'bd-row' }, Tif.icon(name), Tif.h('code', {}, name)))
  }
}
