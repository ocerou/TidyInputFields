// Icônes : Bootstrap Icons (licence MIT, https://icons.getbootstrap.com), au trait, copiées dans la librairie à la
// construction — aucune dépendance à l'exécution. Le SVG est reconstruit élément par élément, sans innerHTML.
import arrowDown from 'bootstrap-icons/icons/arrow-down.svg?raw'
import arrowLeft from 'bootstrap-icons/icons/arrow-left.svg?raw'
import arrowRight from 'bootstrap-icons/icons/arrow-right.svg?raw'
import arrowUp from 'bootstrap-icons/icons/arrow-up.svg?raw'
import calendar3 from 'bootstrap-icons/icons/calendar3.svg?raw'
import checkLg from 'bootstrap-icons/icons/check-lg.svg?raw'
import chevronDown from 'bootstrap-icons/icons/chevron-down.svg?raw'
import chevronLeft from 'bootstrap-icons/icons/chevron-left.svg?raw'
import chevronRight from 'bootstrap-icons/icons/chevron-right.svg?raw'
import chevronUp from 'bootstrap-icons/icons/chevron-up.svg?raw'
import clock from 'bootstrap-icons/icons/clock.svg?raw'
import cloudArrowUp from 'bootstrap-icons/icons/cloud-arrow-up.svg?raw'
import eraser from 'bootstrap-icons/icons/eraser.svg?raw'
import exclamationTriangle from 'bootstrap-icons/icons/exclamation-triangle.svg?raw'
import eyedropper from 'bootstrap-icons/icons/eyedropper.svg?raw'
import fileEarmark from 'bootstrap-icons/icons/file-earmark.svg?raw'
import gripVertical from 'bootstrap-icons/icons/grip-vertical.svg?raw'
import pencil from 'bootstrap-icons/icons/pencil.svg?raw'
import person from 'bootstrap-icons/icons/person.svg?raw'
import plusLg from 'bootstrap-icons/icons/plus-lg.svg?raw'
import search from 'bootstrap-icons/icons/search.svg?raw'
import star from 'bootstrap-icons/icons/star.svg?raw'
import starFill from 'bootstrap-icons/icons/star-fill.svg?raw'
import trash from 'bootstrap-icons/icons/trash.svg?raw'
import xLg from 'bootstrap-icons/icons/x-lg.svg?raw'

const builtin = {
  add: plusLg,
  calendar: calendar3,
  check: checkLg,
  chevronDown,
  chevronLeft,
  chevronRight,
  chevronUp,
  clear: eraser,
  clock,
  close: xLg,
  delete: trash,
  down: arrowDown,
  edit: pencil,
  eyedropper,
  file: fileEarmark,
  grip: gripVertical,
  left: arrowLeft,
  person,
  right: arrowRight,
  search,
  star,
  starFill,
  up: arrowUp,
  upload: cloudArrowUp,
  warning: exclamationTriangle,
}

export type IconName = keyof typeof builtin

let overrides: Record<string, string> = {}

/** Remplace des icônes par d'autres, données en SVG (seuls path, circle, rect, ellipse, line, polyline, polygon). */
export function setIcons(icons: Partial<Record<IconName, string>>): void {
  overrides = { ...overrides, ...(icons as Record<string, string>) }
}

const SVG = 'http://www.w3.org/2000/svg'
const SHAPES = /<(path|circle|rect|ellipse|line|polyline|polygon)\b([^>]*?)\/?>/g
const ATTRIBUTES = /([\w:-]+)\s*=\s*"([^"]*)"/g
const KEPT = new Set(['d', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'width', 'height', 'x1', 'y1', 'x2', 'y2', 'points', 'fill-rule', 'clip-rule', 'transform'])

/** Icône en SVG, à la taille et à la couleur du texte, masquée aux lecteurs d'écran. */
export function icon(name: IconName): SVGSVGElement {
  return svgIcon(overrides[name] ?? builtin[name], name)
}

/**
 * Icône construite depuis un SVG (même règle : seules les formes simples, sans innerHTML) ; sert aux modules qui ont
 * leurs propres icônes (éditeur riche).
 */
export function svgIcon(source: string, name = 'custom'): SVGSVGElement {
  const svg = document.createElementNS(SVG, 'svg')
  svg.setAttribute('viewBox', /viewBox="([^"]+)"/.exec(source)?.[1] ?? '0 0 16 16')
  svg.setAttribute('width', '1em')
  svg.setAttribute('height', '1em')
  svg.setAttribute('fill', 'currentColor')
  svg.setAttribute('class', `tif-icon tif-icon-${name}`)
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')
  for (const [, tag, attributes] of source.matchAll(SHAPES)) {
    const shape = document.createElementNS(SVG, tag)
    for (const [, attribute, value] of attributes.matchAll(ATTRIBUTES)) {
      if (KEPT.has(attribute)) {
        shape.setAttribute(attribute, value)
      }
    }
    svg.append(shape)
  }
  return svg
}

/** Noms des icônes disponibles. */
export const iconNames = () => Object.keys(builtin) as IconName[]
