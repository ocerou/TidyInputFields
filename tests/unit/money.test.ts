import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TifMoney, parseAmount } from '../../src/components/index.ts'
import { h } from '../../src/core/dom.ts'
import { setLocale } from '../../src/i18n/i18n.ts'

const plain = (text: string) => text.replace(/[  ]/g, ' ')

beforeEach(() => setLocale('fr'))
afterEach(() => {
  document.body.replaceChildren()
  setLocale(null)
})

describe('parseAmount', () => {
  it('reads amounts in every usual writing', () => {
    expect(parseAmount('1 234,50', 'fr')).toBe(1234.5)
    expect(parseAmount('1234.5', 'fr')).toBe(1234.5)
    expect(parseAmount('1.234,5', 'de')).toBe(1234.5)
    expect(parseAmount('1.234', 'de')).toBe(1234)
    expect(parseAmount('1.234', 'en')).toBe(1.234)
    expect(parseAmount('1,234,567.89', 'en')).toBe(1234567.89)
    expect(parseAmount("1'234.50", 'de-CH')).toBe(1234.5)
    expect(parseAmount('-12', 'fr')).toBe(-12)
    expect(parseAmount(',5', 'fr')).toBe(0.5)
    expect(parseAmount('', 'fr')).toBe('')
    expect(parseAmount('12 €', 'fr')).toBeNull()
    expect(parseAmount('abc', 'fr')).toBeNull()
  })
})

describe('money', () => {
  it('shows the amount in the format of the language and sends a JSON number', () => {
    const form = h('form', {}, h('div', { id: 'host' }))
    document.body.append(form)
    const money = new TifMoney(form.querySelector<HTMLElement>('#host')!, { name: 'price', value: 1234.5 })
    expect(plain(money.input.value)).toBe('1 234,50')
    expect(money.zone.querySelector('.tif-money-currency')!.textContent).toBe('€')
    expect(Object.fromEntries(new FormData(form))).toEqual({ price: '1234.5' })
  })

  it('edits raw, validates on blur, keeps the amount when the typing is unreadable', () => {
    const element = h('div')
    document.body.append(element)
    const money = new TifMoney(element, { value: '10' })
    const change = vi.fn()
    element.addEventListener('change', change)
    money.input.focus()
    expect(money.input.value).toBe('10')
    money.input.value = '2 500,756'
    money.input.blur()
    expect(money.value).toBe('2500.76')
    expect(plain(money.input.value)).toBe('2 500,76')
    expect(change).toHaveBeenCalledTimes(1)
    money.input.value = 'nope'
    money.validate()
    expect(money.value).toBe('2500.76')
    expect(change).toHaveBeenCalledTimes(1)
  })

  it('uses the decimals of the currency and lets the user choose it', () => {
    const form = h('form', {}, h('div', { id: 'host' }))
    document.body.append(form)
    const money = new TifMoney(form.querySelector<HTMLElement>('#host')!, { name: 'a', currency: 'JPY', currencies: ['EUR', 'JPY', 'USD'], currencyName: 'cur', value: '1234.6' })
    expect(money.value).toBe('1235')
    const select = money.zone.querySelector('select')!
    expect(select.hidden).toBe(false)
    expect(select.value).toBe('JPY')
    select.value = 'USD'
    select.dispatchEvent(new Event('change'))
    expect(money.currency).toBe('USD')
    expect(Object.fromEntries(new FormData(form))).toEqual({ a: '1235', cur: 'USD' })
  })

  it('dresses an existing input and gives it back', () => {
    const native = h('input', { type: 'number', name: 'p', value: '9.9', id: 'p' })
    document.body.append(native)
    const money = new TifMoney(native)
    expect(native.type).toBe('hidden')
    expect(money.input.id).toBe('p')
    expect(money.amount).toBe(9.9)
    money.dispose()
    expect(native.type).toBe('number')
    expect(native.id).toBe('p')
  })
})
