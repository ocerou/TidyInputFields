// Écrit les dictionnaires intégrés en JSON (dist/locales/xx.json), imbriqués comme i18next les attend, pour qu'on
// puisse les charger dans une librairie de traduction comme espace de noms « tif ».
import { mkdirSync, writeFileSync } from 'node:fs'

mkdirSync('dist/locales', { recursive: true })
let locales: Record<string, Record<string, string>> = {}
try {
  locales = (await import('../src/i18n/locales/index.ts')).locales
} catch {
  // Pas encore de dictionnaires.
}
for (const [locale, flat] of Object.entries(locales)) {
  const nested: Record<string, unknown> = {}
  for (const [key, text] of Object.entries(flat)) {
    const path = key.split('.')
    let node = nested
    for (const part of path.slice(0, -1)) {
      node = (node[part] ??= {}) as Record<string, unknown>
    }
    node[path[path.length - 1]] = text
  }
  writeFileSync(`dist/locales/${locale}.json`, JSON.stringify(nested, null, 2) + '\n')
}
