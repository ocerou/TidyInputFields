// Base des zones de date et d'heure (repris de MyCRM, InputDate / InputTime) : une saisie au clavier rapide, remise
// en forme en quittant la zone, et un bouton qui ouvre un panneau (calendrier, horloge).
//
// La zone visible affiche la valeur dans le format de la langue (« 22/11/2027 ») ; la valeur elle-même, au format ISO
// (« 2027-11-22 », « 14:30 »), vit dans un champ caché qui porte le nom du formulaire. Posé sur un champ existant
// (<input type="date" name="due" data-tif="date">), le composant en fait ce champ caché et le rend tel quel à dispose.
// Comme un champ natif, la valeur n'est transmise (input, change) qu'une fois la saisie validée : en quittant la zone,
// par Entrée ou par un choix au panneau, et seulement si elle se lit. Clavier : Alt+↓ ouvre le panneau, Échap le ferme
// (ou annule la saisie).
import { Component, type Options } from '../core/component.ts'
import { h } from '../core/dom.ts'
import { Floating } from '../core/floating.ts'
import { icon, type IconName } from '../core/icons.ts'
import { dispatchChange, toggleAttribute } from './field.ts'

export const PICKER_DEFAULTS = {
  name: '',
  value: '',
  placeholder: '',
  required: false,
  disabled: false,
  /** Nom lu par les lecteurs d'écran (aria-label), quand aucune étiquette visible n'est liée. */
  label: '',
  /** Identifiant de la zone de saisie, pour <label for="…">. */
  inputId: '',
  quiet: false,
}

export abstract class TextPicker extends Component {
  /** Champ caché qui porte la valeur ISO et le nom du formulaire. */
  readonly holder: HTMLInputElement
  /** Zone de saisie visible. */
  readonly input: HTMLInputElement
  /** Cadre de la zone (saisie + bouton). */
  readonly zone: HTMLSpanElement
  /** Bouton qui ouvre le panneau. */
  readonly button: HTMLButtonElement
  /** Contenu du panneau, reconstruit à chaque affichage. */
  readonly panel: HTMLDivElement
  readonly floating: Floating
  readonly #native: { type: string; id: string; required: boolean } | null
  readonly #listeners = new AbortController()

  constructor(element: HTMLElement, options: Options = {}) {
    super(element, options)
    const native = element instanceof HTMLInputElement ? element : null
    this.#native = native ? { type: native.type, id: native.id, required: native.required } : null
    this.holder = native ?? h('input', { type: 'hidden' })
    if (native) {
      if (!this.options.value && native.value) {
        this.options.value = native.value
      }
      native.type = 'hidden'
    }
    this.input = h('input', { type: 'text', class: 'tif-picker-input', autocomplete: 'off', inputmode: 'numeric', spellcheck: 'false' })
    this.button = h(
      'button',
      { type: 'button', class: 'tif-picker-button', tabindex: '-1', 'aria-haspopup': 'dialog', 'aria-expanded': 'false' },
      icon(this.iconName()),
    )
    this.zone = h('span', { class: `tif tif-field tif-picker ${this.zoneClass()}` }, this.input, this.button)
    if (native) {
      // L'étiquette <label for> de la page vise désormais la zone visible.
      if (native.id) {
        this.input.id = native.id
        native.removeAttribute('id')
      }
      native.after(this.zone)
    } else {
      element.append(this.holder, this.zone)
    }
    this.panel = h('div', { role: 'dialog', class: `tif-picker-panel ${this.zoneClass()}-panel` })
    this.floating = new Floating(this.zone, this.panel, {
      returnFocus: this.input,
      onClose: () => {
        this.button.setAttribute('aria-expanded', 'false')
        this.emit('hidden')
      },
    })
    this.#listen()
    const defaults = (this.constructor as typeof TextPicker).DEFAULTS
    const keys = native ? Object.keys(this.options).filter((k) => this.options[k] !== defaults[k]) : Object.keys(this.options)
    this.applyOptions([...new Set([...keys, 'placeholder'])])
    if (native?.required) {
      this.input.required = true
    }
    this.input.value = this.format(this.holder.value)
  }

  // --- À définir par chaque zone (sans état propre : appelées pendant la construction) ---

  /** Lit une saisie : la valeur ISO, '' pour une zone vide, null si elle ne se lit pas. */
  protected abstract parse(text: string): string | null
  /** Valeur ISO affichée dans la zone. */
  protected abstract format(value: string): string
  /** Gabarit affiché dans la zone vide. */
  protected abstract defaultPlaceholder(): string
  protected abstract iconName(): IconName
  /** Classe propre à la zone (« tif-date », « tif-time »). */
  protected abstract zoneClass(): string
  /** Libellé du bouton d'ouverture. */
  protected abstract openLabel(): string
  /** Construit le contenu du panneau pour la valeur `value`. */
  protected abstract renderPanel(value: string): void

  /** Touche propre à la zone (↑ ↓ de l'heure) ; rend true si elle est traitée. */
  protected keydown(_event: KeyboardEvent): boolean {
    return false
  }

  /** Le panneau va s'ouvrir : remise à zéro de son état (niveau du calendrier…). */
  protected resetPanel(_value: string): void {}

  // --- Comportement commun ---

