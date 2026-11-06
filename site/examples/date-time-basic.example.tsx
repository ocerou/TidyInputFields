import { useState } from 'react'
import { TifField } from './tif-react.tsx'

export const html = `
<div class="bd-stack">
  <tif-date-time name="meeting" value="2026-11-20T09:00"></tif-date-time>
  <tif-date-time name="call" value="2026-11-20T15:30" time-zone="America/New_York" default-time-zone="Europe/Paris"></tif-date-time>
</div>
`

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
