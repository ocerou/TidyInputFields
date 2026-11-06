// Site de documentation : barre du haut, menu à gauche, une page par sujet (navigation par #/id).
import * as Tif from 'tidyinputfields'
import '../../src/styles/index.css'
import 'tidyinputfields/rich-text'
import './site.css'
import { DOC_LOCALES, docLocale, setDocLocale, tr } from './i18n.ts'
import { renderBlock, type Page } from './page.ts'
import { pages } from './pages/index.ts'

const root = document.documentElement
const app = document.getElementById('app')!

// Thème : clair, sombre ou celui du système, gardé d'une visite à l'autre.
const THEME_KEY = 'tif-docs-theme'
function applyTheme(theme: string) {
  if (theme === 'light' || theme === 'dark') {
    root.setAttribute('data-tif-theme', theme)
  } else {
    root.removeAttribute('data-tif-theme')
  }
}
let savedTheme = ''
try {
  savedTheme = localStorage.getItem(THEME_KEY) ?? ''
} catch {
  // Stockage indisponible : thème du système.
}
applyTheme(savedTheme)

const groups = [...new Set(pages.map((p) => p.group))]

function navigation(current: Page): HTMLElement {
  const nav = document.createElement('nav')
  nav.className = 'bd-sidebar'
  nav.setAttribute('aria-label', tr('Documentation'))
  for (const group of groups) {
    const title = document.createElement('div')
    title.className = 'bd-sidebar-group'
    title.textContent = tr(group)
    const list = document.createElement('ul')
    for (const page of pages.filter((p) => p.group === group)) {
      const item = document.createElement('li')
      const link = document.createElement('a')
      link.href = `#/${page.id}`
      link.textContent = tr(page.title)
      if (page === current) {
        link.setAttribute('aria-current', 'page')
      }
      item.append(link)
      list.append(item)
    }
    nav.append(title, list)
  }
  return nav
}

function header(): HTMLElement {
  const bar = document.createElement('header')
  bar.className = 'bd-navbar'
  const brand = document.createElement('a')
  brand.className = 'bd-brand'
  brand.href = '#/introduction'
  brand.innerHTML = '<span class="bd-logo">tif</span> TidyInputFields'
  const version = document.createElement('span')
  version.className = 'bd-version'
  version.textContent = `v${Tif.version}`

  const theme = document.createElement('select')
  theme.className = 'bd-control'
  theme.setAttribute('aria-label', tr('Theme'))
  for (const [value, label] of [['', 'Auto'], ['light', 'Light'], ['dark', 'Dark']]) {
    theme.append(new Option(tr(label), value, false, value === savedTheme))
  }
  theme.addEventListener('change', () => {
    applyTheme(theme.value)
    try {
      localStorage.setItem(THEME_KEY, theme.value)
    } catch {
      // Sans stockage, le choix vaut pour la visite.
    }
  })

  const language = document.createElement('select')
  language.className = 'bd-control'
  language.setAttribute('aria-label', tr('Language'))
  for (const [value, label] of DOC_LOCALES) {
    language.append(new Option(label, value, false, value === docLocale()))
  }
  // La langue vaut pour la documentation et pour les composants des exemples.
  language.addEventListener('change', () => {
    setDocLocale(language.value)
    applyLocale()
    render()
  })

  const github = document.createElement('a')
  github.className = 'bd-github'
  github.href = 'https://github.com/ocerou/TidyInputFields'
  github.textContent = 'GitHub'

  const menu = document.createElement('button')
  menu.type = 'button'
  menu.className = 'bd-menu'
  menu.textContent = tr('Menu')
  menu.addEventListener('click', () => document.body.classList.toggle('bd-menu-open'))

  const spacer = document.createElement('span')
  spacer.className = 'bd-spacer'
  bar.append(menu, brand, version, spacer, language, theme, github)
  return bar
}

function render() {
  const id = location.hash.replace(/^#\/?/, '').split('#')[0] || 'introduction'
  const page = pages.find((p) => p.id === id) ?? pages[0]
  document.title = `${tr(page.title)} · TidyInputFields`
  document.body.classList.remove('bd-menu-open')
  Tif.dispose(app)

  const main = document.createElement('main')
  main.className = 'bd-main'
  const h1 = document.createElement('h1')
  h1.textContent = tr(page.title)
  const lead = document.createElement('p')
  lead.className = 'bd-lead'
  lead.innerHTML = tr(page.lead)
  main.append(h1, lead, ...page.blocks.map(renderBlock))

  // Page précédente et suivante, comme dans la documentation de Bootstrap.
  const index = pages.indexOf(page)
  const pager = document.createElement('div')
  pager.className = 'bd-pager'
  for (const [other, label] of [[pages[index - 1], '← '], [pages[index + 1], '']] as const) {
    const link = document.createElement('a')
    if (other) {
      link.href = `#/${other.id}`
      link.textContent = label ? `${label}${tr(other.title)}` : `${tr(other.title)} →`
    }
    pager.append(link)
  }
  main.append(pager)

  const layout = document.createElement('div')
  layout.className = 'bd-layout'
  layout.append(navigation(page), main)
  app.replaceChildren(header(), layout)
  window.scrollTo(0, 0)
}

/** Langue des composants et de la page (<html lang>), comme celle de la documentation. */
function applyLocale() {
  Tif.setLocale(docLocale())
  root.lang = docLocale()
}

window.addEventListener('hashchange', render)
applyLocale()
render()
