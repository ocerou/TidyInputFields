import { afterEach, describe, expect, it, vi } from 'vitest'
import { TifNumber, TifSelect, TifSelector, TifSwitch, TifText, TifTextarea, TifUnit, unitValue } from '../../src/components/index.ts'
import { init } from '../../src/core/data-api.ts'
import { h } from '../../src/core/dom.ts'

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))
const html = (markup: string) => {
  const form = document.createElement('form')
  form.innerHTML = markup
  document.body.append(form)
  return form
}
const sent = (form: HTMLFormElement) => Object.fromEntries(new FormData(form))

afterEach(() => {
  document.body.replaceChildren()
})

describe('text', () => {
  it('dresses an existing input without replacing it', () => {
    const input = h('input', { name: 'a', value: 'x', placeholder: 'kept' })
    document.body.append(input)
    const text = new TifText(input, { type: 'email' })
    expect(text.control).toBe(input)
    expect(input.type).toBe('email')
    expect(input.placeholder).toBe('kept')
    expect(input.classList.contains('tif-input')).toBe(true)
    expect(text.value).toBe('x')
    text.dispose()
    expect(input.isConnected).toBe(true)
    expect(input.classList.contains('tif-input')).toBe(false)
  })

  it('keeps the look of Bootstrap fields', () => {
    const input = h('input', { class: 'form-control' })
    new TifText(input)
    expect(input.classList.contains('tif-input')).toBe(false)
  })

  it('creates its input inside a tag, from the attributes', async () => {
    const form = html('<tif-text name="title" value="Hello" required placeholder="Title" input-id="t" maxlength="20"></tif-text>')
    const input = form.querySelector('input')!
    expect(input.name).toBe('title')
    expect(input.id).toBe('t')
    expect(input.required).toBe(true)
    expect(input.maxLength).toBe(20)
    expect(sent(form)).toEqual({ title: 'Hello' })
    const tag = form.querySelector('tif-text') as HTMLElement & { value: unknown }
    tag.value = 'Changed'
    expect(input.value).toBe('Changed')
    tag.setAttribute('disabled', '')
    expect(input.disabled).toBe(true)
    tag.removeAttribute('disabled')
    expect(input.disabled).toBe(false)
    tag.remove()
    await flush()
    expect(input.isConnected).toBe(false)
  })

  it('is created from data-tif', () => {
    const form = html('<input name="mail" data-tif="text" data-tif-type="email">')
    init(form)
    expect(form.querySelector('input')!.type).toBe('email')
  })

  it('toggles the quiet look', () => {
    const text = new TifText(h('input'), { quiet: true })
    expect(text.control.classList.contains('tif-quiet')).toBe(true)
    text.setOptions({ quiet: false })
    expect(text.control.classList.contains('tif-quiet')).toBe(false)
  })
})

describe('number', () => {
  it('sets bounds and reads numbers', () => {
    const form = html('<tif-number name="q" min="0" max="10" step="2" value="4"></tif-number>')
    const input = form.querySelector('input')!
    expect(input.type).toBe('number')
    expect([input.min, input.max, input.step]).toEqual(['0', '10', '2'])
    expect(input.classList.contains('tif-mono')).toBe(true)
    const number = TifNumber.getInstance(form.querySelector('tif-number'))!
    expect(number.number).toBe(4)
    number.value = ''
    expect(number.number).toBeNull()
  })
})

describe('textarea', () => {
  it('creates a text area with its rows', () => {
    const form = html('<tif-textarea name="notes" rows="5" value="Line"></tif-textarea>')
    const area = form.querySelector('textarea')!
    expect(area.getAttribute('rows')).toBe('5')
    expect(area.classList.contains('tif-textarea')).toBe(true)
    expect(TifTextarea.getInstance(form.querySelector('tif-textarea'))!.value).toBe('Line')
  })
})

describe('select', () => {
  it('moves the written options into the list, with a placeholder', () => {
    const form = html('<tif-select name="c" placeholder="Choose"><option value="fr">France</option><option value="de">Germany</option></tif-select>')
    const select = form.querySelector('select')!
    expect([...select.options].map((o) => o.value)).toEqual(['', 'fr', 'de'])
    expect(select.options[0].hidden).toBe(true)
    expect(select.value).toBe('')
    select.value = 'de'
    expect(sent(form)).toEqual({ c: 'de' })
  })

  it('builds options and groups from an array, keeping the value', () => {
    const element = h('div')
    const select = new TifSelect(element, {
      value: 'b',
      options: [
        { value: 'a', label: 'A', group: 'First' },
        { value: 'b', label: 'B', group: 'First' },
        { value: 'c', label: 'C' },
      ],
    })
    expect(select.control.querySelectorAll('optgroup')).toHaveLength(1)
    expect(select.value).toBe('b')
    select.setOptions({ options: [{ value: 'b', label: 'Bee' }] })
    expect(select.value).toBe('b')
    expect(select.control.options[0].textContent).toBe('Bee')
  })

  it('keeps the selection of an existing select when adding a placeholder', () => {
    const native = h('select', {}, h('option', { value: 'x' }, 'X'), h('option', { value: 'y', selected: true }, 'Y'))
    new TifSelect(native, { placeholder: 'Pick' })
    expect(native.value).toBe('y')
  })
})

