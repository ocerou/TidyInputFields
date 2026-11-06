// Couleurs (repris de MyCRM, InputColorPicker et ColorPanel) : lecture d'une saisie, valeur enregistrée
// « #RRGGBB » ou « #RRGGBBAA », passage en teinte / saturation / luminosité pour le panneau.

/** Couleur décomposée : la teinte « #RRGGBB » et l'opacité, de 0 (transparent) à 255 (opaque). */
export type Color = { rgb: string; alpha: number }
/** Couleur en teinte (0-360), saturation et luminosité (0-100), opacité de 0 à 255. */
export type Hsla = { h: number; s: number; l: number; alpha: number }

const HEX = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const RGB = /^(?:rgba?\s*\(\s*)?(\d{1,3})\s*[,;\s]\s*(\d{1,3})\s*[,;\s]\s*(\d{1,3})(?:\s*[,;/\s]\s*(\d*[.,]?\d+)(%?))?\s*\)?$/i

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))
export const hex2 = (n: number) => Math.round(n).toString(16).padStart(2, '0').toUpperCase()

/**
 * Lit une couleur saisie : hexadécimal (« #062B6F », « #062B6F80 », « 062b6f », « #06f ») ou RGB (« rgb(6, 43, 111) »,
 * « 6, 43, 111 », « rgba(6, 43, 111, 0.5) », « 6 43 111 50% »). Rend la couleur, l'opacité valant null quand la saisie
 * n'en donne pas ; null pour une saisie vide, undefined pour une saisie illisible.
 */
export function parseColor(text: string): { rgb: string; alpha: number | null } | null | undefined {
  const value = text.trim()
  if (value === '') {
    return null
  }
  const hex = HEX.exec(value)
  if (hex) {
    const digits = hex[1].length <= 4 ? [...hex[1]].map((c) => c + c).join('') : hex[1]
    return { rgb: `#${digits.slice(0, 6).toUpperCase()}`, alpha: digits.length === 8 ? Number.parseInt(digits.slice(6), 16) : null }
  }
  const rgb = RGB.exec(value)
  if (!rgb) {
    return undefined
  }
  const channels = rgb.slice(1, 4).map(Number)
  if (channels.some((c) => c > 255)) {
    return undefined
  }
  let alpha: number | null = null
  if (rgb[4] !== undefined) {
    const n = Number(rgb[4].replace(',', '.'))
    const fraction = rgb[5] ? n / 100 : n
    if (fraction > 1) {
      return undefined
    }
    alpha = Math.round(fraction * 255)
  }
  return { rgb: `#${channels.map(hex2).join('')}`, alpha }
}

/** Couleur enregistrée décomposée ; null si absente ou illisible. */
export function splitColor(value: string | null | undefined): Color | null {
  const parsed = parseColor(value ?? '')
  return parsed ? { rgb: parsed.rgb, alpha: parsed.alpha ?? 255 } : null
}

/** Valeur à enregistrer : « #RRGGBB » quand la couleur est opaque, « #RRGGBBAA » sinon. */
export function composeColor(color: Color): string {
  return color.alpha >= 255 ? color.rgb : `${color.rgb}${hex2(color.alpha)}`
}

/** Transparence en %, de 0 (opaque) à 100 (transparent). */
export const transparencyOf = (alpha: number) => Math.round(100 - (alpha / 255) * 100)

export function rgbToHsl(rgb: string): { h: number; s: number; l: number } {
  const n = Number.parseInt(rgb.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => c / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) {
    return { h: 0, s: 0, l: l * 100 }
  }
  const s = d / (1 - Math.abs(2 * l - 1))
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return { h: (h * 60 + 360) % 360, s: s * 100, l: l * 100 }
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sat = s / 100
  const light = l / 100
  const k = (n: number) => (n + h / 30) % 12
  const a = sat * Math.min(light, 1 - light)
  const f = (n: number) => light - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
  return [f(0) * 255, f(8) * 255, f(4) * 255]
}

/** « #RRGGBB » d'une couleur en teinte / saturation / luminosité. */
export const hslaToHex = (c: Hsla) => `#${hslToRgb(c.h, c.s, c.l).map(hex2).join('')}`
