import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { TifRange } from '../../src/components/index.ts'
import { h } from '../../src/core/dom.ts'
import { setLocale } from '../../src/i18n/i18n.ts'

// Espaces insécables (fines en français) ramenés à des espaces simples pour comparer.
const plain = (text: string | null | undefined) => (text ?? '').replace(/[  ]/g, ' ')

beforeEach(() => setLocale('fr'))
afterEach(() => {
  document.body.replaceChildren()
  setLocale(null)
})

describe('range', () => {
  it('shows the value with its unit, fills the track and shows the bounds', () => {
    const form = h('form', {}, h('div', { id: 'host' }))
    document.body.append(form)
    const range = new TifRange(form.querySelector<HTMLElement>('#host')!, { name: 'd', min: 0, max: 2000, value: '1500', unit: '€', ticks: true })
    const frame = form.querySelector<HTMLElement>('.tif-range')!
    expect(range.control.type).toBe('range')
    expect(plain(frame.querySelector('output')!.textContent)).toBe('1 500 €')
    expect(frame.style.getPropertyValue('--tif-range-fill')).toBe('75%')
    expect([...frame.querySelectorAll('.tif-range-bounds span')].map((s) => plain(s.textContent))).toEqual(['0 €', '2 000 €'])
    expect(plain(range.control.getAttribute('aria-valuetext'))).toBe('1 500 €')
    expect(Object.fromEntries(new FormData(form))).toEqual({ d: '1500' })
  })

  it('agrees the unit with the number and follows the input', () => {
    const range = new TifRange(h('div'), { min: 1, max: 24, value: '1', unit: (n: number | null) => (n === 1 ? 'mois' : 'mois') })
    range.setOptions({ unit: (n: number | null) => (n === 1 ? 'an' : 'ans') })
    const output = range.element.querySelector('output')!
    expect(output.textContent).toBe('1 an')
    range.control.value = '3'
    range.control.dispatchEvent(new Event('input'))
    expect(output.textContent).toBe('3 ans')
    expect(range.number).toBe(3)
  })

  it('dresses an existing range input and gives it back', () => {
    const native = h('input', { type: 'range', name: 'v', value: '20' })
    const wrapper = h('div', {}, native)
    document.body.append(wrapper)
    const range = new TifRange(native)
    expect(wrapper.querySelector('.tif-range')!.contains(native)).toBe(true)
    range.dispose()
    expect(wrapper.firstElementChild).toBe(native)
    expect(wrapper.querySelector('.tif-range')).toBeNull()
  })
})
