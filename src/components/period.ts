// Choix d'une période (repris de MyCRM, InputPeriod) : au repos, une liste déroulante qui montre `allLabel` sans
// période, sinon « Signature : octobre 2026 ». Ouverte : raccourcis (mois en cours, mois prochain, 3 prochains mois,
// année en cours), « Passé », puis des sous-menus Mois, Trimestre, Année — un choix nommé (« T3 2025 ») autour de
// l'unité en cours, avec recherche — et Dates précises. Les choix de mois, trimestre ou année sont relatifs : enregistrés,
// ils suivent le calendrier. `relativeOnly` retire « Passé » et les dates précises.
// Clavier : ↑ ↓, Entrée ou → pour choisir ou ouvrir, ← ou Échap pour revenir.
//
// Valeur : un objet DatePeriod (ou null) ; le formulaire reçoit sa forme JSON dans un champ caché.
import { Component, type Options } from '../core/component.ts'
import { h } from '../core/dom.ts'
import { Floating } from '../core/floating.ts'
import { icon } from '../core/icons.ts'
import { getLocale, t } from '../i18n/i18n.ts'
import { formatDateInput, parseDateInput } from '../utils/date.ts'
import { PERIOD_SHORTCUTS, periodOffsets, periodRange, samePeriod, unitName, type DatePeriod, type PeriodUnit } from '../utils/period.ts'
import { highlight, matchesWords, wordsOf } from '../utils/search.ts'
import { TifDate } from './date.ts'
import { dispatchChange } from './field.ts'

type Screen = 'root' | PeriodUnit | 'between'
/** Une ligne du panneau : un choix (période, ou aucune) ou l'entrée d'un sous-menu. */
type Row = { key: string; label: string; period?: DatePeriod | null; opens?: Screen; current?: boolean }

const UNITS: PeriodUnit[] = ['month', 'quarter', 'year']

/** Nom d'une unité décalée dans la langue : « octobre 2026 », « T3 2025 », « 2027 ». */
export function periodUnitName(unit: PeriodUnit, offset: number, locale = getLocale(), today = new Date()): string {
  return unitName(unit, offset, locale, (quarter, year) => t('period.quarterName', { quarter, year }), today)
}

/** Libellé d'une période : raccourci (« Mois en cours »), « Date passée », unité nommée (ou deux en plage), dates fixes. */
export function periodLabel(p: DatePeriod, locale = getLocale(), today = new Date()): string {
  const shortcut = PERIOD_SHORTCUTS.find((s) => samePeriod(s.period, p))
  if (shortcut) {
    return t(`period.${shortcut.key}`)
  }
  if (p.operator === 'past') {
    return t('period.past')
  }
  if (p.operator === 'between') {
    return `${formatDateInput(p.from, locale)} – ${formatDateInput(p.to, locale)}`
  }
  const unit = (offset: number) => periodUnitName(p.unit, offset, locale, today)
  return p.from === p.to ? unit(p.from) : `${unit(p.from)} – ${unit(p.to)}`
}

/** Période lue dans un objet ou sa forme JSON ; null si ce n'en est pas une. */
export function toPeriod(value: unknown): DatePeriod | null {
  let v = value
  if (typeof v === 'string') {
    if (!v.trim()) {
      return null
    }
    try {
      v = JSON.parse(v)
    } catch {
      return null
    }
  }
  const p = v as { operator?: unknown; unit?: unknown; from?: unknown; to?: unknown } | null
  if (!p || typeof p !== 'object') {
    return null
  }
  if (p.operator === 'past') {
    return { operator: 'past' }
  }
  if (p.operator === 'between' && typeof p.from === 'string' && typeof p.to === 'string' && p.from && p.to) {
    return { operator: 'between', from: p.from, to: p.to }
  }
  if (p.operator === 'period' && UNITS.includes(p.unit as PeriodUnit) && Number.isInteger(p.from) && Number.isInteger(p.to)) {
    return { operator: 'period', unit: p.unit as PeriodUnit, from: p.from as number, to: p.to as number }
  }
  return null
}

