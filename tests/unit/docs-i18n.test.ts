import { writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { dictionaries, docStrings } from '../../site/src/i18n.ts'
import { pages } from '../../site/src/pages/index.ts'

// Traductions du site de documentation : chaque texte des pages a sa traduction dans chaque langue, et les
// dictionnaires ne gardent pas de texte disparu. DOC_STRINGS_OUT=fichier.json écrit la liste des textes à traduire.
const strings = docStrings(pages)
if (process.env.DOC_STRINGS_OUT) {
  writeFileSync(process.env.DOC_STRINGS_OUT, JSON.stringify(strings, null, 2))
}

/** Balises et code d'un texte : ils doivent se retrouver tels quels dans la traduction. */
const markup = (text: string) => [...text.matchAll(/<code>[\s\S]*?<\/code>|<\/?[a-z][^>]*>|\{\{\w+\}\}/g)].map((m) => m[0]).sort()

describe('documentation translations', () => {
  for (const [locale, dictionary] of Object.entries(dictionaries)) {
    it(`${locale}: every text is translated, with its code and tags`, () => {
      expect(strings.filter((s) => !(s in dictionary))).toEqual([])
      expect(strings.filter((s) => JSON.stringify(markup(dictionary[s])) !== JSON.stringify(markup(s)))).toEqual([])
    })

    it(`${locale}: no text left from an older version`, () => {
      expect(Object.keys(dictionary).filter((s) => !strings.includes(s))).toEqual([])
    })
  }
})
