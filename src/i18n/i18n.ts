// Traductions : dictionnaires intégrés, ou fonction de traduction fournie par l'application (i18next, vue-i18n,
// FormatJS…). La langue sert aussi aux formats (dates, nombres) via Intl.
import { locales as builtin } from './locales/index.ts'

export type TranslationParams = Record<string, unknown>
/** Fonction de traduction branchée : rend le texte, ou null / undefined / la clé elle-même s'il manque. */
export type Translator = (key: string, params?: TranslationParams) => string | null | undefined

const dictionaries: Record<string, Record<string, string>> = Object.fromEntries(
  Object.entries(builtin).map(([locale, entries]) => [locale, { ...entries }]),
)
let explicitLocale: string | null = null
let translator: Translator | null = null
const listeners = new Set<() => void>()

/** Langue courante : celle fixée par setLocale, sinon l'attribut lang de la page, sinon celle du navigateur, sinon l'anglais. */
export function getLocale(): string {
  if (explicitLocale) {
    return explicitLocale
  }
  if (typeof document !== 'undefined' && document.documentElement?.lang) {
    return document.documentElement.lang
  }
  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language
  }
  return 'en'
}

/** Fixe la langue (null : revenir à celle de la page) et met à jour les composants. */
export function setLocale(locale: string | null): void {
  explicitLocale = locale || null
  notify()
}

/** Branche une fonction de traduction externe (null : revenir aux dictionnaires intégrés). */
export function setTranslator(fn: Translator | null): void {
  translator = fn
  notify()
}

/** Ajoute ou remplace des traductions pour une langue ; accepte des clés à plat ou un objet imbriqué. */
export function addTranslations(locale: string, entries: Record<string, unknown>): void {
  const target = (dictionaries[locale.toLowerCase()] ??= {})
  const walk = (node: Record<string, unknown>, prefix: string) => {
    for (const [key, value] of Object.entries(node)) {
      const path = prefix ? `${prefix}.${key}` : key
      if (value && typeof value === 'object') {
        walk(value as Record<string, unknown>, path)
      } else if (value != null) {
        target[path] = String(value)
      }
    }
  }
  walk(entries, '')
  notify()
}

/** Abonnement aux changements de langue ou de traductions ; rend la fonction de désabonnement. */
export function onLocaleChange(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function notify() {
  // Copie : un écouteur peut se désabonner pendant le parcours.
  for (const listener of Array.from(listeners)) {
    listener()
  }
  if (typeof document !== 'undefined') {
    document.dispatchEvent(new CustomEvent('localechange.tif', { detail: { locale: getLocale() } }))
  }
}

/** Dictionnaires à consulter, du plus précis au repli : « fr-CA », « fr », puis l'anglais. */
function chain(locale: string): Record<string, string>[] {
  const lower = locale.toLowerCase()
  const names = [lower, lower.split('-')[0], 'en']
  return [...new Set(names)].map((name) => dictionaries[name]).filter((d): d is Record<string, string> => !!d)
}

const interpolate = (text: string, params?: TranslationParams) =>
  params ? text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (all, name: string) => (name in params ? String(params[name]) : all)) : text

/** Texte traduit d'une clé ; la clé elle-même si aucune traduction ne la connaît. */
export function t(key: string, params?: TranslationParams): string {
  if (translator) {
    const text = translator(key, params)
    if (text != null && text !== key) {
      return text
    }
  }
  const locale = getLocale()
  const keys = [key]
  if (params && typeof params.count === 'number') {
    keys.unshift(`${key}_${new Intl.PluralRules(locale).select(params.count)}`, `${key}_other`)
  }
  for (const dictionary of chain(locale)) {
    for (const k of keys) {
      if (k in dictionary) {
        return interpolate(dictionary[k], params)
      }
    }
  }
  return key
}
