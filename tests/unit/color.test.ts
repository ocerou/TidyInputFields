import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TifColorPicker, colorValue } from '../../src/components/index.ts'
import { h } from '../../src/core/dom.ts'
import { setLocale } from '../../src/i18n/i18n.ts'
import { composeColor, hslaToHex, parseColor, rgbToHsl, splitColor, transparencyOf } from '../../src/utils/color.ts'

beforeEach(() => setLocale('en'))
afterEach(() => {
  document.body.replaceChildren()
  setLocale(null)
})

describe('colour helpers', () => {
  it('reads hexadecimal and RGB entries', () => {
    expect(parseColor('#062B6F')).toEqual({ rgb: '#062B6F', alpha: null })
    expect(parseColor('062b6f80')).toEqual({ rgb: '#062B6F', alpha: 128 })
    expect(parseColor('#06f')).toEqual({ rgb: '#0066FF', alpha: null })
    expect(parseColor('rgb(6, 43, 111)')).toEqual({ rgb: '#062B6F', alpha: null })
    expect(parseColor('rgba(6, 43, 111, 0.5)')).toEqual({ rgb: '#062B6F', alpha: 128 })
    expect(parseColor('6 43 111 50%')).toEqual({ rgb: '#062B6F', alpha: 128 })
    expect(parseColor('')).toBeNull()
    expect(parseColor('300, 0, 0')).toBeUndefined()
    expect(parseColor('blue')).toBeUndefined()
  })

  it('stores #RRGGBB when opaque, #RRGGBBAA otherwise', () => {
    expect(composeColor({ rgb: '#062B6F', alpha: 255 })).toBe('#062B6F')
    expect(composeColor({ rgb: '#062B6F', alpha: 128 })).toBe('#062B6F80')
    expect(splitColor('#062B6F80')).toEqual({ rgb: '#062B6F', alpha: 128 })
    expect(splitColor('nope')).toBeNull()
    expect(transparencyOf(255)).toBe(0)
    expect(transparencyOf(0)).toBe(100)
  })

  it('goes to hue, saturation, lightness and back', () => {
    for (const rgb of ['#062B6F', '#FF0000', '#808080', '#FFFFFF', '#0E7C86']) {
      expect(hslaToHex({ ...rgbToHsl(rgb), alpha: 255 })).toBe(rgb)
    }
  })
})

describe('colour picker', () => {
  it('shows the colour, its code and its transparency, and sends the value', () => {
    const form = h('form', {}, h('div', { id: 'host' }))
    document.body.append(form)
    const picker = new TifColorPicker(form.querySelector<HTMLElement>('#host')!, { name: 'brand', value: 'rgba(6, 43, 111, 0.5)' })
    expect(picker.value).toBe('#062B6F80')
    expect(picker.button.textContent).toBe('#062B6F50 %')
    expect(Object.fromEntries(new FormData(form))).toEqual({ brand: '#062B6F80' })
    picker.value = ''
    expect(picker.button.textContent).toBe('No colour')
  })

  it('opens with the cursor in Red, applies typed values with Enter', () => {
    const element = h('div')
    document.body.append(element)
    const picker = new TifColorPicker(element, { value: '#062B6F' })
    const change = vi.fn()
    element.addEventListener('change', change)
    picker.open()
    const [red, green, blue, hex, percent] = picker.panel.querySelectorAll('input')
    expect(document.activeElement).toBe(red)
    expect([red.value, green.value, blue.value, hex.value, percent.value]).toEqual(['6', '43', '111', '#062B6F', '0'])
    hex.value = '#f00'
    hex.dispatchEvent(new Event('input'))
    expect(red.value).toBe('255')
    percent.value = '50'
    percent.dispatchEvent(new Event('input'))
    hex.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(picker.value).toBe('#FF000080')
    expect(change).toHaveBeenCalledTimes(1)
    expect(picker.floating.isOpen).toBe(false)
  })

  it('removes the colour, or closes without change', () => {
    const element = h('div')
    document.body.append(element)
    const picker = new TifColorPicker(element, { value: '#062B6F' })
    picker.open()
    picker.panel.querySelector<HTMLInputElement>('input')!.value = '200'
    picker.panel.querySelector<HTMLInputElement>('input')!.dispatchEvent(new Event('input'))
    picker.panel.querySelector<HTMLButtonElement>(`[aria-label="Cancel"]`)!.click()
    expect(picker.value).toBe('#062B6F')
    picker.open()
    picker.panel.querySelector<HTMLButtonElement>(`[aria-label="Remove colour"]`)!.click()
    expect(picker.value).toBe('')
  })

  it('dresses an <input type="color"> and gives it back', () => {
    const native = h('input', { type: 'color', name: 'c', value: '#0e7c86', id: 'c' })
    document.body.append(native)
    const picker = new TifColorPicker(native)
    expect(native.type).toBe('hidden')
    expect(picker.value).toBe('#0E7C86')
    expect(picker.button.id).toBe('c')
    picker.dispose()
    expect(native.type).toBe('color')
    expect(native.id).toBe('c')
  })

  it('renders a read-only value', () => {
    expect(colorValue('#0E7C86').textContent).toBe('#0E7C86')
    expect(colorValue(null).querySelector('.tif-none')).not.toBeNull()
  })
})
