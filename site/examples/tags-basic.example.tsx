import { useState } from 'react'
import * as Tif from 'tidyinputfields'
import { TifField } from 'tidyinputfields/react'

export const tag = `
<form class="bd-stack" id="tags-form">
  <tif-tags name="keywords" value="crm, sales" placeholder="Keywords"></tif-tags>
  <tif-tags name="skills" allow-new="false" max="3" label="Skills">
    <option value="js">JavaScript</option><option value="ts">TypeScript</option><option value="css">CSS</option>
    <option value="react">React</option><option value="vue">Vue</option><option value="sql">SQL</option>
  </tif-tags>
  <output></output>
</form>
`

export const attributes = `
<form class="bd-stack" id="tags-form">
  <input name="keywords" value="crm, sales" placeholder="Keywords" data-tif="tags">
  <input name="skills" data-tif="tags" data-tif-allow-new="false" data-tif-max="3" data-tif-label="Skills"
         data-tif-options='[{"value":"js","label":"JavaScript"},{"value":"ts","label":"TypeScript"},{"value":"css","label":"CSS"},
                            {"value":"react","label":"React"},{"value":"vue","label":"Vue"},{"value":"sql","label":"SQL"}]'>
  <output></output>
</form>
`

export const apiHtml = `
<form class="bd-stack" id="tags-form">
  <div id="keywords"></div>
  <div id="skills"></div>
  <output></output>
</form>
`

// @tag
export function tagScript(root: HTMLElement) {
  // The form receives one value per tag.
  const form = root.querySelector<HTMLFormElement>('#tags-form')!
  const show = () => (form.querySelector('output')!.textContent = JSON.stringify({ keywords: new FormData(form).getAll('keywords'), skills: new FormData(form).getAll('skills') }))
  form.addEventListener('change', show)
  show()
}

// @attributes
export function attributesScript(root: HTMLElement) {
  const form = root.querySelector<HTMLFormElement>('#tags-form')!
  const show = () => (form.querySelector('output')!.textContent = JSON.stringify({ keywords: new FormData(form).getAll('keywords'), skills: new FormData(form).getAll('skills') }))
  form.addEventListener('change', show)
  show()
}

// @api
export function api(root: HTMLElement) {
  const keywords = new Tif.TifTags(root.querySelector<HTMLElement>('#keywords')!, { name: 'keywords', value: ['crm', 'sales'], placeholder: 'Keywords' })
  const skills = new Tif.TifTags(root.querySelector<HTMLElement>('#skills')!, {
    name: 'skills',
    label: 'Skills',
    allowNew: false, // only the suggestions
    max: 3,
    options: [
      { value: 'js', label: 'JavaScript' },
      { value: 'ts', label: 'TypeScript' },
      { value: 'css', label: 'CSS' },
      { value: 'react', label: 'React' },
      { value: 'vue', label: 'Vue' },
      { value: 'sql', label: 'SQL' },
    ],
  })
  const show = () => (root.querySelector('output')!.textContent = JSON.stringify({ keywords: keywords.value, skills: skills.value }))
  root.querySelector('form')!.addEventListener('change', show)
  show()
}

// @react
export function ReactExample() {
  const [keywords, setKeywords] = useState<string[]>(['crm', 'sales'])
  return (
    <div className="bd-stack">
      <TifField component="tags" name="keywords" placeholder="Keywords" value={keywords} onChange={(v) => setKeywords(v as string[])} />
      <output>{JSON.stringify(keywords)}</output>
    </div>
  )
}
