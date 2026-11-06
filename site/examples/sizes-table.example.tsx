import { TifField } from 'tidyinputfields/react'

/** Every input of the library, written once: the table repeats each one in the three sizes. */
const fields: [string, string][] = [
  ['text', '<tif-text value="Ada Lovelace"></tif-text>'],
  ['number', '<tif-number value="42"></tif-number>'],
  ['textarea', '<tif-textarea rows="2" value="Two lines of text"></tif-textarea>'],
  ['select', '<tif-select value="fr"><option value="fr">France</option><option value="it">Italy</option></tif-select>'],
  ['switch', '<tif-switch checked></tif-switch>'],
  ['unit', '<tif-unit unit="months" value="12"></tif-unit>'],
  ['selector', '<tif-selector value="keep"><option value="keep">Keep</option><option value="update">Update</option></tif-selector>'],
  ['date', '<tif-date value="2026-11-06"></tif-date>'],
  ['time', '<tif-time value="14:30"></tif-time>'],
  ['date-time', '<tif-date-time value="2026-11-20T09:00"></tif-date-time>'],
  ['period', '<tif-period value=\'{"operator":"period","unit":"month","from":0,"to":0}\'></tif-period>'],
  ['search-select', '<tif-search-select value="ada"><option value="ada">Ada Lovelace</option><option value="alan">Alan Turing</option></tif-search-select>'],
  ['multi-select', '<tif-multi-select label="All types" value=\'["client"]\'><option value="prospect">Prospect</option><option value="client">Client</option></tif-multi-select>'],
  ['lookup', '<tif-lookup placeholder="Search an account"></tif-lookup>'],
  ['sortable-list', '<tif-sortable-list reorderable><li data-key="a">example.com</li><li data-key="b">example.org</li></tif-sortable-list>'],
  ['color-picker', '<tif-color-picker value="#062B6F"></tif-color-picker>'],
  ['tags', '<tif-tags value="crm, sales"></tif-tags>'],
  ['range', '<tif-range value="40" unit="%"></tif-range>'],
  ['rating', '<tif-rating value="3"></tif-rating>'],
  ['money', '<tif-money value="1234.5"></tif-money>'],
  ['file', '<tif-file></tif-file>'],
  ['rich-text', '<tif-rich-text><p>Some <strong>rich</strong> text.</p></tif-rich-text>'],
]

// The size class is set on the cell: it applies to every field inside, and to the field itself when set on its tag.
export const html = `
<div class="bd-table bd-sizes">
  <table>
    <thead><tr><th></th><th><code>.tif-sm</code></th><th>—</th><th><code>.tif-lg</code></th></tr></thead>
    <tbody>
${fields.map(([name, field]) => `      <tr><th><code>${name}</code></th><td class="tif-sm">${field}</td><td>${field}</td><td class="tif-lg">${field}</td></tr>`).join('\n')}
    </tbody>
  </table>
</div>
`

// @react
export function ReactExample() {
  return (
    <div className="bd-stack">
      <div className="tif-sm">
        <TifField component="date" value="2026-11-06" />
      </div>
      <TifField component="date" value="2026-11-06" />
      <TifField component="date" value="2026-11-06" className="tif-lg" />
    </div>
  )
}
