// Langue de la documentation. Les textes sont écrits en anglais dans les pages ; chaque langue a un dictionnaire
// « texte anglais → traduction » (site/locales/xx.json). Un texte absent du dictionnaire reste en anglais. Le code des
// exemples n'est pas traduit, comme le code lui-même.
import de from '../locales/de.json'
import es from '../locales/es.json'
import fr from '../locales/fr.json'
import it from '../locales/it.json'
import type { Page } from './page.ts'

export const DOC_LOCALES: [string, string][] = [
  ['en', 'English'],
  ['fr', 'Français'],
  ['de', 'Deutsch'],
  ['es', 'Español'],
  ['it', 'Italiano'],
]

export const dictionaries: Record<string, Record<string, string>> = { fr, de, es, it }

/** Textes de l'habillage du site (barre, menu, onglets, boutons), hors pages. */
export const UI_STRINGS = [
  'Documentation',
  'Language',
  'Theme',
  'Auto',
  'Light',
  'Dark',
  'Menu',
  'Copy',
  'Copied',
  'Select and copy',
  'Tag',
  'data-tif attributes',
  'JavaScript API',
  'HTML',
  'JavaScript',
  'React',
  'Option / attribute',
  'Default',
  'Description',
]

const STORAGE_KEY = 'tif-docs-locale'

/** Langue choisie, sinon celle du navigateur si la documentation l'a, sinon l'anglais. */
function initialLocale(): string {
  const known = DOC_LOCALES.map(([code]) => code)
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && known.includes(saved)) {
      return saved
    }
  } catch {
    // Stockage indisponible : langue du navigateur.
  }
  const browser = (typeof navigator !== 'undefined' ? navigator.language : 'en').slice(0, 2).toLowerCase()
  return known.includes(browser) ? browser : 'en'
}

let locale = typeof window !== 'undefined' ? initialLocale() : 'en'

export const docLocale = () => locale

export function setDocLocale(next: string): void {
  locale = next
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // Sans stockage, le choix vaut pour la visite.
  }
}

/** Texte dans la langue de la documentation (l'anglais s'il n'est pas traduit). */
export function tr(text: string): string {
  return locale === 'en' ? text : (dictionaries[locale]?.[text] ?? text)
}

/**
 * Un texte à traduire ? Pas s'il ne reste aucune lettre une fois retirés le code (<code>…</code>) et les balises :
 * « <code>value</code> », « ← → ↑ ↓ » s'écrivent pareil dans toutes les langues.
 */
export function translatable(text: string | undefined): text is string {
  if (!text) {
    return false
  }
  const prose = text.replace(/<code>[\s\S]*?<\/code>/g, '').replace(/<[^>]+>/g, '')
  return /\p{L}{2,}/u.test(prose)
}

/** Tous les textes des pages et de l'habillage, dans l'ordre, sans doublon : ce que chaque dictionnaire doit traduire. */
export function docStrings(pages: Page[]): string[] {
  const found: string[] = [...UI_STRINGS]
  const add = (text: string | undefined) => {
    if (translatable(text)) {
      found.push(text)
    }
  }
  for (const page of pages) {
    add(page.group)
    add(page.title)
    add(page.lead)
    for (const block of page.blocks) {
      if ('example' in block) {
        add(block.title)
        add(block.text)
      } else if ('text' in block) {
        add(block.text)
      } else if ('heading' in block) {
        add(block.heading)
      } else if ('options' in block) {
        Object.values(block.descriptions).forEach(add)
      } else if ('table' in block) {
        block.columns.forEach(add)
        block.table.flat().forEach(add)
      }
    }
  }
  return [...new Set(found)]
}
