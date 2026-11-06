// Balises <tif-…> : enveloppe fine autour d'un composant. Le composant est créé quand la balise entre dans la page et
// libéré quand elle en sort. Ses options se lisent sur les attributs sans préfixe (<tif-date min="2026-01-01">) et se
// mettent à jour quand ils changent. Pas de Shadow DOM : le composant crée ses champs natifs dans la balise, si bien que
// les formulaires, la validation et le style de la page les voient directement.
import { readOptions, type Component, type ComponentClass } from './component.ts'
import { isBrowser, kebab } from './dom.ts'

/** Élément d'une balise <tif-…>. */
export interface TifElement extends HTMLElement {
  readonly instance: Component | null
  value: unknown
}

/** Déclare la balise du composant (par défaut `tif-` + son nom). Sans effet hors navigateur ou si elle existe déjà. */
export function defineElement(type: ComponentClass, tagName = `tif-${type.NAME}`): void {
  if (!isBrowser || typeof customElements === 'undefined' || customElements.get(tagName)) {
    return
  }
  const attributes = Object.keys(type.DEFAULTS).map(kebab)

  class Element extends HTMLElement implements TifElement {
    #instance: Component | null = null

    static get observedAttributes() {
      return attributes
    }

    get instance() {
      return this.#instance
    }

    get value(): unknown {
      return this.#instance?.value
    }

    set value(value: unknown) {
      if (this.#instance) {
        this.#instance.value = value
      }
    }

    connectedCallback() {
      if (!this.#instance || this.#instance.disposed) {
        this.#instance = type.getOrCreateInstance(this, readOptions(this, type.DEFAULTS, ''))
      }
    }

    disconnectedCallback() {
      // Une balise simplement déplacée revient aussitôt : on attend la fin de la tâche pour décider.
      queueMicrotask(() => {
        if (!this.isConnected && this.#instance) {
          this.#instance.dispose()
          this.#instance = null
        }
      })
    }

    attributeChangedCallback(name: string, previous: string | null, value: string | null) {
      if (!this.#instance || previous === value) {
        return
      }
      const key = Object.keys(type.DEFAULTS).find((k) => kebab(k) === name)!
      const options = value === null ? { [key]: type.DEFAULTS[key] } : readOptions(this, { [key]: type.DEFAULTS[key] }, '')
      this.#instance.setOptions(options)
    }
  }

  customElements.define(tagName, Element)
}
