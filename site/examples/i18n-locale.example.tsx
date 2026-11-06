import * as Tif from 'tidyinputfields'
import { TifField } from 'tidyinputfields/react'

export const html = `
<div class="bd-stack">
  <div class="bd-row" id="languages">
    <button type="button" class="tif-btn" data-locale="en-US">en-US</button>
    <button type="button" class="tif-btn" data-locale="fr">fr</button>
    <button type="button" class="tif-btn" data-locale="de">de</button>
    <button type="button" class="tif-btn" data-locale="es">es</button>
    <button type="button" class="tif-btn" data-locale="it">it</button>
  </div>
  <div class="bd-row">
    <tif-date name="due" value="2027-03-15"></tif-date>
    <tif-period name="signed" value='{"operator":"period","unit":"quarter","from":0,"to":0}'></tif-period>
  </div>
</div>
`

// @js
export function js(root: HTMLElement) {
  root.querySelector('#languages')!.addEventListener('click', (event) => {
    const locale = (event.target as HTMLElement).dataset.locale
    if (locale) {
      // Every component on the page follows, including open panels.
      Tif.setLocale(locale)
    }
  })
}

// @react
export function ReactExample() {
  return (
    <div className="bd-stack">
      <div className="bd-row">
        {['en-US', 'fr', 'de', 'es', 'it'].map((locale) => (
          <button key={locale} type="button" className="tif-btn" onClick={() => Tif.setLocale(locale)}>
            {locale}
          </button>
        ))}
      </div>
      <div className="bd-row">
        <TifField component="date" name="due" value="2027-03-15" />
        <TifField component="period" name="signed" options={{ value: { operator: 'period', unit: 'quarter', from: 0, to: 0 } }} />
      </div>
    </div>
  )
}
