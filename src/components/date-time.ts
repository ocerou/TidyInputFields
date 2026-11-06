// Zone de date et d'heure (repris de MyCRM, InputDateTime) : la zone de date et la zone d'heure côte à côte, chacune
// avec son panneau ; le fuseau en fin de zone, seulement s'il n'est pas celui du navigateur (ou `defaultTimeZone`).
// Valeur au format AAAA-MM-JJTHH:mm (heure locale du fuseau), '' si vide ; une date sans heure prend 00:00, effacer la
// date efface tout, et l'heure reste désactivée tant qu'il n'y a pas de date.
import { Component, type Options } from '../core/component.ts'
import { h } from '../core/dom.ts'
import { t } from '../i18n/i18n.ts'
import { TifDate } from './date.ts'
import { dispatchChange } from './field.ts'
import { TifTime } from './time.ts'

const browserTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return ''
  }
}

export class TifDateTime extends Component {
  static override NAME = 'date-time'
  static override DEFAULTS: Options = {
    name: '',
    value: '',
    required: false,
    disabled: false,
    label: '',
    inputId: '',
    quiet: false,
    /** Fuseau de la valeur (« America/New_York ») ; affiché seulement s'il diffère de `defaultTimeZone`. */
    timeZone: '',
    /** Fuseau qui ne s'affiche pas ; par défaut celui du navigateur. */
    defaultTimeZone: '',
  }

  readonly holder: HTMLInputElement
  readonly zone: HTMLSpanElement
  readonly date: TifDate
  readonly time: TifTime
  readonly #addon: HTMLSpanElement
  readonly #native: { type: string; id: string } | null
  readonly #listeners = new AbortController()

  constructor(element: HTMLElement, options: Options = {}) {
    super(element, options)
    const native = element instanceof HTMLInputElement ? element : null
    this.#native = native ? { type: native.type, id: native.id } : null
    this.holder = native ?? h('input', { type: 'hidden' })
    if (native) {
      if (!this.options.value && native.value) {
        this.options.value = native.value
      }
      native.type = 'hidden'
      if (native.id && !this.options.inputId) {
        this.options.inputId = native.id
        native.removeAttribute('id')
      }
    }
    const dateHost = h('span', { class: 'tif-date-time-date' })
    const timeHost = h('span', { class: 'tif-date-time-time' })
    this.#addon = h('span', { class: 'tif-addon', hidden: true })
    this.zone = h('span', { class: 'tif tif-date-time' }, dateHost, timeHost, this.#addon)
    if (native) {
      native.after(this.zone)
    } else {
      element.append(this.holder, this.zone)
    }
    this.date = new TifDate(dateHost)
    this.time = new TifTime(timeHost)
    const signal = this.#listeners.signal
    // Les changements des deux zones restent internes : seul le champ caché de l'ensemble prévient le formulaire.
    for (const host of [dateHost, timeHost]) {
      host.addEventListener('input', (event) => event.stopPropagation(), { signal })
      host.addEventListener(
        'change',
        (event) => {
          event.stopPropagation()
          this.#changed()
        },
        { signal },
      )
    }
    this.#apply(Object.keys(this.options))
  }

  #changed(): void {
    const date = this.date.value
    const next = date ? `${date}T${this.time.value || '00:00'}` : ''
    if (!date && this.time.value) {
      this.time.value = ''
    }
    this.#syncTime()
    if (next !== this.holder.value) {
      this.holder.value = next
      dispatchChange(this.holder)
    }
  }

  #syncTime(): void {
    this.time.setOptions({ disabled: Boolean(this.options.disabled) || !this.date.value })
  }

  override get value(): string {
    return this.holder.value
  }

  override set value(value: unknown) {
    const text = value == null ? '' : String(value)
    const match = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}))?/.exec(text)
    this.date.value = match?.[1] ?? ''
    this.time.value = match ? (match[2] ?? '00:00') : ''
    this.holder.value = match ? `${match[1]}T${match[2] ?? '00:00'}` : ''
    this.#syncTime()
  }

  protected override optionsChanged(keys: string[]): void {
    this.#apply(keys)
  }

  #apply(keys: string[]): void {
    const o = this.options
    if (keys.includes('name')) {
      this.holder.name = String(o.name ?? '')
    }
    if (keys.includes('value')) {
      this.value = o.value
    }
    if (keys.some((k) => ['required', 'label', 'inputId', 'quiet', 'disabled'].includes(k))) {
      this.date.setOptions({ required: o.required, label: o.label, inputId: o.inputId, quiet: o.quiet, disabled: o.disabled })
      this.time.setOptions({ label: t('timePicker.title'), quiet: o.quiet })
      this.holder.disabled = Boolean(o.disabled)
      this.#syncTime()
    }
    if (keys.includes('timeZone') || keys.includes('defaultTimeZone')) {
      const zone = String(o.timeZone || '')
      const shown = zone && zone !== String(o.defaultTimeZone || browserTimeZone())
      this.#addon.textContent = shown ? zone : ''
      this.#addon.hidden = !shown
    }
  }

  protected override localeChanged(): void {
    this.time.setOptions({ label: t('timePicker.title') })
  }

  focus(): void {
    this.date.focus()
  }

  override dispose(): void {
    this.#listeners.abort()
    this.date.dispose()
    this.time.dispose()
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