describe('switch', () => {
  it('is a checkbox with role switch; its value is the checked state', () => {
    const form = html('<tif-switch name="active" checked></tif-switch>')
    const input = form.querySelector('input')!
    expect(input.type).toBe('checkbox')
    expect(input.getAttribute('role')).toBe('switch')
    expect(sent(form)).toEqual({ active: 'on' })
    const toggle = TifSwitch.getInstance(form.querySelector('tif-switch'))!
    expect(toggle.value).toBe(true)
    const change = vi.fn()
    input.addEventListener('change', change)
    toggle.toggle()
    expect(toggle.value).toBe(false)
    expect(change).toHaveBeenCalledTimes(1)
    expect(sent(form)).toEqual({})
    toggle.value = 'true'
    expect(input.checked).toBe(true)
  })

  it('turns an input without type into a checkbox', () => {
    const input = h('input')
    new TifSwitch(input)
    expect(input.type).toBe('checkbox')
  })
})

describe('unit', () => {
  it('wraps the input and lets the unit follow the digits', () => {
    const input = h('input', { name: 'd', value: '1' })
    const wrapper = h('div', {}, input)
    document.body.append(wrapper)
    const unit = new TifUnit(input, { unit: (n: number | null) => (n === 1 ? 'month' : 'months') })
    const zone = wrapper.querySelector('.tif-unit')!
    expect(zone.contains(input)).toBe(true)
    expect(zone.querySelector('.tif-unit-label')!.textContent).toBe('month')
    expect(input.style.width).toBe('1.5ch')
    input.value = '12'
    input.dispatchEvent(new Event('input'))
    expect(zone.querySelector('.tif-unit-label')!.textContent).toBe('months')
    expect(input.style.width).toBe('2.5ch')
    unit.value = '1'
    expect(zone.querySelector('.tif-unit-label')!.textContent).toBe('month')
    unit.dispose()
    expect(wrapper.firstElementChild).toBe(input)
    expect(wrapper.querySelector('.tif-unit')).toBeNull()
  })

  it('aligns right and takes a text unit from a tag', () => {
    const form = html('<tif-unit name="price" unit="€" align="right" value="9"></tif-unit>')
    const zone = form.querySelector('.tif-unit')!
    expect(zone.classList.contains('tif-unit-end')).toBe(true)
    expect(zone.textContent).toBe('€')
    expect(sent(form)).toEqual({ price: '9' })
  })

  it('renders a read-only value at the same place', () => {
    const value = unitValue(3, (n) => (n === 1 ? 'day' : 'days'), 'right')
    expect(value.textContent).toBe('3days')
    expect(value.classList.contains('tif-unit-end')).toBe(true)
  })
})

describe('selector', () => {
  it('shows the written options as radio buttons and sends the value', () => {
    const form = html('<tif-selector name="mode" label="Mode" value="b"><option value="a">A</option><option value="b">B</option></tif-selector>')
    const group = form.querySelector('[role="radiogroup"]')!
    expect(group.getAttribute('aria-label')).toBe('Mode')
    const buttons = [...group.querySelectorAll('button')]
    expect(buttons.map((b) => b.getAttribute('aria-checked'))).toEqual(['false', 'true'])
    expect(buttons.map((b) => b.tabIndex)).toEqual([-1, 0])
    expect(sent(form)).toEqual({ mode: 'b' })
  })

  it('chooses by click and arrows, and tells the form', () => {
    const element = h('div')
    document.body.append(element)
    const selector = new TifSelector(element, {
      name: 'size',
      value: 's',
      options: [
        { value: 's', label: 'S' },
        { value: 'm', label: 'M' },
        { value: 'l', label: 'L' },
      ],
    })
    const change = vi.fn()
    element.addEventListener('change', change)
    selector.group.querySelectorAll('button')[2].click()
    expect(selector.value).toBe('l')
    expect(change).toHaveBeenCalledTimes(1)
    selector.group.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    expect(selector.value).toBe('s')
    selector.group.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    expect(selector.value).toBe('l')
    expect(change).toHaveBeenCalledTimes(3)
    selector.value = 'm'
    expect(change).toHaveBeenCalledTimes(3)
    expect(selector.group.querySelector('[aria-checked="true"]')!.textContent).toBe('M')
    selector.setOptions({ disabled: true })
    selector.group.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    expect(selector.value).toBe('m')
  })

  it('dresses a native select, hidden, and gives it back', () => {
    const select = h('select', { name: 's' }, h('option', { value: 'S' }, 'S'), h('option', { value: 'M', selected: true }, 'M'))
    document.body.append(select)
    const selector = new TifSelector(select)
    expect(select.hidden).toBe(true)
    expect(select.nextElementSibling).toBe(selector.group)
    expect(selector.value).toBe('M')
    select.value = 'S'
    select.dispatchEvent(new Event('change'))
    expect(selector.group.querySelector('[aria-checked="true"]')!.textContent).toBe('S')
    selector.dispose()
    expect(select.hidden).toBe(false)
    expect(document.querySelector('.tif-selector')).toBeNull()
  })
})
