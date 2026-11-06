import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TifDate, TifDateTime, TifPeriod, TifTime, periodLabel, toPeriod } from '../../src/components/index.ts'
import { h } from '../../src/core/dom.ts'
import { setLocale } from '../../src/i18n/i18n.ts'
import { datePattern, firstDayOfWeek, monthCells } from '../../src/utils/date.ts'

const html = (markup: string) => {
  const form = document.createElement('form')
  form.innerHTML = markup
  document.body.append(form)
  return form
}
const sent = (form: HTMLFormElement) => Object.fromEntries(new FormData(form))
const type = (input: HTMLInputElement, text: string) => {
  input.focus()
  input.value = text
  input.dispatchEvent(new Event('input', { bubbles: true }))
}
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, ...init }))

beforeEach(() => setLocale('fr'))
afterEach(() => {
  document.body.replaceChildren()
  setLocale(null)
})

describe('date helpers', () => {
  it('builds the input pattern in the order of the language', () => {
    const letters = { d: 'dd', m: 'mm', y: 'yyyy' }
    expect(datePattern(letters, 'fr')).toBe('dd/mm/yyyy')
    expect(datePattern(letters, 'en-US')).toBe('mm/dd/yyyy')
    expect(datePattern(letters, 'de')).toBe('dd.mm.yyyy')
  })

  it('knows the first day of the week', () => {
    expect(firstDayOfWeek('fr-FR')).toBe(1)
    expect(firstDayOfWeek('en-US')).toBe(7)
  })

  it('fills six weeks starting on the first day', () => {
    const monday = monthCells(2026, 11, 1)
    expect(monday[0]).toEqual({ y: 2026, m: 10, d: 26 })
    expect(monday).toHaveLength(42)
    const sunday = monthCells(2026, 11, 7)
    expect(sunday[0]).toEqual({ y: 2026, m: 11, d: 1 })
  })
})

describe('date', () => {
  it('shows the language format and sends ISO', () => {
    const form = html('<tif-date name="due" value="2027-01-05"></tif-date>')
    const input = form.querySelector<HTMLInputElement>('.tif-picker-input')!
    expect(input.value).toBe('05/01/2027')
    expect(input.placeholder).toBe('jj/mm/aaaa')
    expect(sent(form)).toEqual({ due: '2027-01-05' })
  })

  it('validates quick typing on blur and Enter, once', () => {
    const element = h('div')
    document.body.append(element)
    const date = new TifDate(element)
    const change = vi.fn()
    element.addEventListener('change', change)
    type(date.input, '1/2/27')
    date.input.dispatchEvent(new FocusEvent('blur'))
    expect(date.value).toBe('2027-02-01')
    expect(date.input.value).toBe('01/02/2027')
    expect(change).toHaveBeenCalledTimes(1)
    type(date.input, 'nonsense')
    key(date.input, 'Enter')
    expect(date.value).toBe('2027-02-01')
    expect(date.input.value).toBe('01/02/2027')
    expect(change).toHaveBeenCalledTimes(1)
    type(date.input, '')
    key(date.input, 'Enter')
    expect(date.value).toBe('')
    expect(change).toHaveBeenCalledTimes(2)
  })

  it('reverts the typing with Escape', () => {
    const date = new TifDate(h('div'), { value: '2026-11-06' })
    type(date.input, '12')
    key(date.input, 'Escape')
    expect(date.input.value).toBe('06/11/2026')
  })

  it('opens the calendar, zooms out and chooses a day', () => {
    const element = h('div')
    document.body.append(element)
    const date = new TifDate(element, { value: '2026-11-06' })
    key(date.input, 'ArrowDown', { altKey: true })
    expect(date.floating.isOpen).toBe(true)
    expect(date.button.getAttribute('aria-expanded')).toBe('true')
    const panel = date.panel
    expect(panel.querySelector('[aria-pressed="true"]')!.textContent).toBe('6')
    // Lundi en premier en français : la grille commence le 26 octobre.
    expect(panel.querySelector('[data-date]')!.getAttribute('data-date')).toBe('2026-10-26')
    panel.querySelector<HTMLButtonElement>('.tif-calendar-title')!.click()
    expect(panel.querySelectorAll('.tif-calendar-months button')).toHaveLength(12)
    panel.querySelector<HTMLButtonElement>('.tif-calendar-title')!.click()
    expect(panel.querySelector('.tif-calendar-title')!.textContent).toBe('2022 – 2033')
    ;[...panel.querySelectorAll<HTMLButtonElement>('.tif-calendar-months button')].find((b) => b.textContent === '2027')!.click()
    ;[...panel.querySelectorAll<HTMLButtonElement>('.tif-calendar-months button')][2].click()
    panel.querySelector<HTMLButtonElement>('[data-date="2027-03-15"]')!.click()
    expect(date.value).toBe('2027-03-15')
    expect(date.floating.isOpen).toBe(false)
  })

  it('dresses an existing date input and gives it back', () => {
    const native = h('input', { type: 'date', name: 'start', id: 'start', value: '2026-01-31', required: true })
    const form = h('form', {}, native)
    document.body.append(form)
    const date = new TifDate(native)
    expect(native.type).toBe('hidden')
    expect(date.input.id).toBe('start')
    expect(date.input.required).toBe(true)
    expect(date.input.value).toBe('31/01/2026')
    expect(sent(form)).toEqual({ start: '2026-01-31' })
    date.dispose()
    expect(native.type).toBe('date')
    expect(native.id).toBe('start')
    expect(form.querySelector('.tif-picker')).toBeNull()
  })

  it('follows the language', () => {
    const date = new TifDate(h('div'), { value: '2027-01-05' })
    setLocale('en-US')
    expect(date.input.value).toBe('01/05/2027')
    expect(date.input.placeholder).toBe('mm/dd/yyyy')
  })
})

