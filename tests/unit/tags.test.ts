import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TifTags } from '../../src/components/index.ts'
import { h } from '../../src/core/dom.ts'
import { setLocale } from '../../src/i18n/i18n.ts'

const type = (input: HTMLInputElement, text: string) => {
  input.value = text
  input.dispatchEvent(new Event('input', { bubbles: true }))
}
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))
const labels = (tags: TifTags) => [...tags.zone.querySelectorAll('.tif-tag-label')].map((l) => l.textContent)

beforeEach(() => setLocale('en'))
afterEach(() => {
  document.body.replaceChildren()
  setLocale(null)
})

describe('tags', () => {
  it('creates tags with Enter and separators, without duplicates', () => {
    const element = h('div')
    document.body.append(element)
    const tags = new TifTags(element, { name: 'k' })
    const change = vi.fn()
    element.addEventListener('change', change)
    type(tags.input, 'crm')
    key(tags.input, 'Enter')
    type(tags.input, 'sales,')
    type(tags.input, 'CRM')
    key(tags.input, 'Enter')
    expect(tags.value).toEqual(['crm', 'sales'])
    expect(tags.input.value).toBe('CRM')
    expect(change).toHaveBeenCalledTimes(2)
    const hidden = [...element.querySelectorAll<HTMLInputElement>('input[type="hidden"]')].map((i) => [i.name, i.value])
    expect(hidden).toEqual([
      ['k', 'crm'],
      ['k', 'sales'],
    ])
  })

  it('removes the last tag with Backspace in the empty field, or one with its cross', () => {
    const tags = new TifTags(h('div'), { value: 'a, b, c' })
    document.body.append(tags.element)
    key(tags.input, 'Backspace')
    expect(tags.value).toEqual(['a', 'b'])
    tags.zone.querySelector<HTMLButtonElement>('[data-value="a"] .tif-tag-remove')!.click()
    expect(tags.value).toEqual(['b'])
  })

  it('splits a pasted list', () => {
    const tags = new TifTags(h('div'))
    const paste = new Event('paste', { bubbles: true, cancelable: true }) as Event & { clipboardData: unknown }
    paste.clipboardData = { getData: () => 'one, two\nthree' }
    tags.input.dispatchEvent(paste)
    expect(tags.value).toEqual(['one', 'two', 'three'])
  })

  it('suggests, accepts only suggestions without allowNew, and stops at max', () => {
    const element = h('div')
    document.body.append(element)
    const tags = new TifTags(element, {
      allowNew: false,
      max: 2,
      options: [
        { value: 'js', label: 'JavaScript' },
        { value: 'ts', label: 'TypeScript' },
        { value: 'css', label: 'CSS' },
      ],
    })
    type(tags.input, 'script')
    expect([...tags.panel.querySelectorAll('[role="option"]')].map((o) => o.textContent)).toEqual(['JavaScript', 'TypeScript'])
    key(tags.input, 'ArrowDown')
    key(tags.input, 'Enter')
    expect(tags.value).toEqual(['ts'])
    expect(labels(tags)).toEqual(['TypeScript'])
    expect(tags.add('Python')).toBe(false)
    expect(tags.add('css')).toBe(true)
    expect(tags.value).toEqual(['ts', 'css'])
    expect(tags.input.readOnly).toBe(true)
    expect(tags.add('JavaScript')).toBe(false)
  })

  it('dresses an existing input and gives it back', () => {
    const native = h('input', { name: 'k', value: 'x, y', placeholder: 'Keywords' })
    const form = h('form', {}, native)
    document.body.append(form)
    const tags = new TifTags(native)
    expect(tags.input).toBe(native)
    expect(native.hasAttribute('name')).toBe(false)
    expect(tags.value).toEqual(['x', 'y'])
    tags.dispose()
    expect(native.name).toBe('k')
    expect(native.value).toBe('x, y')
    expect(form.querySelector('.tif-tags')).toBeNull()
  })

  it('turns orange when required and empty', () => {
    const tags = new TifTags(h('div'), { required: true })
    expect(tags.zone.classList.contains('tif-missing')).toBe(true)
    tags.add('a')
    expect(tags.zone.classList.contains('tif-missing')).toBe(false)
  })
})
