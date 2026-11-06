import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TifRating } from '../../src/components/index.ts'
import { h } from '../../src/core/dom.ts'
import { setLocale } from '../../src/i18n/i18n.ts'

const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }))
const fills = (rating: TifRating) => [...rating.group.querySelectorAll<HTMLElement>('.tif-star')].map((s) => s.style.getPropertyValue('--tif-star-fill'))

beforeEach(() => setLocale('en'))
afterEach(() => {
  document.body.replaceChildren()
  setLocale(null)
})

describe('rating', () => {
  it('is a radio group of stars that the form sends', () => {
    const form = h('form', {}, h('div', { id: 'host' }))
    document.body.append(form)
    const rating = new TifRating(form.querySelector<HTMLElement>('#host')!, { name: 'q', value: 3 })
    expect(rating.group.getAttribute('role')).toBe('radiogroup')
    const stars = [...rating.group.querySelectorAll('button')]
    expect(stars).toHaveLength(5)
    expect(stars.map((s) => s.getAttribute('aria-checked'))).toEqual(['false', 'false', 'true', 'false', 'false'])
    expect(stars[2].getAttribute('aria-label')).toBe('3 stars out of 5')
    expect(fills(rating)).toEqual(['100%', '100%', '100%', '0%', '0%'])
    expect(Object.fromEntries(new FormData(form))).toEqual({ q: '3' })
  })

  it('chooses by click, clears by clicking the current rating, and tells the form', () => {
    const element = h('div')
    document.body.append(element)
    const rating = new TifRating(element, { value: 2 })
    const change = vi.fn()
    element.addEventListener('change', change)
    rating.group.querySelector<HTMLButtonElement>('[data-star="4"]')!.click()
    expect(rating.value).toBe(4)
    rating.group.querySelector<HTMLButtonElement>('[data-star="4"]')!.click()
    expect(rating.value).toBe(0)
    expect(change).toHaveBeenCalledTimes(2)
  })

  it('moves with the keyboard', () => {
    const element = h('div')
    document.body.append(element)
    const rating = new TifRating(element, { max: 10, value: 5 })
    key(rating.group, 'ArrowRight')
    expect(rating.value).toBe(6)
    key(rating.group, 'End')
    expect(rating.value).toBe(10)
    key(rating.group, 'ArrowRight')
    expect(rating.value).toBe(10)
    key(rating.group, '3')
    expect(rating.value).toBe(3)
    key(rating.group, '0')
    expect(rating.value).toBe(0)
    key(rating.group, 'Home')
    expect(rating.value).toBe(1)
  })

  it('shows a decimal rating by half stars when read-only', () => {
    const rating = new TifRating(h('div'), { value: 3.5, readonly: true })
    expect(rating.group.getAttribute('role')).toBe('img')
    expect(rating.group.querySelector('button')).toBeNull()
    expect(fills(rating)).toEqual(['100%', '100%', '100%', '50%', '0%'])
    expect(rating.group.getAttribute('aria-label')).toBe('Rating: 3.5 stars out of 5')
    setLocale('fr')
    expect(rating.group.getAttribute('aria-label')).toBe('Note : 3,5 étoiles sur 5')
  })

  it('dresses an existing input and gives it back', () => {
    const native = h('input', { name: 'q', value: '4' })
    document.body.append(native)
    const rating = new TifRating(native)
    expect(native.type).toBe('hidden')
    expect(rating.value).toBe(4)
    rating.dispose()
    expect(native.type).toBe('text')
  })
})