  #listen(): void {
    const signal = this.#listeners.signal
    this.input.addEventListener(
      'blur',
      (event) => {
        // Le focus reste dans la zone ou part dans le panneau : la saisie continue.
        if (this.floating.owns(event.relatedTarget as Node | null)) {
          return
        }
        this.close()
        this.validate()
      },
      { signal },
    )
    this.input.addEventListener('keydown', (event) => this.#keydown(event), { signal })
    this.button.addEventListener('mousedown', (event) => event.preventDefault(), { signal })
    this.button.addEventListener(
      'click',
      () => {
        this.input.focus()
        if (this.floating.isOpen) {
          this.close()
        } else {
          this.open()
        }
      },
      { signal },
    )
    // Un clic dans le panneau ne retire pas le focus de la zone.
    this.panel.addEventListener('mousedown', (event) => {
      if (!(event.target instanceof HTMLInputElement)) {
        event.preventDefault()
      }
    }, { signal })
  }

  #keydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' && event.altKey) {
      event.preventDefault()
      this.open()
      return
    }
    if (this.keydown(event)) {
      return
    }
    if (event.key === 'Enter') {
      // Pas de preventDefault : la date validée part avec le formulaire si Entrée l'envoie.
      this.validate()
      return
    }
    if (event.key === 'Escape' && !this.floating.isOpen) {
      this.input.value = this.format(this.holder.value)
    }
  }

  /** Valeur ISO, '' si la zone est vide. */
  override get value(): string {
    return this.holder.value
  }

  override set value(value: unknown) {
    const parsed = value == null || value === '' ? '' : this.parse(String(value))
    this.holder.value = parsed ?? ''
    this.input.value = this.format(this.holder.value)
    if (this.floating.isOpen) {
      this.renderPanel(this.holder.value)
    }
  }

  /** Valide la saisie : la valeur lue est transmise si elle change (une saisie illisible garde la valeur d'avant). */
  validate(): boolean {
    const next = this.parse(this.input.value) ?? this.holder.value
    return this.commit(next)
  }

  /** Enregistre une valeur et prévient le formulaire si elle change. */
  protected commit(next: string): boolean {
    this.input.value = this.format(next)
    if (next === this.holder.value) {
      return false
    }
    this.holder.value = next
    dispatchChange(this.holder)
    return true
  }

  /** Choix fait au panneau : enregistré, et le panneau se ferme sauf `keepOpen`. */
  protected choose(next: string, keepOpen = false): void {
    this.commit(next)
    if (keepOpen) {
      this.renderPanel(next)
    } else {
      this.close()
      this.input.focus()
    }
  }

  /** Valeur montrée au panneau : la saisie en cours si elle se lit, sinon la valeur enregistrée. */
  protected panelValue(): string {
    return this.parse(this.input.value) || this.holder.value
  }

  /** Ouvre le panneau (sans effet si la zone est désactivée ou si un écouteur annule show.tif.x). */
  open(): void {
    if (this.input.disabled || this.input.readOnly || this.floating.isOpen || !this.emit('show', undefined, true)) {
      return
    }
    const value = this.panelValue()
    this.resetPanel(value)
    this.renderPanel(value)
    this.floating.open()
    this.button.setAttribute('aria-expanded', 'true')
    this.emit('shown')
  }

  close(): void {
    this.floating.close('api')
  }

  /** Remet le panneau à sa place après un changement de contenu. */
  protected reposition(): void {
    this.floating.position()
  }

  protected override optionsChanged(keys: string[]): void {
    this.applyOptions(keys)
  }

  protected applyOptions(keys: string[]): void {
    const o = this.options
    for (const key of keys) {
      switch (key) {
        case 'name':
          this.holder.name = String(o.name ?? '')
          break
        case 'value':
          this.value = o.value
          break
        case 'placeholder':
          this.input.placeholder = String(o.placeholder || this.defaultPlaceholder())
          break
        case 'required':
          this.input.required = Boolean(o.required) || Boolean(this.#native?.required)
          break
        case 'disabled':
          this.input.disabled = Boolean(o.disabled)
          this.button.hidden = Boolean(o.disabled)
          this.holder.disabled = Boolean(o.disabled)
          if (o.disabled) {
            this.close()
          }
          break
        case 'label':
          toggleAttribute(this.input, 'aria-label', o.label ? String(o.label) : null)
          break
        case 'inputId':
          if (o.inputId) {
            this.input.id = String(o.inputId)
          }
          break
        case 'quiet':
          this.zone.classList.toggle('tif-quiet', Boolean(o.quiet))
          break
        default:
          this.applyOption(key, o[key])
      }
    }
    const label = this.openLabel()
    this.button.title = label
    this.button.setAttribute('aria-label', label)
  }

  /** Option propre à la zone. */
  protected applyOption(_key: string, _value: unknown): void {}

  protected override localeChanged(): void {
    this.applyOptions(['placeholder'])
    // Depuis la valeur enregistrée : relire le texte affiché dans l'ordre de la nouvelle langue inverserait jour et mois.
    this.input.value = this.format(this.holder.value)
    if (this.floating.isOpen) {
      this.renderPanel(this.panelValue())
    }
  }

  /** Donne le focus à la zone de saisie. */
  focus(): void {
    this.input.focus()
  }

  override dispose(): void {
    this.#listeners.abort()
    this.floating.dispose()
    this.zone.remove()
    if (this.#native) {
      this.holder.type = this.#native.type
      if (this.#native.id) {
        this.holder.id = this.#native.id
      }
    } else {
      this.holder.remove()
    }
    super.dispose()
  }
}

/** Bouton du panneau (en-tête, pied, cases). */
export function panelButton(label: string | Node, attrs: Record<string, string | boolean | undefined> = {}, onClick?: () => void): HTMLButtonElement {
  const button = h('button', { type: 'button', ...attrs }, label)
  if (onClick) {
    button.addEventListener('click', onClick)
  }
  return button
}
