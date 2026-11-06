// Saisie des heures : lecture et mise en forme HH:mm (repris de MyCRM, timeInput.ts).
import { pad } from './date.ts'

/** Minutes depuis minuit en HH:mm. */
export const formatTime = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`

/**
 * Lit une heure saisie : « 2 » → 02:00, « 14 » → 14:00, « 930 » → 09:30, « 1430 » → 14:30, « 14:30 », « 14h30 »,
 * « 9.5 » → 09:05. Rend HH:mm, '' pour une saisie vide, null si elle ne se lit pas.
 */
export function parseTimeInput(text: string): string | null {
  const value = text.trim()
  if (value === '') {
    return ''
  }
  let hours: number
  let minutes: number
  const parts = value.split(/[:hH.\s]+/).filter(Boolean)
  if (parts.length === 2 && parts.every((p) => /^\d{1,2}$/.test(p))) {
    ;[hours, minutes] = parts.map(Number)
  } else if (/^\d{1,4}$/.test(value)) {
    const digits = value.length <= 2 ? value.padStart(2, '0') + '00' : value.padStart(4, '0')
    hours = Number(digits.slice(0, 2))
    minutes = Number(digits.slice(2))
  } else {
    return null
  }
  return hours < 24 && minutes < 60 ? formatTime(hours * 60 + minutes) : null
}

/** Minutes depuis minuit d'une heure HH:mm (null si elle ne se lit pas). */
export const minutesOf = (time: string): number | null => (/^\d{2}:\d{2}$/.test(time) ? Number(time.slice(0, 2)) * 60 + Number(time.slice(3)) : null)
