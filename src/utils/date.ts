// Saisie rapide d'une date au clavier et son affichage (repris de MyCRM, dateInput.ts).
import { getLocale } from '../i18n/i18n.ts'

export type DateParts = { y: number; m: number; d: number }

export const pad = (n: number) => String(n).padStart(2, '0')
export const iso = ({ y, m, d }: DateParts) => `${y}-${pad(m)}-${pad(d)}`
export const daysIn = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate()
export const todayParts = (now = new Date()): DateParts => ({ y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() })
export const partsOf = (value: string): DateParts | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return m ? { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) } : null
}

/** Ordre du jour, du mois et de l'année dans la langue (« jj/mm/aaaa » en français, « mm/dd/yyyy » en américain…). */
export function dateOrder(locale = getLocale()): ('d' | 'm' | 'y')[] {
  return new Intl.DateTimeFormat(locale)
    .formatToParts(Date.UTC(2027, 10, 22))
    .flatMap((p) => (p.type === 'day' ? ['d' as const] : p.type === 'month' ? ['m' as const] : p.type === 'year' ? ['y' as const] : []))
}

/** Date affichée dans la zone : jour et mois sur deux chiffres, année sur quatre, dans l'ordre de la langue. */
export function formatDateInput(value: string, locale = getLocale()): string {
  const p = partsOf(value)
  if (!p) {
    return ''
  }
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(Date.UTC(p.y, p.m - 1, p.d))
}

/**
 * Date saisie au clavier, rendue au format AAAA-MM-JJ (null si elle ne se lit pas, '' si la zone est vide). Accepte les
 * saisies rapides, dans l'ordre de la langue : « 1/1/27 », « 1.1.2027 », « 1-1 » (année en cours), « 15 » (mois en
 * cours), « 010127 » ou « 01012027 » (chiffres collés), et l'ISO « 2027-01-01 ». Une année sur deux chiffres tombe entre
 * 1970 et 2069.
 */
export function parseDateInput(text: string, locale = getLocale(), now = new Date()): string | null {
  const t = text.trim()
  if (!t) {
    return ''
  }
  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t)
  let numbers: number[]
  let order = dateOrder(locale)
  if (isoMatch) {
    numbers = isoMatch.slice(1).map(Number)
    order = ['y', 'm', 'd']
  } else if (/^\d{6}$|^\d{8}$/.test(t)) {
    numbers = [t.slice(0, 2), t.slice(2, 4), t.slice(4)].map(Number)
  } else if (/^\d{1,4}([/.\-\s]+\d{1,4}){0,2}$/.test(t)) {
    numbers = t.split(/[/.\-\s]+/).map(Number)
  } else {
    return null
  }
  const today = todayParts(now)
  const values: Partial<DateParts> = {}
  // Saisie incomplète : deux nombres, jour et mois dans l'ordre de la langue (année en cours) ; un seul, le jour (mois en cours).
  const used = numbers.length === 3 ? order : numbers.length === 2 ? order.filter((k) => k !== 'y') : ['d' as const]
  used.forEach((k, i) => (values[k] = numbers[i]))
  const y = values.y ?? today.y
  const year = y < 100 ? (y < 70 ? 2000 + y : 1900 + y) : y
  const m = values.m ?? today.m
  const d = values.d ?? today.d
  if (year < 1000 || year > 9999 || m < 1 || m > 12 || d < 1 || d > daysIn(year, m)) {
    return null
  }
  return iso({ y: year, m, d })
}
