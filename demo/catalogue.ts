// Catalogue : une section par brique de la librairie, construite avec la librairie elle-même. Il sert aussi de
// documentation et de terrain pour les tests de bout en bout.
import * as Tif from '../src/index.ts'

const { h } = Tif
const app = document.getElementById('app')!
const withBootstrap = app.hasAttribute('data-bootstrap')
const root = document.documentElement

function section(title: string, intro: string, ...content: (Node | string)[]) {
  return h('section', {}, h('h2', {}, title), h('p', {}, intro), ...content)
}

// En-tête : thème, langue, autre page.
const theme = h(
  'select',
  { 'aria-label': 'Theme', id: 'theme' },
  h('option', { value: '' }, 'System theme'),
  h('option', { value: 'light' }, 'Light'),
  h('option', { value: 'dark' }, 'Dark'),
)
theme.addEventListener('change', () => {
  const attribute = withBootstrap ? 'data-bs-theme' : 'data-tif-theme'
  if (theme.value) {
    root.setAttribute(attribute, theme.value)
  } else if (withBootstrap) {
    root.setAttribute(attribute, matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  } else {
    root.removeAttribute(attribute)
  }
})

const language = h('select', { 'aria-label': 'Language', id: 'language' }, ...['en', 'fr', 'de', 'es', 'it'].map((l) => h('option', { value: l }, l.toUpperCase())))
language.addEventListener('change', () => {
  root.lang = language.value
  Tif.setLocale(language.value)
})

app.append(
  h(
    'header',
    {},
    h('h1', {}, 'TidyInputFields'),
    h('span', { id: 'version' }, Tif.version),
    h('span', { class: 'spacer' }),
    theme,
    language,
    h('a', { href: withBootstrap ? './' : './bootstrap.html' }, withBootstrap ? 'Without Bootstrap' : 'With Bootstrap'),
  ),
)

// Allure des champs.
const field = (label: string, extra = '', attrs: Record<string, string | boolean> = {}) =>
  h('label', { class: `tif ${extra}` }, h('span', { class: 'tif-field' }, h('input', { type: 'text', placeholder: label, ...attrs })))

app.append(
  section(
    'Field look',
    'Shared look of every field: focus ring, invalid and missing states, sizes. Components build on it.',
    h(
      'div',
      { class: 'row-demo' },
      field('Normal'),
      field('Invalid', 'is-invalid'),
      field('Missing', 'tif-missing'),
      field('Disabled', '', { disabled: true }),
      field('Small', 'tif-sm'),
      field('Large', 'tif-lg'),
    ),
  ),
)

// Icônes.
app.append(
  section(
    'Icons',
    'Bootstrap Icons (MIT), outlined, copied into the library at build time. Replace them with Tif.setIcons().',
    h('div', { class: 'icons tif' }, ...Tif.iconNames().map((name) => h('div', {}, Tif.icon(name), h('code', {}, name)))),
  ),
)

// Confirmation.
const confirmResult = h('output', { id: 'confirm-result' })
const ask = (danger: boolean) => async (event: Event) => {
  const ok = await Tif.confirm({
    title: danger ? 'Remove this item?' : 'Apply the changes?',
    message: danger ? 'It will be removed from the list.' : 'The new values will be saved.',
    danger,
    anchor: event.currentTarget as Element,
  })
  confirmResult.textContent = ok ? 'Confirmed' : 'Cancelled'
}
const askButton = () => h('button', { type: 'button', class: 'tif-btn', 'data-demo': 'confirm', onClick: ask(false) }, 'Ask')
const askDangerButton = () => h('button', { type: 'button', class: 'tif-btn', 'data-demo': 'confirm-danger', onClick: ask(true) }, 'Ask (danger)')

app.append(
  section(
    'Confirmation',
    'Native <dialog>: Enter or the button confirms, Escape cancels. Inside a Bootstrap modal it stays inside.',
    h('div', { class: 'row-demo tif' }, askButton(), askDangerButton(), confirmResult),
  ),
)

// Panneau flottant.
const panelResult = h('output', { id: 'panel-result' })
function panelButton(label: string) {
  const button = h('button', { type: 'button', class: 'tif-btn', 'aria-expanded': 'false', 'data-demo': 'panel' }, label, Tif.icon('chevronDown'))
  const panel = h('div', { class: 'demo-panel', role: 'dialog', 'aria-label': 'Demo panel' }, h('p', {}, 'A floating panel. Click outside, scroll the page or press Escape to close it.'))
  const floating = new Tif.Floating(button, panel, {
    matchWidth: true,
    onClose: (reason) => {
      button.setAttribute('aria-expanded', 'false')
      panelResult.textContent = `Closed: ${reason}`
    },
  })
  button.addEventListener('click', () => {
    if (floating.isOpen) {
      floating.close()
    } else {
      floating.open()
      button.setAttribute('aria-expanded', 'true')
      panelResult.textContent = 'Open'
    }
  })
  return button
}

app.append(
  section(
    'Floating panel',
    'Placed below the field, or above when there is no room; kept inside the window; closed by an outside click, page scroll or Escape.',
    h('div', { class: 'row-demo tif' }, panelButton('Open a panel'), panelResult),
  ),
)

// Traductions.
const keys = ['common.ok', 'common.cancel', 'common.close', 'common.confirm', 'common.clear']
const translations = h('tbody')
function renderTranslations() {
  translations.replaceChildren(...keys.map((key) => h('tr', {}, h('td', {}, h('code', {}, key)), h('td', {}, Tif.t(key)))))
}
renderTranslations()
Tif.onLocaleChange(renderTranslations)

app.append(
  section(
    'Translations',
    'Built-in dictionaries (en, fr, de, es, it). Plug any translation library with Tif.setTranslator().',
    h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'Key'), h('th', {}, 'Text'))), translations),
  ),
)

