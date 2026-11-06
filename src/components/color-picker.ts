// Sélecteur de couleur (repris de MyCRM, InputColorPicker et ColorPanel). Une seule zone, qui montre la couleur
// (aperçu sur damier), son code hexadécimal et sa transparence en % ; un clic (ou Entrée, Espace, flèche bas) ouvre le
// panneau, sur le modèle de la boîte « Couleurs » de PowerPoint : gamme complète (teinte de gauche à droite,
// saturation de haut en bas), intensité à droite, transparence, Rouge / Vert / Bleu / Hex, aperçu de la nouvelle
// couleur à côté de l'actuelle, pipette (navigateurs qui la proposent). La coche applique, la gomme retire la couleur,
// la croix ou Échap referme sans rien changer. Au clavier, le curseur est d'emblée dans « Rouge » ; Tab passe de zone
// en zone et boucle dans le panneau ; Entrée applique.
//
// Valeur : « #RRGGBB » (opaque), « #RRGGBBAA », ou '' sans couleur, dans un champ caché (ou le champ habillé).
import { Component, type Options } from '../core/component.ts'
import { h } from '../core/dom.ts'
import { Floating } from '../core/floating.ts'
import { icon } from '../core/icons.ts'
import { t } from '../i18n/i18n.ts'
import { clamp, composeColor, hex2, hslaToHex, hslToRgb, rgbToHsl, splitColor, transparencyOf, type Hsla } from '../utils/color.ts'
import { dispatchChange, toggleAttribute } from './field.ts'

/** Pipette du navigateur (Chrome, Edge) : prend une couleur n'importe où à l'écran. */
type EyeDropperApi = { open: () => Promise<{ sRGBHex: string }> }
const eyeDropper = () => (typeof window === 'undefined' ? undefined : (window as unknown as { EyeDropper?: new () => EyeDropperApi }).EyeDropper)

/** Pastille d'une couleur sur un damier qui laisse voir l'opacité ; sans couleur, une pastille barrée. */
export function colorSample(color: string | null): HTMLSpanElement {
  const sample = h('span', { class: `tif-color-sample${color ? '' : ' tif-none'}`, 'aria-hidden': 'true' })
  if (color) {
    sample.style.setProperty('--tif-sample', color)
  }
  return sample
}

/** Couleur en lecture : pastille et code hexadécimal. */
export function colorValue(value: string | null): HTMLSpanElement {
  const color = splitColor(value)
  return h('span', { class: 'tif tif-color-value' }, colorSample(color ? composeColor(color) : null), h('span', { class: 'tif-mono' }, color ? color.rgb : t('color.none')))
}

export class TifColorPicker extends Component {
  static override NAME = 'color-picker'
  static override DEFAULTS: Options = {
    name: '',
    value: '',
    disabled: false,
    label: '',
    inputId: '',
    quiet: false,
  }

