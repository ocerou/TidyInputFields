import { TifField } from 'tidyinputfields/react'

export const html = `
<dl class="bd-stack" style="margin: 0">
  <div class="bd-row"><dt style="width: 90px">Name</dt><dd style="margin: 0"><tif-text name="name" value="Ada Lovelace" quiet></tif-text></dd></div>
  <div class="bd-row"><dt style="width: 90px">Duration</dt><dd style="margin: 0"><tif-unit name="duration" value="12" unit="months" quiet></tif-unit></dd></div>
  <div class="bd-row"><dt style="width: 90px">Seats</dt><dd style="margin: 0"><tif-number name="seats" value="25" quiet></tif-number></dd></div>
  <div class="bd-row"><dt style="width: 90px">Signed</dt><dd style="margin: 0"><tif-date name="signed" value="2026-11-06" quiet></tif-date></dd></div>
  <div class="bd-row"><dt style="width: 90px">Call at</dt><dd style="margin: 0"><tif-time name="call" value="14:30" quiet></tif-time></dd></div>
  <div class="bd-row"><dt style="width: 90px">Country</dt><dd style="margin: 0">
    <tif-select name="country" value="fr" quiet><option value="fr">France</option><option value="de">Germany</option><option value="it">Italy</option></tif-select>
  </dd></div>
  <div class="bd-row"><dt style="width: 90px">Owner</dt><dd style="margin: 0">
    <tif-search-select name="owner" value="ada" quiet><option value="ada">Ada Lovelace</option><option value="alan">Alan Turing</option><option value="grace">Grace Hopper</option></tif-search-select>
  </dd></div>
</dl>
`

// @react
const rows: [string, string, Record<string, unknown>][] = [
  ['Name', 'text', { name: 'name', value: 'Ada Lovelace' }],
  ['Duration', 'unit', { name: 'duration', value: '12', unit: 'months' }],
  ['Seats', 'number', { name: 'seats', value: '25' }],
  ['Signed', 'date', { name: 'signed', value: '2026-11-06' }],
  ['Call at', 'time', { name: 'call', value: '14:30' }],
  ['Country', 'select', { name: 'country', value: 'fr', options: { options: [{ value: 'fr', label: 'France' }, { value: 'de', label: 'Germany' }] } }],
  ['Owner', 'search-select', { name: 'owner', value: 'ada', options: { options: [{ value: 'ada', label: 'Ada Lovelace' }, { value: 'alan', label: 'Alan Turing' }] } }],
]

export function ReactExample() {
  return (
    <dl className="bd-stack" style={{ margin: 0 }}>
      {rows.map(([label, component, attributes]) => (
        <div className="bd-row" key={label}>
          <dt style={{ width: 90 }}>{label}</dt>
          <dd style={{ margin: 0 }}>
            <TifField component={component as 'text'} {...attributes} quiet />
          </dd>
        </div>
      ))}
    </dl>
  )
}
