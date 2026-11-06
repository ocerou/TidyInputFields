// Base des champs natifs (texte, nombre, zone de texte, liste, interrupteur, unité). Deux usages :
// - posé sur un champ natif (<input data-tif="text">), il l'habille sans le remplacer ;
// - posé sur un conteneur (balise <tif-text>, ou <div data-tif="text">), il crée le champ natif dedans, avec les
//   attributs tirés des options (name, value, required…), si bien que le formulaire le voit directement.
// Un champ qui porte déjà les classes de Bootstrap (.form-control, .form-select, .form-check-input) garde leur allure.
//
// Attention pour les classes filles : le constructeur de base appelle prepare() et applyOption() avant que le leur
// ne s'exécute. Ces méthodes ne doivent donc toucher ni à des membres privés # (pas encore installés : TypeError) ni
// à des champs initialisés (écrasés ensuite) : employer des méthodes ordinaires et des champs `declare`.
import { Component, type Options } from '../core/component.ts'

export type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

/** Options communes à tous les champs natifs. */
export const FIELD_DEFAULTS = {
  name: '',
  value: '',
  placeholder: '',
  required: false,
  disabled: false,
  readonly: false,
  /** Nom lu par les lecteurs d'écran (aria-label), quand aucune étiquette visible n'est liée. */
  label: '',
  /** Identifiant du champ natif créé, pour <label for="…">. */
  inputId: '',
  /** Zone discrète, sans cadre jusqu'au survol ou au focus (fiches en lecture/écriture). */
  quiet: false,
}

const BOOTSTRAP = '.form-control, .form-select, .form-check-input'

export abstract class NativeField<C extends Control = Control> extends Component {
  static override DEFAULTS: Options = { ...FIELD_DEFAULTS }
  /** Balise du champ natif. */
  static CONTROL: 'input' | 'textarea' | 'select' = 'input'

  /** Le champ natif, qui porte la valeur. */
  readonly control: C
  /** Le champ a été créé par le composant (et sera retiré par dispose). */
  readonly created: boolean
  readonly #styled: boolean
  readonly #classes: string[]

  constructor(element: HTMLElement, options: Options = {}) {
    super(element, options)
    const tag = (this.constructor as typeof NativeField).CONTROL
    let control = (element.matches(tag) ? element : element.querySelector(`:scope > ${tag}`)) as C | null
    this.created = !control
    if (!control) {
      control = document.createElement(tag) as C
      this.prepare(control)
      element.append(control)
    }
    this.control = control
    this.#styled = !control.matches(BOOTSTRAP)
    this.#classes = this.#styled ? ['tif', ...this.classes()] : []
    control.classList.add(...this.#classes)
    // Champ créé : toutes les options s'appliquent. Champ existant : seules celles qui diffèrent des valeurs par
    // défaut, pour ne pas écraser ses attributs.
    const defaults = (this.constructor as typeof NativeField).DEFAULTS
    const keys = this.created ? Object.keys(this.options) : Object.keys(this.options).filter((k) => this.options[k] !== defaults[k])
    this.applyOptions(keys)
  }

  /** Classes posées sur le champ natif (hors Bootstrap). */
  protected classes(): string[] {
    return ['tif-input']
  }

  /** Prépare un champ créé, avant de l'insérer (type, contenu). */
  protected prepare(_control: C): void {}

  /** Applique une option au champ ; rend true si elle est traitée. À compléter par les composants. */
  protected applyOption(key: string, value: unknown): boolean {
    const control = this.control
    switch (key) {
      case 'name':
        control.name = String(value ?? '')
        return true
      case 'value':
        control.value = String(value ?? '')
        return true
      case 'placeholder':
        if (!(control instanceof HTMLSelectElement)) {
          control.placeholder = String(value ?? '')
        }
        return true
      case 'required':
      case 'disabled':
        control[key] = Boolean(value)
        return true
      case 'readonly':
        if (!(control instanceof HTMLSelectElement)) {
          control.readOnly = Boolean(value)
        }
        return true
      case 'label':
        toggleAttribute(control, 'aria-label', value ? String(value) : null)
        return true
      case 'inputId':
        toggleAttribute(control, 'id', value ? String(value) : null)
        return true
      case 'quiet':
        this.quietTarget().classList.toggle('tif-quiet', Boolean(value))
        return true
      default:
        return false
    }
  }

  /** Élément qui reçoit la classe tif-quiet (le champ, ou sa zone pour un champ composé). */
  protected quietTarget(): HTMLElement {
    return this.control
  }

  protected applyOptions(keys: string[]): void {
    // La liste des choix avant la valeur, qui doit exister parmi eux.
    const ordered = [...keys].sort((a, b) => (a === 'value' ? 1 : b === 'value' ? -1 : 0))
    for (const key of ordered) {
      this.applyOption(key, this.options[key])
    }
  }

  protected override optionsChanged(keys: string[]): void {
    this.applyOptions(keys)
  }

  override get value(): unknown {
    return this.control.value
  }

  override set value(value: unknown) {
    this.control.value = String(value ?? '')
  }

  /** Donne le focus au champ. */
  focus(): void {
    this.control.focus()
  }

  override dispose(): void {
    if (this.created) {
      this.control.remove()
    } else {
      this.control.classList.remove(...this.#classes, 'tif-quiet')
    }
    super.dispose()
  }
}

/** Pose l'attribut, ou le retire si la valeur est null. */
export function toggleAttribute(element: Element, name: string, value: string | null): void {
  if (value === null) {
    element.removeAttribute(name)
  } else {
    element.setAttribute(name, value)
  }
}

/** Signale un changement de valeur fait par le composant, comme le ferait l'utilisateur (input puis change). */
export function dispatchChange(control: Element): void {
  control.dispatchEvent(new Event('input', { bubbles: true }))
  control.dispatchEvent(new Event('change', { bubbles: true }))
}