// Champs simples, dans un vrai formulaire : ce qu'il enverrait s'affiche à côté.
const fieldsForm = document.createElement('form')
fieldsForm.id = 'fields-form'
fieldsForm.className = 'demo-form'
// Démo seulement : le catalogue écrit son HTML d'exemple tel qu'un utilisateur l'écrirait dans sa page.
fieldsForm.innerHTML = `
  <label for="f-title">Text — <code>&lt;tif-text&gt;</code></label>
  <tif-text name="title" input-id="f-title" placeholder="Title" required></tif-text>
  <label for="f-email">E-mail — <code>data-tif="text"</code></label>
  <input id="f-email" name="email" data-tif="text" data-tif-type="email" placeholder="name@example.com">
  <label for="f-quantity">Number — <code>&lt;tif-number&gt;</code></label>
  <tif-number name="quantity" input-id="f-quantity" min="0" step="1" value="3"></tif-number>
  <label for="f-notes">Text area — <code>&lt;tif-textarea&gt;</code></label>
  <tif-textarea name="notes" input-id="f-notes" rows="3" placeholder="Notes"></tif-textarea>
  <label for="f-country">Select — <code>&lt;tif-select&gt;</code></label>
  <tif-select name="country" input-id="f-country" placeholder="Choose a country">
    <option value="fr">France</option><option value="de">Germany</option><option value="it">Italy</option>
  </tif-select>
  <label for="f-active">Switch — <code>&lt;tif-switch&gt;</code></label>
  <tif-switch name="active" input-id="f-active" checked></tif-switch>
  <label for="f-duration">Unit, agreed — <code>new TifUnit()</code></label>
  <div id="f-duration-host"></div>
  <label for="f-price">Unit, right — <code>&lt;tif-unit&gt;</code></label>
  <tif-unit name="price" input-id="f-price" unit="€" align="right" value="1250"></tif-unit>
  <span id="f-mode-label">Selector — <code>&lt;tif-selector&gt;</code></span>
  <tif-selector name="mode" label="Mode" value="keep">
    <option value="keep">Keep</option><option value="update">Update</option><option value="ask">Ask</option>
  </tif-selector>
  <label for="f-size">Selector — <code>&lt;select data-tif&gt;</code></label>
  <select id="f-size" name="size" data-tif="selector"><option>S</option><option selected>M</option><option>L</option><option>XL</option></select>
`
Tif.init(fieldsForm)
const duration = new Tif.TifUnit(fieldsForm.querySelector<HTMLElement>('#f-duration-host')!, {
  name: 'duration',
  inputId: 'f-duration',
  value: '12',
  unit: (n: number | null) => (n === 1 ? 'month' : 'months'),
})
const sent = h('pre', { id: 'form-data', class: 'demo-sent' })
const showSent = () => {
  sent.textContent = JSON.stringify(Object.fromEntries(new FormData(fieldsForm)), null, 2)
}
fieldsForm.addEventListener('input', showSent)
fieldsForm.addEventListener('change', showSent)
showSent()

