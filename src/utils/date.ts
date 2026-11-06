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

/**
 * Gabarit de saisie dans l'ordre et avec le séparateur de la langue : « jj/mm/aaaa » en français, « mm/dd/yyyy » en
 * américain, « tt.mm.jjjj » en allemand. `letters` donne les lettres de chaque partie.
 */
export function datePattern(letters: Record<'d' | 'm' | 'y', string>, locale = getLocale()): string {
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
    .formatToParts(Date.UTC(2027, 10, 22))
    .map((p) => (p.type === 'day' ? letters.d : p.type === 'month' ? letters.m : p.type === 'year' ? letters.y : p.value))
    .join('')
}

// Pays où la semaine commence le dimanche (repli quand le navigateur ne donne pas Intl.Locale#getWeekInfo).
const SUNDAY_FIRST = new Set(['US', 'CA', 'MX', 'BR', 'JP', 'KR', 'TW', 'HK', 'IL', 'IN', 'PH', 'ZA', 'AU', 'SA', 'PE', 'CO', 'VE', 'GT', 'HN', 'NI', 'PA', 'PR', 'DO', 'SV', 'BO', 'PY', 'TH', 'ID', 'KE', 'NP', 'PK', 'ZW'])
// Langues dont le pays par défaut commence la semaine le dimanche (« en » seul se lit en-US).
const SUNDAY_LANGUAGES = new Set(['en', 'ja', 'ko', 'he', 'hi', 'pt-BR', 'zh-TW'])

/** Premier jour de la semaine dans la langue : 1 lundi … 7 dimanche. */
export function firstDayOfWeek(locale = getLocale()): number {
  try {
    const info = new Intl.Locale(locale) as Intl.Locale & { getWeekInfo?: () => { firstDay: number }; weekInfo?: { firstDay: number } }
    const week = info.getWeekInfo?.() ?? info.weekInfo
    if (week?.firstDay) {
      return week.firstDay
    }
    const region = info.region ?? info.maximize().region
    if (region) {
      return SUNDAY_FIRST.has(region) ? 7 : 1
    }
  } catch {
    // Langue illisible : lundi.
  }
  return SUNDAY_LANGUAGES.has(locale) ? 7 : 1
}

/** Les 42 jours (six semaines) affichés pour un mois, semaine commençant au jour `firstDay` (1 lundi … 7 dimanche). */
export function monthCells(y: number, m: number, firstDay = 1): DateParts[] {
  // getUTCDay : 0 dimanche … 6 samedi ; décalage du 1er du mois par rapport au premier jour de la semaine.
  const shift = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() - (firstDay % 7) + 7) % 7
  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(Date.UTC(y, m - 1, 1 - shift + i))
    return { y: date.getUTCFullYear(), m: date.getUTCMonth() + 1, d: date.getUTCDate() }
  })
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