describe('time', () => {
  it('reads quick typing and steps with the arrows', () => {
    const element = h('div')
    document.body.append(element)
    const time = new TifTime(element, { name: 'at' })
    type(time.input, '930')
    key(time.input, 'Enter')
    expect(time.value).toBe('09:30')
    key(time.input, 'ArrowUp')
    expect(time.input.value).toBe('09:31')
    key(time.input, 'ArrowDown', { shiftKey: true })
    expect(time.input.value).toBe('09:16')
    expect(time.value).toBe('09:30')
    time.input.dispatchEvent(new FocusEvent('blur'))
    expect(time.value).toBe('09:16')
  })

  it('chooses an hour (panel stays open) then minutes', () => {
    const element = h('div')
    document.body.append(element)
    const time = new TifTime(element, { value: '09:30' })
    time.open()
    const [hours, minutes] = time.panel.querySelectorAll('.tif-time-column')
    expect(minutes.querySelectorAll('button')).toHaveLength(4)
    ;[...hours.querySelectorAll<HTMLButtonElement>('button')][14].click()
    expect(time.value).toBe('14:30')
    expect(time.floating.isOpen).toBe(true)
    ;[...time.panel.querySelectorAll('.tif-time-column')[1].querySelectorAll<HTMLButtonElement>('button')][1].click()
    expect(time.value).toBe('14:15')
    expect(time.floating.isOpen).toBe(false)
  })
})

describe('date-time', () => {
  it('combines date and time; time waits for a date', () => {
    const form = html('<tif-date-time name="meeting"></tif-date-time>')
    const element = form.querySelector('tif-date-time')!
    const dt = TifDateTime.getInstance(element)!
    expect(dt.time.input.disabled).toBe(true)
    const change = vi.fn()
    form.addEventListener('change', change)
    type(dt.date.input, '20/11/2026')
    key(dt.date.input, 'Enter')
    expect(dt.value).toBe('2026-11-20T00:00')
    expect(dt.time.input.disabled).toBe(false)
    type(dt.time.input, '9')
    key(dt.time.input, 'Enter')
    expect(sent(form)).toEqual({ meeting: '2026-11-20T09:00' })
    expect(change).toHaveBeenCalledTimes(2)
    type(dt.date.input, '')
    key(dt.date.input, 'Enter')
    expect(dt.value).toBe('')
    expect(dt.time.value).toBe('')
  })

  it('shows the time zone only when it differs', () => {
    const dt = new TifDateTime(h('div'), { value: '2026-11-20T09:00', timeZone: 'America/New_York', defaultTimeZone: 'Europe/Paris' })
    const addon = dt.zone.querySelector<HTMLElement>('.tif-addon')!
    expect(addon.hidden).toBe(false)
    expect(addon.textContent).toBe('America/New_York')
    dt.setOptions({ timeZone: 'Europe/Paris' })
    expect(addon.hidden).toBe(true)
  })
})

