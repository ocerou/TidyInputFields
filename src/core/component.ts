// Classe de base des composants, sur le modèle des plugins de Bootstrap 5 : une instance par élément et par composant,
// retrouvée par getInstance, créée au besoin par getOrCreateInstance, libérée par dispose. Les options viennent, par
// priorité croissante, des valeurs par défaut, des attributs data-tif-* puis des options passées en JavaScript.
import { onLocaleChange } from '../i18n/i18n.ts'
import { kebab } from './dom.ts'

export type Options = Record<string, unknown>

const instances = new WeakMap<Element, Map<string, Component>>()

/** Lit une valeur d'attribut selon le type de la valeur par défaut (ou devine : booléen, nombre, JSON, texte). */
export function coerce(value: string, fallback: unknown): unknown {
  if (typeof fallback === 'boolean') {
    // Attribut présent : vrai (« disabled », « disabled="" », « disabled="true" »), sauf « false ».
    return value !== 'false'
  }
  if (typeof fallback === 'number') {
    const n = Number(value)
    return value.trim() === '' || Number.isNaN(n) ? fallback : n
  }
  if (typeof fallback === 'string') {
    return value
  }
  if (value === 'true' || value === 'false') {
    return value === 'true'
  }
  if (value === 'null') {
    return null
  }
  if (value.trim() !== '' && !Number.isNaN(Number(value))) {
    return Number(value)
  }
  if (/^\s*[[{]/.test(value)) {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }
  return value
}

/** Options lues sur les attributs de l'élément : `data-tif-` + nom en kebab (ou sans préfixe pour les balises <tif-…>). */
export function readOptions(element: Element, defaults: Options, prefix = 'data-tif-'): Options {
  const options: Options = {}
  for (const key of Object.keys(defaults)) {
    const attribute = prefix + kebab(key)
    if (element.hasAttribute(attribute)) {
      options[key] = coerce(element.getAttribute(attribute) ?? '', defaults[key])
    }
  }
  return options
}

export abstract class Component {
  /** Nom du composant, en kebab : « date », « search-select ». Sert à data-tif, aux événements et aux balises. */
  static NAME = 'component'
  /** Options et leurs valeurs par défaut ; seules ces clés se lisent dans les attributs. */
  static DEFAULTS: Options = {}

  readonly element: HTMLElement
  options: Options
  #disposed = false
  #offLocale: () => void

  constructor(element: HTMLElement, options: Options = {}) {
    const type = this.constructor as typeof Component
    const existing = instances.get(element)?.get(type.NAME)
    existing?.dispose()
    this.element = element
    this.options = { ...type.DEFAULTS, ...readOptions(element, type.DEFAULTS), ...options }
    if (!instances.has(element)) {
      instances.set(element, new Map())
    }
    instances.get(element)!.set(type.NAME, this)
    this.#offLocale = onLocaleChange(() => this.localeChanged())
  }

  /** Instance de ce composant sur l'élément (ou le sélecteur), null s'il n'y en a pas. */
  static getInstance<T extends Component>(this: { NAME: string; prototype: T }, element: Element | string | null): T | null {
    const target = typeof element === 'string' ? document.querySelector(element) : element
    return (target && (instances.get(target)?.get(this.NAME) as T | undefined)) ?? null
  }

  /** Instance de ce composant sur l'élément, créée avec `options` s'il n'y en a pas encore. */
  static getOrCreateInstance<T extends Component>(
    this: { NAME: string; prototype: T; new (element: HTMLElement, options?: Options): T },
    element: HTMLElement,
    options: Options = {},
  ): T {
    return (instances.get(element)?.get(this.NAME) as T | undefined) ?? new this(element, options)
  }

  get name(): string {
    return (this.constructor as typeof Component).NAME
  }

  get disposed(): boolean {
    return this.#disposed
  }

  /** Valeur du composant ; chaque composant la définit. */
  get value(): unknown {
    return undefined
  }

  set value(_value: unknown) {}

  /** Change des options après coup. */
  setOptions(options: Options): void {
    Object.assign(this.options, options)
    this.optionsChanged(Object.keys(options))
  }

  /**
   * Émet `type.tif.nom` sur l'élément (ex. `show.tif.date`), qui remonte le DOM. Rend false si un écouteur l'a annulé
   * (preventDefault), quand `cancelable` est vrai.
   */
  protected emit(type: string, detail?: unknown, cancelable = false): boolean {
    const event = new CustomEvent(`${type}.tif.${this.name}`, { bubbles: true, cancelable, detail })
    return this.element.dispatchEvent(event)
  }

  /** Les options ont changé (setOptions, attribut d'une balise) : à redéfinir pour mettre l'affichage à jour. */
  protected optionsChanged(_keys: string[]): void {}

  /** La langue ou les traductions ont changé : à redéfinir pour retraduire l'affichage. */
  protected localeChanged(): void {}

  /** Libère le composant : écouteurs, panneaux, éléments créés. Les composants appellent super.dispose() à la fin. */
  dispose(): void {
    if (this.#disposed) {
      return
    }
    this.#disposed = true
    this.#offLocale()
    const map = instances.get(this.element)
    if (map?.get(this.name) === this) {
      map.delete(this.name)
    }
  }
}

/** Un composant concret (une classe fille de Component, avec son NAME). */
export type ComponentClass<T extends Component = Component> = {
  new (element: HTMLElement, options?: Options): T
  NAME: string
  DEFAULTS: Options
  getInstance(element: Element | string | null): T | null
  getOrCreateInstance(element: HTMLElement, options?: Options): T
}

/** Toutes les instances posées sur un élément. */
export const instancesOf = (element: Element): Component[] => [...(instances.get(element)?.values() ?? [])]
