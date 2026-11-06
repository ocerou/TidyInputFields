import { afterEach, describe, expect, it, vi } from 'vitest'
import { coerce, Component, readOptions } from '../../src/core/component.ts'
import { dispose, init, observe } from '../../src/core/data-api.ts'
import { h } from '../../src/core/dom.ts'
import { computePosition, containerFor, Floating } from '../../src/core/floating.ts'
import { icon, iconNames, setIcons } from '../../src/core/icons.ts'
import { jQueryName } from '../../src/core/jquery.ts'
import { register } from '../../src/core/registry.ts'
import { setLocale } from '../../src/i18n/i18n.ts'

// Composant d'essai : recopie son option « label » dans l'élément et compte les retraductions.
class Probe extends Component {
  static override NAME = 'probe'
  static override DEFAULTS = { label: 'none', count: 1, active: false, data: null as unknown }
  translations = 0
  disposedCount = 0

  constructor(element: HTMLElement, options = {}) {
    super(element, options)
    this.render()
  }

  override get value() {
    return this.options.label
  }

  override set value(value: unknown) {
    this.setOptions({ label: String(value) })
  }

  render() {
    this.element.dataset.label = String(this.options.label)
  }

  open() {
    return this.emit('show', { at: 1 }, true)
  }

  protected override optionsChanged() {
    this.render()
  }

  protected override localeChanged() {
    this.translations++
  }

  override dispose() {
    this.disposedCount++
    super.dispose()
  }
}

register(Probe)

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

afterEach(() => {
  document.body.replaceChildren()
  setLocale(null)
})

describe('options', () => {
  it('coerces attribute values by the type of the default', () => {
    expect(coerce('', false)).toBe(true)
    expect(coerce('false', true)).toBe(false)
    expect(coerce('12', 1)).toBe(12)
    expect(coerce('x', 1)).toBe(1)
    expect(coerce('12', 'a')).toBe('12')
    expect(coerce('{"a":1}', null)).toEqual({ a: 1 })
    expect(coerce('true', undefined)).toBe(true)
    expect(coerce('3.5', undefined)).toBe(3.5)
    expect(coerce('[oops', undefined)).toBe('[oops')
  })

  it('reads data-tif-* attributes, then JavaScript options win', () => {
    const element = h('div', { 'data-tif-label': 'from-attr', 'data-tif-count': '4', 'data-tif-active': '' })
    expect(readOptions(element, Probe.DEFAULTS)).toEqual({ label: 'from-attr', count: 4, active: true })
    const probe = new Probe(element, { count: 9 })
    expect(probe.options).toEqual({ label: 'from-attr', count: 9, active: true, data: null })
  })
})

describe('component', () => {
  it('keeps one instance per element, found by getInstance', () => {
    const element = h('div')
    document.body.append(element)
    const probe = Probe.getOrCreateInstance(element, { label: 'a' })
    expect(Probe.getOrCreateInstance(element)).toBe(probe)
    expect(Probe.getInstance(element)).toBe(probe)
    expect(Probe.getInstance(null)).toBeNull()
    element.id = 'p'
    expect(Probe.getInstance('#p')).toBe(probe)
    probe.dispose()
    expect(Probe.getInstance(element)).toBeNull()
    expect(probe.disposed).toBe(true)
  })

  it('replaces an older instance created on the same element', () => {
    const element = h('div')
    const first = new Probe(element)
    const second = new Probe(element)
    expect(first.disposed).toBe(true)
    expect(Probe.getInstance(element)).toBe(second)
  })

  it('emits namespaced, cancelable events that bubble', () => {
    const element = h('div')
    document.body.append(element)
    const probe = new Probe(element)
    const listener = vi.fn((event: Event) => event.preventDefault())
    document.body.addEventListener('show.tif.probe', listener)
    expect(probe.open()).toBe(false)
    expect((listener.mock.calls[0][0] as CustomEvent).detail).toEqual({ at: 1 })
    document.body.removeEventListener('show.tif.probe', listener)
    expect(probe.open()).toBe(true)
  })

  it('is told when the language changes, until disposed', () => {
    const probe = new Probe(h('div'))
    setLocale('fr')
    expect(probe.translations).toBe(1)
    probe.dispose()
    setLocale('de')
    expect(probe.translations).toBe(1)
  })
})

