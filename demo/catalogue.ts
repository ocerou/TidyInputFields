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
