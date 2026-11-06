import { TifField } from './tif-react.tsx'

export const html = `
<tif-unit name="duration" unit="months" value="12"></tif-unit>
`

// @react
export function ReactExample() {
  return <TifField component="unit" name="duration" unit="months" value="12" />
}
