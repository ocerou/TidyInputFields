import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TifFile, formatSize, parseSize } from '../../src/components/index.ts'
import { accepts } from '../../src/components/file.ts'
import { h } from '../../src/core/dom.ts'
import { setLocale } from '../../src/i18n/i18n.ts'

const file = (name: string, size: number, type = '') => new File([new Uint8Array(size)], name, { type })
const names = (component: TifFile) => component.value.map((f) => f.name)

beforeEach(() => setLocale('en'))
afterEach(() => {
  document.body.replaceChildren()
  setLocale(null)
})

describe('file helpers', () => {
  it('reads and writes sizes', () => {
    expect(parseSize('5MB')).toBe(5 * 1024 * 1024)
    expect(parseSize('500 Ko')).toBe(500 * 1024)
    expect(parseSize('1,5 GB')).toBe(Math.round(1.5 * 1024 ** 3))
    expect(parseSize(2048)).toBe(2048)
    expect(parseSize('big')).toBe(0)
    expect(formatSize(1536)).toBe('1.5 kB')
    expect(formatSize(12)).toBe('12 byte')
  })

  it('matches accept like a native field', () => {
    expect(accepts(file('a.pdf', 1, 'application/pdf'), '.pdf')).toBe(true)
    expect(accepts(file('a.png', 1, 'image/png'), 'image/*')).toBe(true)
    expect(accepts(file('a.png', 1, 'image/png'), 'application/pdf, .doc')).toBe(false)
    expect(accepts(file('a.txt', 1), '')).toBe(true)
  })
})

describe('file', () => {
  it('keeps files, refuses the wrong type, the too big and the too many, and lists them', () => {
    const element = h('div')
    document.body.append(element)
    const component = new TifFile(element, { multiple: true, accept: 'image/*,.pdf', maxSize: '1KB', maxFiles: 2 })
    const change = vi.fn()
    element.addEventListener('change', change)
    component.addFiles([file('photo.png', 500, 'image/png'), file('notes.txt', 10, 'text/plain'), file('huge.pdf', 5000, 'application/pdf')])
    expect(names(component)).toEqual(['photo.png'])
    const message = element.querySelector<HTMLElement>('.tif-file-message')!
    expect(message.hidden).toBe(false)
    expect(message.textContent).toContain('notes.txt: this type of file is not accepted.')
    expect(message.textContent).toContain('huge.pdf is larger than 1 kB.')
    component.addFiles([file('a.pdf', 10, 'application/pdf'), file('b.pdf', 10, 'application/pdf')])
    expect(names(component)).toEqual(['photo.png', 'a.pdf'])
    expect(message.textContent).toBe('At most 2 files.')
    expect([...element.querySelectorAll('.tif-file-name')].map((n) => n.textContent)).toEqual(['photo.png', 'a.pdf'])
    expect(change).toHaveBeenCalledTimes(2)
    element.querySelector<HTMLButtonElement>('.tif-file-item .tif-icon-btn')!.click()
    expect(names(component)).toEqual(['a.pdf'])
  })

  it('replaces the file without multiple, and ignores the same file dropped twice', () => {
    const component = new TifFile(h('div'), { multiple: true })
    const same = file('a.txt', 3)
    component.addFiles([same])
    component.addFiles([same])
    expect(names(component)).toEqual(['a.txt'])
    const single = new TifFile(h('div'))
    single.addFiles([file('one.txt', 1)])
    single.addFiles([file('two.txt', 1)])
    expect(names(single)).toEqual(['two.txt'])
  })

  it('dresses an existing file input and gives it back', () => {
    const native = h('input', { type: 'file', name: 'doc' })
    const wrapper = h('div', {}, native)
    document.body.append(wrapper)
    const component = new TifFile(native, { multiple: true })
    expect(native.multiple).toBe(true)
    expect(wrapper.querySelector('.tif-file')!.contains(native)).toBe(true)
    component.dispose()
    expect(wrapper.firstElementChild).toBe(native)
  })
})
