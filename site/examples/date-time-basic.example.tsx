import { useState } from 'react'
import * as Tif from 'tidyinputfields'
import { TifField } from './tif-react.tsx'

export const tag = `
<div class="bd-stack">
  <tif-date-time name="meeting" value="2026-11-20T09:00"></tif-date-time>
  <tif-date-time name="call" value="2026-11-20T15:30" time-zone="America/New_York" default-time-zone="Europe/Paris"></tif-date-time>
</div>
`

export const attributes = `
<div class="bd-stack">
  <input type="datetime-local" name="meeting" value="2026-11-20T09:00" data-tif="date-time">
  <input type="datetime-local" name="call" value="2026-11-20T15:30" data-tif="date-time"
         data-tif-time-zone="America/New_York" data-tif-default-time-zone="Europe/Paris">
</div>
`

export const apiHtml = `
<div class="bd-stack">
  <div id="meeting"></div>
  <output></output>
</div>
`

// @api
export function api(root: HTMLElement) {
  const host = root.querySelector<HTMLElement>('#meeting')!
  const meeting = new Tif.TifDateTime(host, { name: 'meeting', value: '2026-11-20T09:00', timeZone: 'America/New_York', defaultTimeZone: 'Europe/Paris' })
  host.addEventListener('change', () => (root.querySelector('output')!.textContent = `meeting = "${meeting.value}"`))
}

// @react
export function ReactExample() {
  const [meeting, setMeeting] = useState('2026-11-20T09:00')
  return (
    <div className="bd-stack">
      <TifField component="date-time" name="meeting" value={meeting} onChange={(v) => setMeeting(String(v))} />
      <output>meeting = "{meeting}"</output>
    </div>
  )
}
