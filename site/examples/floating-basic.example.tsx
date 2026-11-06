import * as Tif from 'tidyinputfields'

export const html = `
<button type="button" class="tif-btn" id="help" aria-expanded="false">Help</button>
`

// @js
export function js(root: HTMLElement) {
  const button = root.querySelector<HTMLButtonElement>('#help')!
  const panel = Tif.h('div', { style: 'width: 240px; padding: 8px 10px' }, 'Any content: placed below, or above when there is no room, closed by an outside click, a page scroll or Escape.')
  const floating = new Tif.Floating(button, panel, {
    placement: 'bottom-start',
    onClose: () => button.setAttribute('aria-expanded', 'false'),
  })
  button.addEventListener('click', () => {
    if (floating.isOpen) {
      floating.close()
    } else {
      floating.open()
      button.setAttribute('aria-expanded', 'true')
    }
  })
}
