// Sous-chemin tidyinputfields/rich-text : l'éditeur de texte riche, à part de la librairie principale (qui reste sans
// dépendance) parce qu'il embarque Tiptap. Il s'importe après la librairie et s'enregistre comme les autres composants :
// data-tif="rich-text", balise <tif-rich-text> et plugin jQuery.
import './rich-text.css'
import { addTranslations, init, register } from 'tidyinputfields'
import { TifRichText } from './editor.ts'
import { richTextLocales } from './locales.ts'

for (const [locale, entries] of Object.entries(richTextLocales)) {
  addTranslations(locale, entries)
}
register(TifRichText)
// Les éléments data-tif="rich-text" déjà dans la page (la librairie les a vus avant que l'éditeur soit chargé).
if (typeof document !== 'undefined') {
  init(document)
}

export { TifRichText, moveBlock, type RichTextImage, type RichTextMention } from './editor.ts'
export { sanitizeHtml, cleanPastedHtml, plainText, isHtml } from './html.ts'
export { richTextLocales } from './locales.ts'
