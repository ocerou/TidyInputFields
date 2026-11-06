// Zone d'heure (repris de MyCRM, InputTime) : saisie rapide au clavier (« 2 », « 1430 », « 14h30 »), remise en forme
// en HH:mm en quittant la zone ; ↑ ↓ avancent ou reculent d'une minute (de 15 avec Maj) ; l'horloge (Alt+↓) ouvre un
// panneau : heures, minutes par quart d'heure et raccourcis. Valeur au format HH:mm, '' si vide.
import type { Options } from '../core/component.ts'
import { h } from '../core/dom.ts'
import type { IconName } from '../core/icons.ts'
import { t } from '../i18n/i18n.ts'
import { pad } from '../utils/date.ts'
import { formatTime, minutesOf, parseTimeInput } from '../utils/time.ts'
import { panelButton, PICKER_DEFAULTS, TextPicker } from './picker.ts'

export class TifTime extends TextPicker {
  static override NAME = 'time'
  static override DEFAULTS: Options = {
    ...PICKER_DEFAULTS,
    /** Pas des minutes proposées au panneau. */
    minuteStep: 15,
  }

  constructor(element: HTMLElement, options: Options = {}) {
    super(element, options)
    this.input.classList.add('tif-mono')
  }

  protected parse(text: string): string | null {
    return parseTimeInput(text)
  }

  protected format(value: string): string {
    return value
  }

  protected defaultPlaceholder(): string {
    return t('timePicker.placeholder')
  }

  protected iconName(): IconName {
    return 'clock'
  }

  protected zoneClass(): string {
    return 'tif-time'
  }

  protected openLabel(): string {
    return t('timePicker.open')
  }

  /** ↑ ↓ : une minute de plus ou de moins, quinze avec Maj ; la saisie n'est validée qu'en quittant la zone. */
  protected override keydown(event: KeyboardEvent): boolean {
    if ((event.key !== 'ArrowUp' && event.key !== 'ArrowDown') || event.altKey) {
      return false
    }
    event.preventDefault()
    const base = minutesOf(parseTimeInput(this.input.value) ?? '') ?? 0
    const step = (event.shiftKey ? 15 : 1) * (event.key === 'ArrowUp' ? 1 : -1)
    this.input.value = formatTime((base + step + 1440) % 1440)
    return true
  }

  protected renderPanel(value: string): void {
    this.panel.setAttribute('aria-label', t('timePicker.title'))
    const chosen = minutesOf(value)
    const hour = chosen === null ? null : Math.floor(chosen / 60)
    const minute = chosen === null ? null : chosen % 60
    const stepMinutes = Math.min(60, Math.max(1, Number(this.options.minuteStep) || 15))

    const hours = h(
      'div',
      { class: 'tif-time-column', role: 'group', 'aria-label': t('timePicker.hours') },
      ...Array.from({ length: 24 }, (_, hh) =>
        // Une heure choisie garde le panneau ouvert, pour choisir ensuite les minutes.
        panelButton(pad(hh), { 'aria-pressed': String(hh === hour) }, () => this.choose(formatTime(hh * 60 + (minute ?? 0)), true)),
      ),
    )
    const minutes = h(
      'div',
      { class: 'tif-time-column', role: 'group', 'aria-label': t('timePicker.minutes') },
      ...Array.from({ length: Math.ceil(60 / stepMinutes) }, (_, i) => i * stepMinutes).map((mm) =>
        panelButton(pad(mm), { 'aria-pressed': String(mm === minute) }, () => this.choose(formatTime((hour ?? 0) * 60 + mm))),
      ),
    )
    const now = () => formatTime(new Date().getHours() * 60 + new Date().getMinutes())
    const shortcuts: [string, () => string][] = [
      [t('timePicker.midnight'), () => '00:00'],
      ['02:00', () => '02:00'],
      ['08:00', () => '08:00'],
      [t('timePicker.noon'), () => '12:00'],
      [t('timePicker.now'), now],
    ]
    const foot = h(
      'div',
      { class: 'tif-panel-foot tif-wrap' },
      ...shortcuts.map(([label, time]) => panelButton(label, { class: 'tif-link-btn' }, () => this.choose(time()))),
      panelButton(t('datePicker.clear'), { class: 'tif-link-btn' }, () => this.choose('')),
    )
    this.panel.replaceChildren(h('div', { class: 'tif-time-columns' }, hours, minutes), foot)
    // L'heure choisie amenée au milieu de sa colonne, sans faire défiler la page (ce qui fermerait le panneau).
    queueMicrotask(() => {
      for (const column of this.panel.querySelectorAll<HTMLElement>('.tif-time-column')) {
        const pressed = column.querySelector<HTMLElement>('[aria-pressed="true"]')
        if (pressed) {
          column.scrollTop = pressed.offsetTop - column.offsetTop - (column.clientHeight - pressed.offsetHeight) / 2
        }
      }
    })
  }
}
