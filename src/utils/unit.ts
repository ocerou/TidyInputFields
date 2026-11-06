// Unités des zones de nombre : libellé, accordé au nombre saisi (repris de MyCRM, unit.ts).

/** Unité d'une zone : un texte, ou une fonction du nombre saisi pour l'accorder (« 1 jour », « 3 jours »). */
export type Unit = string | ((value: number | null) => string)

/** Nombre lu dans une saisie (virgule acceptée), null si elle est vide ou illisible. */
export function numberOf(value: unknown): number | null {
  const text = String(value ?? '')
    .trim()
    .replace(',', '.')
  return text === '' || Number.isNaN(Number(text)) ? null : Number(text)
}

/** Libellé de l'unité pour une valeur. */
export function unitLabel(unit: Unit, value: unknown): string {
  return typeof unit === 'function' ? unit(numberOf(value)) : unit
}
