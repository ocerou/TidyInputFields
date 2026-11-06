// Registre des composants : chaque composant enregistré devient utilisable des trois façons — data-tif="nom", balise
// <tif-nom> et plugin jQuery.
import type { ComponentClass } from './component.ts'
import { defineElement } from './element.ts'
import { defineJQueryPlugin } from './jquery.ts'

const components = new Map<string, ComponentClass>()

/** Enregistre un composant (une seule fois par nom) et déclare sa balise et son plugin jQuery. */
export function register(type: ComponentClass): void {
  if (components.has(type.NAME)) {
    return
  }
  components.set(type.NAME, type)
  defineElement(type)
  defineJQueryPlugin(type)
}

/** Composant enregistré sous ce nom. */
export const componentOf = (name: string): ComponentClass | undefined => components.get(name)

/** Noms des composants enregistrés. */
export const registeredNames = (): string[] => [...components.keys()]
