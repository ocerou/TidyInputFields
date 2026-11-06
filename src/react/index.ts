// tidyinputfields/react : enveloppe React de la librairie. React est une dépendance facultative (peerDependency) :
// la librairie elle-même n'en dépend pas ; seul ce point d'entrée l'importe.
//
// TifField rend la balise <tif-…>, garde sa valeur synchronisée et appelle onChange avec la nouvelle valeur. Les
// propriétés texte, nombre et booléen deviennent des attributs ; les tableaux, objets et fonctions (options, source…)
// passent par `options`, appliqué avec setOptions(). useTif habille un champ rendu par React.
import { createElement, useEffect, useLayoutEffect, useRef, type CSSProperties, type RefObject } from 'react'
import type { Component, ComponentClass, Options } from 'tidyinputfields'
import 'tidyinputfields'

/** Noms des composants, pour la propriété `component`. */
export type TifComponentName =
  | 'text'
  | 'number'
  | 'textarea'
  | 'select'
  | 'switch'
  | 'unit'
  | 'selector'
  | 'date'
  | 'time'
  | 'date-time'
  | 'period'
  | 'search-select'
  | 'multi-select'
  | 'lookup'
  | 'sortable-list'
  | 'color-picker'

type TifTag = HTMLElement & { instance: Component | null; value: unknown }

export type TifFieldProps = {
  /** Composant : 'date', 'search-select', 'sortable-list'… */
  component: TifComponentName
  /** Valeur contrôlée (undefined : champ non contrôlé). */
  value?: unknown
  /** Appelé avec la nouvelle valeur après chaque changement fait par l'utilisateur. */
  onChange?: (value: unknown) => void
  /** Options qui ne sont pas du texte : tableaux, objets, fonctions. */
  options?: Options
  className?: string
  style?: CSSProperties
  /** Tout autre attribut : name, required, placeholder, label, input-id… */
  [attribute: string]: unknown
}

/** Un composant de TidyInputFields en React, par sa balise <tif-…>. */
export function TifField({ component, value, onChange, options, ...attributes }: TifFieldProps) {
  const ref = useRef<TifTag>(null)
  const latest = useRef(onChange)
  useEffect(() => {
    latest.current = onChange
  })

  // Options non textuelles : appliquées une fois le composant créé par la balise, puis à chaque changement.
  useEffect(() => {
    if (options) {
      ref.current?.instance?.setOptions(options)
    }
  }, [options])

  // Valeur contrôlée : transmise au composant quand elle diffère.
  useEffect(() => {
    const tag = ref.current
    if (tag && value !== undefined && JSON.stringify(tag.value) !== JSON.stringify(value)) {
      tag.value = value
    }
  }, [value])

  // L'événement change natif remonte depuis le champ contenu dans la balise.
  useEffect(() => {
    const tag = ref.current
    if (!tag) {
      return
    }
    const listener = () => latest.current?.(tag.value)
    tag.addEventListener('change', listener)
    return () => tag.removeEventListener('change', listener)
  }, [])

  return createElement(`tif-${component}`, { ref, ...attributes })
}

/**
 * Habille un champ rendu par React (`<input ref={ref}>`) avec un composant, et le rend à React avant qu'il ne le
 * retire : useLayoutEffect, car certains composants placent le champ dans leur propre cadre. Rend l'instance (null
 * avant le premier rendu).
 */
export function useTif<T extends Component>(type: ComponentClass<T>, ref: RefObject<HTMLElement | null>, options: Options = {}): RefObject<T | null> {
  const instance = useRef<T | null>(null)
  useLayoutEffect(() => {
    if (!ref.current) {
      return
    }
    const created = new type(ref.current, options)
    instance.current = created
    return () => {
      created.dispose()
      instance.current = null
    }
    // Les options initiales seulement : les suivantes passent par instance.current.setOptions().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, ref])
  return instance
}