export class TifPeriod extends Component {
  static override NAME = 'period'
  static override DEFAULTS: Options = {
    name: '',
    value: null as DatePeriod | null,
    /** Nom de la date filtrée (« Signature »), devant la période choisie. */
    field: '',
    /** Libellé sans période (« Toutes les signatures ») ; c'est aussi le nom accessible. */
    allLabel: '',
    relativeOnly: false,
    disabled: false,
    quiet: false,
  }

  readonly holder: HTMLInputElement
  readonly button: HTMLButtonElement
  readonly panel: HTMLDivElement
  readonly floating: Floating
  readonly #created: boolean
  readonly #listeners = new AbortController()
  #period: DatePeriod | null = null
  #screen: Screen = 'root'
  #search = ''
  #active = 0
  #range = { from: '', to: '' }
  #rows: Row[] = []
  #list: HTMLDivElement | null = null
  #foot: HTMLDivElement | null = null
  #apply: HTMLButtonElement | null = null
  #dates: TifDate[] = []

  constructor(element: HTMLElement, options: Options = {}) {
    super(element, options)
    const native = element instanceof HTMLInputElement ? element : null
    this.#created = !native
    this.holder = native ?? h('input', { type: 'hidden' })
    if (native) {
      if (this.options.value == null && native.value) {
        this.options.value = native.value
      }
      native.hidden = true
    }
    this.button = h(
      'button',
      { type: 'button', class: 'tif tif-select-button tif-period-button', 'aria-haspopup': 'listbox', 'aria-expanded': 'false' },
      h('span', { class: 'tif-select-value' }),
    )
    if (native) {
      native.after(this.button)
    } else {
      element.append(this.holder, this.button)
    }
    this.panel = h('div', { class: 'tif-listbox-panel tif-period-panel', tabindex: '-1' })
    this.floating = new Floating(this.button, this.panel, {
      matchWidth: true,
      returnFocus: this.button,
      onEscape: () => this.#escape(),
      onClose: () => {
        this.button.setAttribute('aria-expanded', 'false')
        this.#disposeDates()
        this.emit('hidden')
      },
    })
    const signal = this.#listeners.signal
    this.button.addEventListener('click', () => (this.floating.isOpen ? this.close() : this.open()), { signal })
    this.button.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          this.open()
        }
      },
      { signal },
    )
    this.panel.addEventListener('keydown', (event) => this.#keydown(event), { signal })
    this.#applyOptions(Object.keys(this.options))
  }

  /** Période choisie, null pour « toutes les dates ». */
  override get value(): DatePeriod | null {
    return this.#period
  }

  override set value(value: unknown) {
    this.#period = toPeriod(value)
    this.holder.value = this.#period ? JSON.stringify(this.#period) : ''
    this.#renderButton()
  }

  /** Bornes de la période choisie, à la date d'aujourd'hui (ISO, comprises) ; null sans période. */
  get range(): { from?: string; to: string } | null {
    return this.#period ? periodRange(this.#period) : null
  }

  protected override optionsChanged(keys: string[]): void {
    this.#applyOptions(keys)
  }

  #applyOptions(keys: string[]): void {
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
    if (keys.includes('quiet')) {
      this.button.classList.toggle('tif-quiet', Boolean(o.quiet))
    }
    this.#renderButton()
  }

  #allLabel(): string {
    return String(this.options.allLabel || t('period.all'))
  }

  #renderButton(): void {
    const p = this.#period
    const all = this.#allLabel()
    const label = p ? periodLabel(p) : ''
    const shown = p ? (this.options.field ? t('period.labelled', { field: this.options.field, period: label }) : label) : all
    this.button.querySelector('.tif-select-value')!.textContent = shown
    this.button.setAttribute('aria-label', all)
    this.button.title = p ? shown : ''
    this.button.classList.toggle('tif-filter-set', !!p)
  }

  protected override localeChanged(): void {
    this.#renderButton()
    if (this.floating.isOpen) {
      this.#go(this.#screen)
    }
  }

  // --- Panneau ---

  /** Ouvre le panneau sur la liste de départ. */
  open(): void {
    if (this.button.disabled || this.floating.isOpen || !this.emit('show', undefined, true)) {
      return
    }
    this.#go('root', false)
    this.floating.open()
    this.button.setAttribute('aria-expanded', 'true')
    this.#focusScreen()
    this.#reveal('center')
    this.emit('shown')
  }

  close(): void {
    this.floating.close('api')
  }

  #rootRows(): Row[] {
    const relativeOnly = Boolean(this.options.relativeOnly)
    return [
      { key: 'all', label: this.#allLabel(), period: null },
      ...(relativeOnly ? [] : [{ key: 'past', label: t('period.past'), period: { operator: 'past' } as DatePeriod }]),
      ...PERIOD_SHORTCUTS.map((s) => ({ key: s.key, label: t(`period.${s.key}`), period: s.period })),
      ...UNITS.map((u) => ({ key: u, label: t(`period.${u}`), opens: u as Screen })),
      ...(relativeOnly ? [] : [{ key: 'between', label: t('period.between'), opens: 'between' as Screen }]),
    ]
  }

  #computeRows(): Row[] {
    const screen = this.#screen
    if (screen === 'root') {
      return this.#rootRows()
    }
    if (screen === 'between') {
      return []
    }
    const [first, last] = periodOffsets(screen)
    const words = wordsOf(this.#search)
    const locale = getLocale()
    return Array.from({ length: last - first + 1 }, (_, i) => first + i)
      .map((o) => ({ key: String(o), label: periodUnitName(screen, o, locale), period: { operator: 'period', unit: screen, from: o, to: o } as DatePeriod, current: o === 0 }))
      .filter((r) => matchesWords(r.label, words))
  }

  /**
   * Change d'écran ; dans un sous-menu, la ligne active est le choix en cours, sinon l'unité en cours ; au départ, le
   * choix en cours s'il y figure.
   */
  #go(screen: Screen, focus = true): void {
    this.#disposeDates()
    this.#screen = screen
    this.#search = ''
    const value = this.#period
    if (screen === 'between') {
      // Dates précises : les bornes du choix en cours, quel qu'il soit (« Mois en cours » → du 1er au 31).
      const bounds = value ? periodRange(value) : null
      this.#range = { from: bounds?.from ?? '', to: bounds?.to ?? '' }
    }
    this.#rows = this.#computeRows()
    if (screen === 'root') {
      // Choix absent de la liste de départ (un mois, des dates…) : aucune ligne active, le pied montre ses bornes.
      this.#active = this.#rows.findIndex((r) => r.period !== undefined && samePeriod(r.period, value))
    } else if (screen === 'between') {
      this.#active = 0
    } else {
      const [first, last] = periodOffsets(screen)
      const chosen = value?.operator === 'period' && value.unit === screen && value.from === value.to ? value.from : 0
      this.#active = Math.min(Math.max(chosen, first), last) - first
    }
    this.#renderScreen()
    if (focus) {
      this.#focusScreen()
      this.#reveal('center')
    }
    this.floating.position()
  }

  #renderScreen(): void {
    const screen = this.#screen
    const parts: HTMLElement[] = []
    this.#list = null
    this.#apply = null
    if (screen !== 'root') {
      const back = h('button', { type: 'button', class: 'tif-icon-btn tif-flip-rtl', 'aria-label': t('period.back'), title: t('period.back') }, icon('left'))
      back.addEventListener('click', () => this.#go('root'))
      let main: HTMLElement
      if (screen === 'between') {
        main = h('span', { class: 'tif-listbox-title' }, t('period.between'))
      } else {
        const search = h('input', { type: 'text', class: 'tif-listbox-search-input', placeholder: t(`period.${screen}`), 'aria-label': t('search.inList'), autocomplete: 'off' })
        search.addEventListener('input', () => {
          this.#search = search.value
          this.#active = 0
          this.#rows = this.#computeRows()
          this.#renderList()
          this.#renderFoot()
        })
        main = search
      }
      parts.push(h('div', { class: 'tif-listbox-search' }, back, main))
    }
    if (screen === 'between') {
      parts.push(this.#renderBetween())
    } else {
      this.#list = h('div', { class: 'tif-listbox', role: 'listbox', tabindex: screen === 'root' ? '0' : '-1', 'aria-label': this.#allLabel() })
      parts.push(this.#list)
      this.#renderList()
    }
    this.#foot = h('div', { class: 'tif-listbox-foot' })
    parts.push(this.#foot)
    this.panel.replaceChildren(...parts)
    this.#renderFoot()
  }

  #renderList(): void {
    const list = this.#list
    if (!list) {
      return
    }
    const screen = this.#screen
    const words = wordsOf(this.#search)
    const nodes: HTMLElement[] = []
    if (this.#rows.length === 0) {
      nodes.push(h('div', { class: 'tif-no-results' }, t('search.noResults')))
    }
    this.#rows.forEach((row, i) => {
      if (screen === 'root' && row.key === 'month') {
        nodes.push(h('div', { class: 'tif-listbox-sep', role: 'presentation' }))
      }
      const chosen = row.period !== undefined && samePeriod(row.period, this.#period)
      const option = h(
        'div',
        {
          role: 'option',
          class: `tif-option${row.key === 'all' ? ' tif-option-empty' : ''}`,
          'aria-selected': row.opens ? undefined : String(chosen),
          'aria-haspopup': row.opens ? 'listbox' : undefined,
          'data-active': String(i === this.#active),
          'data-key': row.key,
        },
        h('span', { class: 'tif-option-label' }, screen === 'root' ? row.label : highlight(row.label, words)),
        row.current && h('span', { class: 'tif-option-note' }, t('period.current')),
        chosen && icon('check'),
        row.opens && h('span', { class: 'tif-flip-rtl' }, icon('chevronRight')),
      )
      option.addEventListener('mousedown', (event) => {
        event.preventDefault()
        this.#pick(row)
      })
      option.addEventListener('mouseenter', () => this.#setActive(i, false))
      nodes.push(option)
    })
    list.replaceChildren(...nodes)
  }

  #renderBetween(): HTMLElement {
    const fromHost = h('span')
    const toHost = h('span')
    const apply = h('button', { type: 'button', class: 'tif-btn tif-btn-primary' }, t('period.apply'))
    this.#apply = apply
    const body = h(
      'div',
      { class: 'tif-period-between' },
      h('label', {}, h('span', {}, t('period.from')), fromHost),
      h('label', {}, h('span', {}, t('period.to')), toHost),
      apply,
    )
    const from = new TifDate(fromHost, { value: this.#range.from, label: t('period.from') })
    const to = new TifDate(toHost, { value: this.#range.to, label: t('period.to') })
    this.#dates = [from, to]
    // La saisie en cours compte déjà (le bouton s'active sans attendre qu'on quitte la zone).
    const read = (d: TifDate) => parseDateInput(d.input.value) ?? d.value
    const update = () => {
      this.#range = { from: read(from), to: read(to) }
      this.#renderFoot()
    }
    body.addEventListener('input', (event) => {
      event.stopPropagation()
      update()
    })
    body.addEventListener('change', (event) => {
      event.stopPropagation()
      update()
    })
    apply.addEventListener('click', () => {
      from.validate()
      to.validate()
      update()
      const { from: start, to: end } = this.#range
      if (start && end && start <= end) {
        this.#commit({ operator: 'between', from: start, to: end })
        this.close()
        this.button.focus()
      }
    })
    return body
  }

  #disposeDates(): void {
    for (const date of this.#dates) {
      date.dispose()
    }
    this.#dates = []
  }

  /** Pied : bornes du choix actif (ligne survolée, dates précises en cours de saisie), sinon de la période choisie. */
  #renderFoot(): void {
    const row = this.#rows[this.#active]
    const range = this.#range
    const shown: DatePeriod | null =
      this.#screen === 'between'
        ? range.from || range.to
          ? { operator: 'between', from: range.from, to: range.to }
          : null
        : row && !row.opens
          ? (row.period ?? null)
          : this.#period
    const bounds = shown ? periodRange(shown) : null
    const date = (value: string) => formatDateInput(value)
    const text = !bounds
      ? t('period.noLimit')
      : bounds.from && bounds.to
        ? t('period.rangeBoth', { from: date(bounds.from), to: date(bounds.to) })
        : bounds.to
          ? t('period.rangeTo', { to: date(bounds.to) })
          : t('period.rangeFrom', { from: date(bounds.from!) })
    if (this.#foot) {
      this.#foot.textContent = text
    }
    if (this.#apply) {
      this.#apply.disabled = !range.from || !range.to || range.from > range.to
    }
  }

  #setActive(index: number, byKeyboard: boolean): void {
    this.#active = index
    for (const option of this.#list?.querySelectorAll<HTMLElement>('[role="option"]') ?? []) {
      option.dataset.active = String(this.#rows[index]?.key === option.dataset.key)
    }
    this.#renderFoot()
    if (byKeyboard) {
      this.#reveal('nearest')
    }
  }

  /** Ligne active rendue visible en ne faisant défiler que la liste (pas la page, ce qui fermerait le panneau). */
  #reveal(where: 'nearest' | 'center'): void {
    const list = this.#list
    const row = list?.querySelector<HTMLElement>('[data-active="true"]')
    if (!list || !row) {
      return
    }
    const top = row.offsetTop - list.offsetTop
    if (where === 'center') {
      list.scrollTop = top - (list.clientHeight - row.offsetHeight) / 2
    } else if (top < list.scrollTop) {
      list.scrollTop = top
    } else if (top + row.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = top + row.offsetHeight - list.clientHeight
    }
  }

  #focusScreen(): void {
    if (this.#screen === 'root') {
      this.#list?.focus()
    } else if (this.#screen === 'between') {
      this.#dates[0]?.focus()
    } else {
      this.panel.querySelector<HTMLInputElement>('.tif-listbox-search-input')?.focus()
    }
  }

  #pick(row: Row): void {
    if (row.opens) {
      this.#go(row.opens)
      return
    }
    this.#commit(row.period ?? null)
    this.close()
    this.button.focus()
  }

  #commit(period: DatePeriod | null): void {
    const before = this.holder.value
    this.value = period
    if (this.holder.value !== before) {
      dispatchChange(this.holder)
    }
  }

  /** Échap : retour à la liste de départ depuis un sous-menu ; depuis le départ, le panneau se ferme. */
  #escape(): boolean {
    if (this.#screen !== 'root') {
      this.#go('root')
      return true
    }
    return false
  }

  #keydown(event: KeyboardEvent): void {
    const screen = this.#screen
    const rows = this.#rows
    if (event.key === 'ArrowDown' && screen !== 'between') {
      event.preventDefault()
      this.#setActive(Math.min(this.#active + 1, rows.length - 1), true)
    } else if (event.key === 'ArrowUp' && screen !== 'between') {
      event.preventDefault()
      this.#setActive(Math.max(this.#active - 1, 0), true)
    } else if ((event.key === 'Enter' || (event.key === 'ArrowRight' && rows[this.#active]?.opens)) && screen !== 'between') {
      event.preventDefault()
      if (rows[this.#active]) {
        this.#pick(rows[this.#active])
      }
    } else if (event.key === 'ArrowLeft' && screen !== 'root' && !(event.target instanceof HTMLInputElement)) {
      event.preventDefault()
      this.#go('root')
    } else if (event.key === 'Tab' && screen === 'root') {
      this.close()
    }
  }

  focus(): void {
    this.button.focus()
  }

  override dispose(): void {
    this.#listeners.abort()
    this.#disposeDates()
    this.floating.dispose()
    this.button.remove()
    if (this.#created) {
      this.holder.remove()
    } else {
      this.holder.hidden = false
    }
    super.dispose()
  }
}