  readonly holder: HTMLInputElement
  readonly button: HTMLButtonElement
  readonly panel: HTMLDivElement
  readonly floating: Floating
  readonly #native: { type: string; id: string } | null
  readonly #listeners = new AbortController()
  /** Couleur en cours de réglage dans le panneau. */
  #color: Hsla = { h: 0, s: 0, l: 0, alpha: 255 }
  #panelListeners: AbortController | null = null

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
    }
    this.button = h('button', { type: 'button', class: 'tif tif-color-picker', 'aria-haspopup': 'dialog', 'aria-expanded': 'false' })
    if (native) {
      if (native.id && !this.options.inputId) {
        this.options.inputId = native.id
        native.removeAttribute('id')
      }
      native.after(this.button)
    } else {
      element.append(this.holder, this.button)
    }
    this.panel = h('div', { class: 'tif-color-panel', role: 'dialog' })
    this.floating = new Floating(this.button, this.panel, {
      returnFocus: this.button,
      onClose: () => {
        this.#panelListeners?.abort()
        this.#panelListeners = null
        this.button.setAttribute('aria-expanded', 'false')
        this.emit('hidden')
      },
    })
    const signal = this.#listeners.signal
    this.button.addEventListener('click', () => (this.floating.isOpen ? this.close() : this.open()), { signal })
    this.button.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'ArrowDown' && !this.floating.isOpen) {
          event.preventDefault()
          this.open()
        }
      },
      { signal },
    )
    this.#apply(Object.keys(this.options))
  }

  /** « #RRGGBB », « #RRGGBBAA », ou '' sans couleur. */
  override get value(): string {
    return this.holder.value
  }

  override set value(value: unknown) {
    const color = splitColor(value == null ? '' : String(value))
    this.holder.value = color ? composeColor(color) : ''
    this.#renderButton()
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
    if (keys.includes('disabled')) {
      this.button.disabled = Boolean(o.disabled)
      this.holder.disabled = Boolean(o.disabled)
      if (o.disabled) {
        this.close()
      }
    }
    if (keys.includes('label')) {
      toggleAttribute(this.button, 'aria-label', o.label ? String(o.label) : null)
    }
    if (keys.includes('inputId') && o.inputId) {
      this.button.id = String(o.inputId)
    }
    if (keys.includes('quiet')) {
      this.button.classList.toggle('tif-quiet', Boolean(o.quiet))
    }
    this.#renderButton()
  }

  #renderButton(): void {
    const color = splitColor(this.holder.value)
    this.button.title = this.button.disabled ? '' : t('color.choose')
    this.button.replaceChildren(
      colorSample(color ? composeColor(color) : null),
      ...(color
        ? [h('span', { class: 'tif-mono tif-color-hex' }, color.rgb), h('span', { class: 'tif-mono tif-color-transparency' }, `${transparencyOf(color.alpha)} %`)]
        : [h('span', { class: 'tif-color-hex tif-is-empty' }, t('color.none'))]),
    )
  }

  protected override localeChanged(): void {
    this.#renderButton()
    if (this.floating.isOpen) {
      this.#build()
    }
  }

  // --- Panneau ---

  /** Ouvre le panneau, curseur dans « Rouge ». */
  open(): void {
    if (this.button.disabled || this.floating.isOpen || !this.emit('show', undefined, true)) {
      return
    }
    const current = splitColor(this.holder.value)
    this.#color = { ...rgbToHsl(current?.rgb ?? '#0E7C86'), alpha: current?.alpha ?? 255 }
    this.#build()
    this.floating.open()
    this.button.setAttribute('aria-expanded', 'true')
    const first = this.panel.querySelector<HTMLInputElement>('input')
    first?.focus()
    first?.select()
    this.emit('shown')
  }

  close(): void {
    this.floating.close('api')
  }

  /** Applique la couleur choisie (null : la retire) et referme. */
  #applyColor(rgb: string | null, alpha: number): void {
    const before = this.holder.value
    this.holder.value = rgb === null ? '' : composeColor({ rgb, alpha })
    this.#renderButton()
    this.close()
    this.button.focus()
    if (this.holder.value !== before) {
      dispatchChange(this.holder)
    }
  }

  #build(): void {
    this.#panelListeners?.abort()
    const listeners = new AbortController()
    this.#panelListeners = listeners
    const signal = listeners.signal
    const current = splitColor(this.holder.value)
    this.panel.setAttribute('aria-label', t('color.choose'))

    // Gamme complète : la teinte de gauche à droite, la saturation de haut (vive) en bas (grise).
    const cross = h('span', { class: 'tif-color-cross' })
    const field = h('div', { class: 'tif-color-field', role: 'slider', tabindex: '-1', 'aria-label': t('color.hueSaturation') }, cross)
    // Intensité : du blanc (haut) au noir (bas), en passant par la couleur.
    const lightThumb = h('span', { class: 'tif-color-thumb' })
    const light = h('div', { class: 'tif-color-light', role: 'slider', tabindex: '-1', 'aria-label': t('color.intensity'), 'aria-valuemin': '0', 'aria-valuemax': '100' }, lightThumb)
    const alphaThumb = h('span', { class: 'tif-color-thumb tif-vertical' })
    const alpha = h('div', { class: 'tif-color-alpha', role: 'slider', tabindex: '-1', 'aria-label': t('color.transparency'), 'aria-valuemin': '0', 'aria-valuemax': '100' }, alphaThumb)

    const number = (label: string, max: number, extra: Record<string, string> = {}) =>
      h('input', { type: 'number', class: 'tif-input tif-mono', min: '0', max: String(max), 'aria-label': label, ...extra })
    const red = number(t('color.red'), 255)
    const green = number(t('color.green'), 255)
    const blue = number(t('color.blue'), 255)
    const hex = h('input', { type: 'text', class: 'tif-input tif-mono', spellcheck: 'false', 'aria-label': t('color.hex'), autocomplete: 'off' })
    const percent = number(t('color.transparencyPercent'), 100)
    const channel = (label: string, input: HTMLInputElement, className = '') => h('label', { class: `tif-color-channel ${className}` }, h('span', {}, label), input)

    const fresh = h('span', { title: t('color.newColor') })
    const old = h('span', { title: t('color.currentColor'), class: current ? undefined : 'tif-none' })
    if (current) {
      old.style.setProperty('--tif-sample', composeColor(current))
    }
    const button = (name: Parameters<typeof icon>[0], label: string, onClick: () => void, extra = '') => {
      const b = h('button', { type: 'button', class: `tif-icon-btn tif-color-action ${extra}`, title: label, 'aria-label': label }, icon(name))
      b.addEventListener('click', onClick, { signal })
      return b
    }
    const Dropper = eyeDropper()
    const foot = h(
      'div',
      { class: 'tif-color-row tif-color-foot' },
      h('span', { class: 'tif-color-compare' }, fresh, old),
      Dropper &&
        button('eyedropper', t('color.eyedropperTitle'), () => {
          void new Dropper()
            .open()
            .then((result) => this.#setFromRgb(result.sRGBHex.toUpperCase()))
            .catch(() => undefined) // Pipette abandonnée (Échap) : rien ne change.
        }),
      button('clear', t('color.removeColor'), () => this.#applyColor(null, 255)),
      h('span', { class: 'tif-spacer' }),
      button('close', t('common.cancel'), () => {
        this.close()
        this.button.focus()
      }),
      button('check', t('color.applyColor'), () => this.#applyColor(hslaToHex(this.#color), this.#color.alpha), 'tif-primary'),
    )

    this.panel.replaceChildren(
      h('div', { class: 'tif-color-pickers' }, field, light),
      h('div', { class: 'tif-color-row' }, channel(t('color.red'), red), channel(t('color.green'), green), channel(t('color.blue'), blue), channel(t('color.hex'), hex, 'tif-hex')),
      h('div', { class: 'tif-color-row' }, h('span', { class: 'tif-color-label' }, t('color.transparency')), alpha, h('label', { class: 'tif-color-channel tif-percent' }, percent, h('span', {}, '%'))),
      foot,
    )

    /** Met le panneau à jour, sauf la zone en cours de saisie (son texte ne doit pas bouger sous les doigts). */
    const update = (typing?: HTMLInputElement) => {
      const c = this.#color
      const rgb = hslToRgb(c.h, c.s, c.l).map(Math.round)
      const code = hslaToHex(c)
      cross.style.left = `${(c.h / 360) * 100}%`
      cross.style.top = `${100 - c.s}%`
      field.setAttribute('aria-valuetext', t('color.hueSaturationValue', { hue: Math.round(c.h), saturation: Math.round(c.s) }))
      light.style.setProperty('--tif-middle', `hsl(${c.h} ${c.s}% 50%)`)
      lightThumb.style.top = `${100 - c.l}%`
      light.setAttribute('aria-valuenow', String(Math.round(c.l)))
      const transparency = transparencyOf(c.alpha)
      alpha.style.setProperty('--tif-opaque', code)
      alphaThumb.style.left = `${transparency}%`
      alpha.setAttribute('aria-valuenow', String(transparency))
      ;[red, green, blue].forEach((input, i) => input !== typing && (input.value = String(rgb[i])))
      if (hex !== typing) {
        hex.value = code
      }
      if (percent !== typing) {
        percent.value = String(transparency)
      }
      fresh.style.setProperty('--tif-sample', `${code}${hex2(c.alpha)}`)
    }
    this.#update = update
    update()

    /** Glisser dans une zone : la position du pointeur, de 0 à 1 dans chaque sens, à chaque mouvement. */
    const drag = (zone: HTMLElement, apply: (x: number, y: number) => void) => {
      zone.addEventListener(
        'pointerdown',
        (event) => {
          event.preventDefault()
          zone.focus()
          zone.setPointerCapture?.(event.pointerId)
          const move = (ev: { clientX: number; clientY: number }) => {
            const rect = zone.getBoundingClientRect()
            apply(clamp((ev.clientX - rect.left) / rect.width, 0, 1), clamp((ev.clientY - rect.top) / rect.height, 0, 1))
            update()
          }
          move(event)
          const up = () => {
            zone.removeEventListener('pointermove', move)
            zone.removeEventListener('pointerup', up)
          }
          zone.addEventListener('pointermove', move)
          zone.addEventListener('pointerup', up)
        },
        { signal },
      )
    }
    drag(field, (x, y) => Object.assign(this.#color, { h: x * 360, s: (1 - y) * 100 }))
    drag(light, (_x, y) => Object.assign(this.#color, { l: (1 - y) * 100 }))
    drag(alpha, (x) => Object.assign(this.#color, { alpha: Math.round((1 - x) * 255) }))

    /** Flèches sur un variateur : un pas (dix avec Maj). */
    const arrows = (zone: HTMLElement, horizontal: ((d: number) => void) | null, vertical: ((d: number) => void) | null) => {
      zone.addEventListener(
        'keydown',
        (event) => {
          const step = event.shiftKey ? 10 : 1
          const moves: Record<string, [((d: number) => void) | null, number]> = {
            ArrowLeft: [horizontal, -step],
            ArrowRight: [horizontal, step],
            ArrowUp: [vertical, step],
            ArrowDown: [vertical, -step],
          }
          const [apply, d] = moves[event.key] ?? [null, 0]
          if (apply) {
            event.preventDefault()
            apply(d)
            update()
          }
        },
        { signal },
      )
    }
    const c = () => this.#color
    arrows(field, (d) => (c().h = clamp(c().h + d, 0, 360)), (d) => (c().s = clamp(c().s + d, 0, 100)))
    arrows(light, null, (d) => (c().l = clamp(c().l + d, 0, 100)))
    arrows(alpha, (d) => (c().alpha = clamp(Math.round(c().alpha - (d * 255) / 100), 0, 255)), null)

    // Saisies : Rouge, Vert, Bleu, Hex (appliqué dès qu'il est complet), transparence en %.
    ;[red, green, blue].forEach((input) =>
      input.addEventListener(
        'input',
        () => {
          const values = [red, green, blue].map((i) => clamp(Number(i.value) || 0, 0, 255))
          this.#setFromRgb(`#${values.map(hex2).join('')}`, input)
        },
        { signal },
      ),
    )
    hex.addEventListener(
      'input',
      () => {
        const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.value.trim())
        if (m) {
          const digits = m[1].length === 3 ? [...m[1]].map((x) => x + x).join('') : m[1]
          this.#setFromRgb(`#${digits.toUpperCase()}`, hex)
        }
      },
      { signal },
    )
    hex.addEventListener('blur', () => update(), { signal })
    percent.addEventListener(
      'input',
      () => {
        this.#color.alpha = Math.round(((100 - clamp(Number(percent.value) || 0, 0, 100)) / 100) * 255)
        update(percent)
      },
      { signal },
    )
    for (const input of [red, green, blue, hex, percent]) {
      input.addEventListener('focus', () => input.select(), { signal })
    }

    // Tab boucle dans le panneau ; Entrée applique (hors des boutons).
    this.panel.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Tab') {
          const zones = [...this.panel.querySelectorAll<HTMLElement>('input, button')]
          const i = zones.indexOf(document.activeElement as HTMLElement)
          const next = event.shiftKey ? (i <= 0 ? zones.length - 1 : i - 1) : i === zones.length - 1 ? 0 : i + 1
          event.preventDefault()
          zones[next]?.focus()
        } else if (event.key === 'Enter' && !(event.target instanceof HTMLButtonElement)) {
          event.preventDefault()
          this.#applyColor(hslaToHex(this.#color), this.#color.alpha)
        }
      },
      { signal },
    )
  }

  #update: (typing?: HTMLInputElement) => void = () => {}

  #setFromRgb(rgb: string, typing?: HTMLInputElement): void {
    this.#color = { ...rgbToHsl(rgb), alpha: this.#color.alpha }
    this.#update(typing)
  }

  focus(): void {
    this.button.focus()
  }

  override dispose(): void {
    this.#listeners.abort()
    this.#panelListeners?.abort()
    this.floating.dispose()
    this.button.remove()
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