describe('period', () => {
  const today = new Date(2026, 10, 6)

  it('reads periods and names them', () => {
    expect(toPeriod('{"operator":"past"}')).toEqual({ operator: 'past' })
    expect(toPeriod({ operator: 'period', unit: 'week', from: 0, to: 0 })).toBeNull()
    expect(toPeriod('nope')).toBeNull()
    expect(periodLabel({ operator: 'period', unit: 'month', from: 0, to: 0 })).toBe('Mois en cours')
    expect(periodLabel({ operator: 'period', unit: 'quarter', from: -1, to: -1 }, 'fr', today)).toBe('T3 2026')
    expect(periodLabel({ operator: 'period', unit: 'month', from: 2, to: 3 }, 'fr', today)).toBe('janvier 2027 – février 2027')
    expect(periodLabel({ operator: 'between', from: '2026-01-01', to: '2026-02-01' })).toBe('01/01/2026 – 01/02/2026')
  })

  it('shows the field and the period, and sends JSON', () => {
    const form = html('<tif-period name="sig" field="Signature" all-label="Toutes les signatures"></tif-period>')
    const button = form.querySelector('button')!
    expect(button.textContent).toBe('Toutes les signatures')
    const period = TifPeriod.getInstance(form.querySelector('tif-period'))!
    period.value = { operator: 'past' }
    expect(button.textContent).toBe('Signature : Date passée')
    expect(sent(form)).toEqual({ sig: '{"operator":"past"}' })
    period.value = null
    expect(sent(form)).toEqual({ sig: '' })
  })

  it('navigates with the keyboard into a unit, searches and chooses', () => {
    const element = h('div')
    document.body.append(element)
    const period = new TifPeriod(element)
    const change = vi.fn()
    element.addEventListener('change', change)
    period.open()
    const panel = period.panel
    const active = () => panel.querySelector('[data-active="true"]')?.getAttribute('data-key')
    expect(active()).toBe('all')
    for (let i = 0; i < 7; i++) {
      key(panel, 'ArrowDown')
    }
    expect(active()).toBe('quarter')
    key(panel, 'ArrowRight')
    expect(panel.querySelector('.tif-listbox-search-input')).not.toBeNull()
    expect(active()).toBe('0')
    expect(panel.querySelector('[data-active="true"] .tif-option-note')).not.toBeNull()
    const search = panel.querySelector<HTMLInputElement>('.tif-listbox-search-input')!
    search.value = 't1 2027'
    search.dispatchEvent(new Event('input'))
    expect(panel.querySelectorAll('[role="option"]')).toHaveLength(1)
    expect(panel.querySelector('mark')).not.toBeNull()
    key(search, 'Enter')
    expect(period.value).toMatchObject({ operator: 'period', unit: 'quarter' })
    expect(change).toHaveBeenCalledTimes(1)
    expect(period.floating.isOpen).toBe(false)
  })

  it('goes back to the start with Escape in a sub-menu, then closes', () => {
    const element = h('div')
    document.body.append(element)
    const period = new TifPeriod(element)
    period.open()
    const row = period.panel.querySelector<HTMLElement>('[data-key="month"]')!
    row.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(period.panel.querySelector('.tif-listbox-search-input')).not.toBeNull()
    key(document.activeElement ?? period.panel, 'Escape')
    expect(period.floating.isOpen).toBe(true)
    expect(period.panel.querySelector('.tif-listbox-search-input')).toBeNull()
    key(period.panel, 'Escape')
    expect(period.floating.isOpen).toBe(false)
  })

  it('applies specific dates', () => {
    const element = h('div')
    document.body.append(element)
    const period = new TifPeriod(element, { value: { operator: 'period', unit: 'month', from: 0, to: 0 } })
    period.open()
    period.panel.querySelector<HTMLElement>('[data-key="between"]')!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    const [from, to] = period.panel.querySelectorAll<HTMLInputElement>('.tif-picker-input')
    expect(from.value).not.toBe('')
    const apply = period.panel.querySelector<HTMLButtonElement>('.tif-btn-primary')!
    expect(apply.disabled).toBe(false)
    type(to, '1/1/2020')
    expect(apply.disabled).toBe(true)
    type(from, '1/12/2019')
    expect(apply.disabled).toBe(false)
    apply.click()
    expect(period.value).toEqual({ operator: 'between', from: '2019-12-01', to: '2020-01-01' })
    expect(period.panel.isConnected).toBe(false)
  })

  it('hides past and specific dates when relative only', () => {
    const period = new TifPeriod(h('div'), { relativeOnly: true })
    document.body.append(period.element)
    period.open()
    expect(period.panel.querySelector('[data-key="past"]')).toBeNull()
    expect(period.panel.querySelector('[data-key="between"]')).toBeNull()
  })
})
