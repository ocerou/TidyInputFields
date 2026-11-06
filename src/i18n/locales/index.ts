// Dictionnaires intégrés, par langue : clés à plat, séparées par des points. Les variables s'écrivent {{nom}} et les
// pluriels avec les suffixes _one / _other…, comme dans i18next, pour que les mêmes fichiers servent aux deux.
import { de } from './de.ts'
import { en } from './en.ts'
import { es } from './es.ts'
import { fr } from './fr.ts'
import { it } from './it.ts'

export const locales: Record<string, Record<string, string>> = { en, fr, de, es, it }
