// Petits outils DOM. Aucun innerHTML : tout est construit nœud par nœud, ce qui reste compatible avec une politique de
// sécurité stricte (CSP, Trusted Types).

/** On est dans un navigateur (et pas dans un rendu côté serveur). */
export const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined'

type AttrValue = string | number | boolean | null | undefined
type Child = Node | string | number | null | undefined | false

/**
 * Crée un élément : `class` pour la classe, `on…` avec une fonction pour un écouteur, `true` pour un attribut sans
 * valeur, `false` / null / undefined pour l'omettre.
 */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, AttrValue | EventListener> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag)
  for (const [name, value] of Object.entries(attrs)) {
    if (typeof value === 'function') {
      element.addEventListener(name.slice(2).toLowerCase(), value)
    } else if (value === true) {
      element.setAttribute(name, '')
    } else if (value !== false && value != null) {
      element.setAttribute(name === 'className' ? 'class' : name, String(value))
    }
  }
  append(element, ...children)
  return element
}

/** Ajoute des enfants en ignorant les valeurs vides. */
export function append(parent: Node & ParentNode, ...children: Child[]): void {
  for (const child of children) {
    if (child != null && child !== false) {
      parent.append(typeof child === 'number' ? String(child) : child)
    }
  }
}

let counter = 0
/** Identifiant unique dans la page, pour relier libellés, listes et champs (aria-controls, aria-labelledby…). */
export const uid = (prefix = 'tif') => `${prefix}-${++counter}`

/** « searchSelect » → « search-select ». */
export const kebab = (text: string) => text.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
/** « search-select » → « searchSelect ». */
export const camel = (text: string) => text.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())

/** Lance `fn` quand le document est prêt (tout de suite s'il l'est déjà). */
export function onReady(fn: () => void): void {
  if (!isBrowser) {
    return
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, { once: true })
  } else {
    queueMicrotask(fn)
  }
}

/** La page est écrite de droite à gauche à l'endroit de l'élément. */
export const isRtl = (element: Element) => getComputedStyle(element).direction === 'rtl'
