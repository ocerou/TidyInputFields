// Zone de date (repris de MyCRM, InputDate) : saisie rapide au clavier (« 1/1/27 », « 15 », « 010127 »…), remise en
// forme en quittant la zone, et un calendrier qui se zoome — jours du mois, mois de l'année, années (clic sur le titre
// pour remonter d'un niveau, clic sur un mois ou une année pour descendre). Valeur au format AAAA-MM-JJ, '' si vide.
import type { Options } from '../core/component.ts'
import { h } from '../core/dom.ts'
import { icon, type IconName } from '../core/icons.ts'
import { getLocale, t } from '../i18n/i18n.ts'
import { datePattern, firstDayOfWeek, formatDateInput, iso, monthCells, parseDateInput, partsOf, todayParts } from '../utils/date.ts'
import { panelButton, PICKER_DEFAULTS, TextPicker } from './picker.ts'

type Level = 'days' | 'months' | 'years'

export class TifDate extends TextPicker {
  static override NAME = 'date'
  static override DEFAULTS: Options = {
    ...PICKER_DEFAULTS,
    /** Premier jour de la semaine : 1 lundi … 7 dimanche ; 0 : celui de la langue. */
    firstDay: 0,
  }

  // État du calendrier, remis à zéro à chaque ouverture.
  level: Level = 'days'
  view = { y: 2000, m: 1 }

  protected parse(text: string): string | null {
    return parseDateInput(text)
  }

  protected format(value: string): string {
    return formatDateInput(value)
  }

  protected defaultPlaceholder(): string {
    return datePattern({ d: t('datePicker.day'), m: t('datePicker.month'), y: t('datePicker.year') })
  }

  protected iconName(): IconName {
    return 'calendar'
  }

  protected zoneClass(): string {
    return 'tif-date'
  }

  protected openLabel(): string {
    return t('datePicker.open')
  }

  protected override resetPanel(value: string): void {
    const selected = partsOf(value) ?? todayParts()
    this.level = 'days'
    this.view = { y: selected.y, m: selected.m }
  }

  protected renderPanel(value: string): void {
    const locale = getLocale()
    const selected = partsOf(value)
    const today = todayParts()
    const view = this.view
    this.panel.setAttribute('aria-label', t('datePicker.title'))
    let title: string
    let grid: HTMLElement
    let step: (n: number) => void

    if (this.level === 'days') {
      title = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(Date.UTC(view.y, view.m - 1, 1))
      step = (n) => {
        const months = view.m - 1 + n
        this.view = { y: view.y + Math.floor(months / 12), m: (((months % 12) + 12) % 12) + 1 }
      }
      const firstDay = Number(this.options.firstDay) || firstDayOfWeek(locale)
      const weekday = new Intl.DateTimeFormat(locale, { weekday: 'narrow', timeZone: 'UTC' })
      // 1er février 2027 : un lundi ; on en part pour nommer les jours dans l'ordre de la semaine.
      const names = Array.from({ length: 7 }, (_, i) => weekday.format(Date.UTC(2027, 1, 1 + ((firstDay - 1 + i) % 7))))
      grid = h(
        'div',
        { class: 'tif-calendar-grid tif-calendar-days', role: 'grid' },
        ...names.map((n) => h('span', { class: 'tif-calendar-weekday', 'aria-hidden': 'true' }, n)),
        ...monthCells(view.y, view.m, firstDay).map((c) =>
          panelButton(
            String(c.d),
            {
              class: [c.m !== view.m ? 'tif-other' : '', iso(c) === iso(today) ? 'tif-today' : ''].filter(Boolean).join(' ') || undefined,
              'aria-pressed': String(!!selected && iso(c) === iso(selected)),
              'aria-label': new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone: 'UTC' }).format(Date.UTC(c.y, c.m - 1, c.d)),
              'data-date': iso(c),
            },
            () => this.choose(iso(c)),
          ),
        ),
      )
    } else if (this.level === 'months') {
      title = String(view.y)
      step = (n) => (this.view = { ...view, y: view.y + n })
      const month = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' })
      grid = h(
        'div',
        { class: 'tif-calendar-grid tif-calendar-months' },
        ...Array.from({ length: 12 }, (_, i) => i + 1).map((m) =>
          panelButton(
            month.format(Date.UTC(2027, m - 1, 1)),
            {
              class: view.y === today.y && m === today.m ? 'tif-today' : undefined,
              'aria-pressed': String(!!selected && selected.y === view.y && selected.m === m),
            },
            () => {
              this.view = { y: view.y, m }
              this.level = 'days'
              this.#redraw(value)
            },
          ),
        ),
      )
    } else {
      // Douze années autour de l'année affichée : les quatre précédentes et les sept suivantes.
      const first = view.y - 4
      title = `${first} – ${first + 11}`
      step = (n) => (this.view = { ...view, y: view.y + 12 * n })
      grid = h(
        'div',
        { class: 'tif-calendar-grid tif-calendar-months' },
        ...Array.from({ length: 12 }, (_, i) => first + i).map((y) =>
          panelButton(
            String(y),
            { class: y === today.y ? 'tif-today' : undefined, 'aria-pressed': String(!!selected && selected.y === y) },
            () => {
              this.view = { ...view, y }
              this.level = 'months'
              this.#redraw(value)
            },
          ),
        ),
      )
    }

    const move = (n: number) => () => {
      step(n)
      this.#redraw(value)
    }
    const head = h(
      'div',
      { class: 'tif-calendar-head' },
      panelButton(icon('chevronLeft'), { class: 'tif-icon-btn tif-flip-rtl', title: t('datePicker.previous'), 'aria-label': t('datePicker.previous') }, move(-1)),
      panelButton(
        title,
        {
          class: 'tif-calendar-title',
          disabled: this.level === 'years',
          title: this.level === 'days' ? t('datePicker.chooseMonth') : t('datePicker.chooseYear'),
          'aria-live': 'polite',
        },
        () => {
          this.level = this.level === 'days' ? 'months' : 'years'
          this.#redraw(value)
        },
      ),
      panelButton(icon('chevronRight'), { class: 'tif-icon-btn tif-flip-rtl', title: t('datePicker.next'), 'aria-label': t('datePicker.next') }, move(1)),
    )
    const foot = h(
      'div',
      { class: 'tif-panel-foot' },
      panelButton(t('datePicker.today'), { class: 'tif-link-btn' }, () => this.choose(iso(today))),
      panelButton(t('datePicker.clear'), { class: 'tif-link-btn' }, () => this.choose('')),
    )
    this.panel.replaceChildren(head, grid, foot)
  }

  #redraw(value: string): void {
    this.renderPanel(value)
    this.reposition()
  }
}
