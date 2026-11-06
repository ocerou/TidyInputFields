// Périodes de dates (repris de MyCRM, datePeriod.ts, sans la partie propre aux vues de MyCRM). Les libellés traduits
// viendront avec le composant period.

/** Unité d'une période relative. */
export type PeriodUnit = 'month' | 'quarter' | 'year'

/**
 * Période : passée (avant aujourd'hui), relative (de `from` à `to` unités autour de l'unité en cours : 0 le mois en
 * cours, 1 le suivant — elle suit le calendrier), ou entre deux jours fixes (ISO, compris).
 */
export type DatePeriod =
  | { operator: 'past' }
  | { operator: 'period'; unit: PeriodUnit; from: number; to: number }
  | { operator: 'between'; from: string; to: string }

/**
 * Décalages proposés (premier, dernier) autour de l'unité en cours : mois et trimestres de l'année précédente à
 * l'année suivante, années de A-10 à A+1.
 */
export function periodOffsets(unit: PeriodUnit, today = new Date()): [number, number] {
  if (unit === 'year') {
    return [-10, 1]
  }
  const index = unit === 'month' ? today.getMonth() : Math.floor(today.getMonth() / 3)
  const perYear = unit === 'month' ? 12 : 4
  return [-(perYear + index), 2 * perYear - 1 - index]
}

/** Raccourcis : période relative et clé de son libellé. */
export const PERIOD_SHORTCUTS: { key: 'thisMonth' | 'nextMonth' | 'nextThreeMonths' | 'thisYear'; period: DatePeriod }[] = [
  { key: 'thisMonth', period: { operator: 'period', unit: 'month', from: 0, to: 0 } },
  { key: 'nextMonth', period: { operator: 'period', unit: 'month', from: 1, to: 1 } },
  { key: 'nextThreeMonths', period: { operator: 'period', unit: 'month', from: 0, to: 2 } },
  { key: 'thisYear', period: { operator: 'period', unit: 'year', from: 0, to: 0 } },
]

const MONTHS: Record<PeriodUnit, number> = { month: 1, quarter: 3, year: 12 }

const isoOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Premier jour de l'unité décalée de `offset` par rapport à celle de `today`. */
export function unitStart(unit: PeriodUnit, offset: number, today = new Date()): Date {
  const size = MONTHS[unit]
  return new Date(today.getFullYear(), Math.floor(today.getMonth() / size) * size + offset * size, 1)
}

/** Bornes (ISO, comprises) d'une période à la date d'aujourd'hui ; `from` absent : sans borne basse. */
export function periodRange(p: DatePeriod, today = new Date()): { from?: string; to: string } {
  if (p.operator === 'between') {
    return { from: p.from, to: p.to }
  }
  if (p.operator === 'past') {
    return { to: isoOf(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)) }
  }
  const start = unitStart(p.unit, p.from, today)
  const after = unitStart(p.unit, p.to + 1, today)
  return { from: isoOf(start), to: isoOf(new Date(after.getFullYear(), after.getMonth(), 0)) }
}

/** Nom d'une unité décalée : « octobre 2026 », « T3 2025 » (selon `quarter`), « 2027 ». */
export function unitName(unit: PeriodUnit, offset: number, locale: string, quarter: (q: number, year: number) => string, today = new Date()): string {
  const start = unitStart(unit, offset, today)
  if (unit === 'year') {
    return String(start.getFullYear())
  }
  return unit === 'quarter'
    ? quarter(start.getMonth() / 3 + 1, start.getFullYear())
    : new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(start)
}

/** Les deux périodes sont la même (pour reconnaître un raccourci). */
export const samePeriod = (a: DatePeriod | null, b: DatePeriod | null) => JSON.stringify(a) === JSON.stringify(b)
