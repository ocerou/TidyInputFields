import { useState } from 'react'
import * as Tif from 'tidyinputfields'
import { TifField } from 'tidyinputfields/react'

export const html = `
<div class="bd-stack" style="width: 100%">
  <tif-select id="size-control" label="Control"></tif-select>
  <div id="size-preview" class="bd-sizes"></div>
</div>
`

// @shared
/** The size classes, smallest first; '' is the default size. */
const sizes = ['xxs', 'xs', 'sm', '', 'lg', 'xl', 'xxl']

/** Every input of the library, as written in a page. */
const fields: Record<string, string> = {
  text: '<tif-text value="Ada Lovelace"></tif-text>',
  number: '<tif-number value="42"></tif-number>',
  textarea: '<tif-textarea rows="2" value="Two lines of text"></tif-textarea>',
  select: '<tif-select value="fr"><option value="fr">France</option><option value="it">Italy</option></tif-select>',
  switch: '<tif-switch checked></tif-switch>',
  unit: '<tif-unit unit="months" value="12"></tif-unit>',
  selector: '<tif-selector value="keep"><option value="keep">Keep</option><option value="update">Update</option></tif-selector>',
  date: '<tif-date value="2026-11-06"></tif-date>',
  time: '<tif-time value="14:30"></tif-time>',
  'date-time': '<tif-date-time value="2026-11-20T09:00"></tif-date-time>',
  period: '<tif-period value=\'{"operator":"period","unit":"month","from":0,"to":0}\'></tif-period>',
  'search-select': '<tif-search-select value="ada"><option value="ada">Ada Lovelace</option><option value="alan">Alan Turing</option></tif-search-select>',
  'multi-select': '<tif-multi-select label="All types" value=\'["client"]\'><option value="prospect">Prospect</option><option value="client">Client</option></tif-multi-select>',
  lookup: '<tif-lookup placeholder="Search an account"></tif-lookup>',
  'sortable-list': '<tif-sortable-list reorderable><li data-key="a">example.com</li><li data-key="b">example.org</li></tif-sortable-list>',
  'color-picker': '<tif-color-picker value="#062B6F"></tif-color-picker>',
  tags: '<tif-tags value="crm, sales"></tif-tags>',
  range: '<tif-range value="40" unit="%"></tif-range>',
  rating: '<tif-rating value="3"></tif-rating>',
  money: '<tif-money value="1234.5"></tif-money>',
  file: '<tif-file></tif-file>',
  'rich-text': '<tif-rich-text><p>Some <strong>rich</strong> text.</p></tif-rich-text>',
}

// @js
export function js(root: HTMLElement) {
  const control = Tif.TifSelect.getInstance(root.querySelector('#size-control'))!
  control.setOptions({ options: Object.keys(fields).map((name) => ({ value: name, label: name })), value: 'date' })
  const preview = root.querySelector<HTMLElement>('#size-preview')!

  // The chosen control, once per size: the size class is set on the element around it.
  const show = () => {
    Tif.dispose(preview)
    preview.innerHTML = sizes
      .map((size) => `<div class="bd-size-row"><code>${size ? `.tif-${size}` : 'default'}</code><div class="${size ? `tif-${size}` : ''}">${fields[String(control.value)]}</div></div>`)
      .join('')
  }
  root.querySelector('#size-control')!.addEventListener('change', show)
  show()
}

// @react
// Same object at each render: the options of the list are set once.
const controls = { options: Object.keys(fields).map((name) => ({ value: name, label: name })) }

export function ReactExample() {
  const [control, setControl] = useState('date')
  return (
    <div className="bd-stack" style={{ width: '100%' }}>
      <TifField component="select" label="Control" value={control} options={controls} onChange={(v) => setControl(String(v))} />
      <div className="bd-sizes">
        {sizes.map((size) => (
          <div className="bd-size-row" key={`${control}-${size}`}>
            <code>{size ? `.tif-${size}` : 'default'}</code>
            {/* The tags create their component themselves once in the page. */}
            <div className={size ? `tif-${size}` : ''} dangerouslySetInnerHTML={{ __html: fields[control] }} />
          </div>
        ))}
      </div>
    </div>
  )
}