describe('data api', () => {
  it('initialises elements marked data-tif, once', () => {
    document.body.append(h('div', { 'data-tif': 'probe', 'data-tif-label': 'x' }), h('div', { 'data-tif': 'probe' }))
    expect(init()).toHaveLength(2)
    const first = document.body.firstElementChild as HTMLElement
    expect(first.dataset.label).toBe('x')
    expect(Probe.getInstance(first)).not.toBeNull()
    init()
    expect(Probe.getInstance(first)!.disposedCount).toBe(0)
  })

  it('warns about unknown components', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    document.body.append(h('div', { 'data-tif': 'nothing' }))
    init()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('disposes a subtree', () => {
    const element = h('div', { 'data-tif': 'probe' })
    const wrapper = h('section', {}, element)
    document.body.append(wrapper)
    init()
    dispose(wrapper)
    expect(Probe.getInstance(element)).toBeNull()
  })

  it('observes elements added and removed later, but not moved ones', async () => {
    const stop = observe(document.body)
    const element = h('div', { 'data-tif': 'probe' })
    document.body.append(h('div', {}, element))
    await flush()
    const probe = Probe.getInstance(element)!
    expect(probe).not.toBeNull()
    const other = h('div')
    document.body.append(other)
    other.append(element)
    await flush()
    expect(probe.disposed).toBe(false)
    element.remove()
    await flush()
    expect(probe.disposed).toBe(true)
    stop()
  })
})

describe('custom element', () => {
  it('creates the component from its attributes and follows them', async () => {
    const element = document.createElement('tif-probe')
    element.setAttribute('label', 'tag')
    document.body.append(element)
    const tag = element as HTMLElement & { instance: Probe; value: unknown }
    expect(tag.instance).toBeInstanceOf(Probe)
    expect(tag.dataset.label).toBe('tag')
    element.setAttribute('label', 'changed')
    expect(tag.dataset.label).toBe('changed')
    expect(tag.value).toBe('changed')
    tag.value = 'set'
    expect(tag.dataset.label).toBe('set')
    const probe = tag.instance
    element.remove()
    await flush()
    expect(probe.disposed).toBe(true)
  })
})

describe('jQuery bridge', () => {
  it('names plugins like Bootstrap', () => {
    expect(jQueryName('date')).toBe('tifDate')
    expect(jQueryName('search-select')).toBe('tifSearchSelect')
  })
})

describe('icons', () => {
  it('builds SVG elements without innerHTML', () => {
    const svg = icon('check')
    expect(svg.tagName.toLowerCase()).toBe('svg')
    expect(svg.getAttribute('viewBox')).toBe('0 0 16 16')
    expect(svg.getAttribute('aria-hidden')).toBe('true')
    expect(svg.querySelectorAll('path').length).toBe(1)
    expect(iconNames()).toContain('calendar')
  })

  it('accepts replacements', () => {
    setIcons({ check: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" onclick="x()"/></svg>' })
    const svg = icon('check')
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24')
    const circle = svg.querySelector('circle')!
    expect(circle.getAttribute('r')).toBe('4')
    expect(circle.hasAttribute('onclick')).toBe(false)
  })
})

describe('floating panels', () => {
  const anchor = { top: 100, bottom: 130, left: 50, right: 250, width: 200, height: 30 }
  const viewport = { width: 800, height: 600 }

  it('opens below, aligned on the start of the field', () => {
    expect(computePosition(anchor, { width: 300, height: 200 }, viewport)).toEqual({ top: 134, left: 50, placement: 'bottom-start' })
  })

  it('aligns on the end and stays inside the window', () => {
    expect(computePosition(anchor, { width: 300, height: 200 }, viewport, 'bottom-end').left).toBe(8)
    expect(computePosition({ ...anchor, left: 700, right: 790 }, { width: 300, height: 100 }, viewport).left).toBe(492)
  })

  it('opens above when there is not enough room below', () => {
    const low = { ...anchor, top: 500, bottom: 530 }
    expect(computePosition(low, { width: 300, height: 200 }, viewport)).toEqual({ top: 296, left: 50, placement: 'top-start' })
  })

  it('hangs panels inside the open modal', () => {
    const field = h('button')
    const modal = h('div', { class: 'modal show' }, h('div', { class: 'modal-dialog' }, field))
    document.body.append(modal)
    expect(containerFor(field)).toBe(modal)
    expect(containerFor(h('span'))).toBe(document.body)
  })

  it('closes on outside click and on Escape, which stays inside', () => {
    const field = h('button')
    document.body.append(field)
    const reasons: string[] = []
    const panel = h('div', {}, 'content')
    const floating = new Floating(field, panel, { onClose: (r) => reasons.push(r) })
    floating.open()
    expect(panel.isConnected).toBe(true)
    expect(panel.classList.contains('tif-panel')).toBe(true)
    panel.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    expect(floating.isOpen).toBe(true)
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    expect(floating.isOpen).toBe(false)
    expect(panel.isConnected).toBe(false)
    floating.open()
    const outer = vi.fn()
    document.body.addEventListener('keydown', outer)
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(outer).not.toHaveBeenCalled()
    expect(reasons).toEqual(['outside', 'escape'])
    expect(document.activeElement).toBe(field)
  })
})