const quiet = h('input', { id: 'quiet-fields', 'data-tif': 'switch' })
Tif.init(h('div', {}, quiet))
quiet.addEventListener('change', () => {
  for (const element of fieldsForm.querySelectorAll<HTMLElement>('tif-text, tif-number, tif-textarea, tif-select, tif-unit, [data-tif="text"]')) {
    const instance = (element as HTMLElement & { instance?: Tif.Component }).instance ?? Tif.TifText.getInstance(element)
    instance?.setOptions({ quiet: quiet.checked })
  }
  duration.setOptions({ quiet: quiet.checked })
})

app.append(
  section(
    'Simple fields',
    'Native fields, dressed. Use a tag, a data-tif attribute on an existing field, or the JavaScript API. The form sends their values as usual.',
    h('div', { class: 'demo-columns' }, fieldsForm, h('div', {}, h('label', { class: 'demo-inline' }, quiet, ' Quiet fields'), sent)),
  ),
)
// Les balises créent leurs champs en entrant dans la page.
showSent()

// Dates et heures, dans un formulaire : il reçoit les valeurs ISO, la zone montre le format de la langue.
const datesForm = document.createElement('form')
datesForm.id = 'dates-form'
datesForm.className = 'demo-form'
datesForm.innerHTML = `
  <label for="d-due">Date — <code>&lt;tif-date&gt;</code></label>
  <tif-date name="due" input-id="d-due" required></tif-date>
  <label for="d-start">Date — <code>&lt;input type="date" data-tif&gt;</code></label>
  <input type="date" id="d-start" name="start" value="2026-11-06" data-tif="date">
  <label for="d-at">Time — <code>&lt;tif-time&gt;</code></label>
  <tif-time name="at" input-id="d-at" value="14:30"></tif-time>
  <label for="d-meeting">Date and time — <code>&lt;tif-date-time&gt;</code></label>
  <tif-date-time name="meeting" input-id="d-meeting" value="2026-11-20T09:00" time-zone="America/New_York"></tif-date-time>
  <span>Period — <code>&lt;tif-period&gt;</code></span>
  <tif-period name="signature" field="Signature" all-label="All signatures" id="d-signature"></tif-period>
  <span>Period, relative only</span>
  <tif-period name="window" all-label="Any time" relative-only value='{"operator":"period","unit":"quarter","from":0,"to":0}'></tif-period>
`
Tif.init(datesForm)
const datesSent = h('pre', { id: 'dates-data', class: 'demo-sent' })
const showDates = () => {
  datesSent.textContent = JSON.stringify(Object.fromEntries(new FormData(datesForm)), null, 2)
}
datesForm.addEventListener('input', showDates)
datesForm.addEventListener('change', showDates)
datesForm.addEventListener('submit', (event) => event.preventDefault())

app.append(
  section(
    'Dates and times',
    'Quick typing ("1/1/27", "15", "1430", "14h30"), a calendar that zooms out to months and years, a clock, and relative periods. Alt+↓ opens a panel.',
    h('div', { class: 'demo-columns' }, datesForm, datesSent),
  ),
)
showDates()

// Modale Bootstrap : panneau et confirmation à l'intérieur.
if (withBootstrap) {
  const modal = h(
    'div',
    { class: 'modal fade', id: 'demo-modal', tabindex: '-1', 'aria-labelledby': 'demo-modal-title', 'aria-hidden': 'true' },
    h(
      'div',
      { class: 'modal-dialog' },
      h(
        'div',
        { class: 'modal-content' },
        h('div', { class: 'modal-header' }, h('h2', { class: 'modal-title fs-5', id: 'demo-modal-title' }, 'Bootstrap modal'), h('button', { type: 'button', class: 'btn-close', 'data-bs-dismiss': 'modal', 'aria-label': 'Close' })),
        h('div', { class: 'modal-body' }, h('div', { class: 'row-demo tif' }, panelButton('Panel in the modal'), askDangerButton())),
      ),
    ),
  )
  app.append(
    section(
      'Inside a Bootstrap modal',
      "Panels and confirmations hang inside the modal, so Bootstrap's focus trap keeps working; Escape closes them, not the modal.",
      h('button', { type: 'button', class: 'btn btn-primary', 'data-bs-toggle': 'modal', 'data-bs-target': '#demo-modal', 'data-demo': 'open-modal' }, 'Open the modal'),
    ),
    modal,
  )
}
