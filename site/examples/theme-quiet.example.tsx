import { TifField } from 'tidyinputfields/react'

export const html = `
<dl class="bd-stack" style="margin: 0">
  <div class="bd-row"><dt style="width: 90px">Name</dt><dd style="margin: 0"><tif-text name="name" value="Ada Lovelace" quiet></tif-text></dd></div>
  <div class="bd-row"><dt style="width: 90px">Duration</dt><dd style="margin: 0"><tif-unit name="duration" value="12" unit="months" quiet></tif-unit></dd></div>
  <div class="bd-row"><dt style="width: 90px">Signed</dt><dd style="margin: 0"><tif-date name="signed" value="2026-11-06" quiet></tif-date></dd></div>
</dl>
`

// @react
export function ReactExample() {
  return (
    <dl className="bd-stack" style={{ margin: 0 }}>
      <div className="bd-row">
        <dt style={{ width: 90 }}>Name</dt>
        <dd style={{ margin: 0 }}>
          <TifField component="text" name="name" value="Ada Lovelace" quiet />
        </dd>
      </div>
      <div className="bd-row">
        <dt style={{ width: 90 }}>Duration</dt>
        <dd style={{ margin: 0 }}>
          <TifField component="unit" name="duration" value="12" unit="months" quiet />
        </dd>
      </div>
      <div className="bd-row">
        <dt style={{ width: 90 }}>Signed</dt>
        <dd style={{ margin: 0 }}>
          <TifField component="date" name="signed" value="2026-11-06" quiet />
        </dd>
      </div>
    </dl>
  )
}
