import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TifLookup, TifMultiSelect, TifSearchSelect, TifSortableList, type ListOption } from '../../src/components/index.ts'
import { h } from '../../src/core/dom.ts'
import { setLocale } from '../../src/i18n/i18n.ts'

const html = (markup: string) => {
  const form = document.createElement('form')
  form.innerHTML = markup
  document.body.append(form)
  return form
}
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, ...init }))
const wait = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms))
const rows = (panel: Element) => [...panel.querySelectorAll<HTMLElement>('[role="option"]')]
const labels = (panel: Element) => rows(panel).map((r) => r.querySelector('.tif-option-label')!.textContent)
const search = (panel: Element, text: string) => {
  const input = panel.querySelector<HTMLInputElement>('.tif-listbox-search-input')!
  input.value = text
  input.dispatchEvent(new Event('input'))
}

const people: ListOption[] = [
  { value: 'ada', label: 'Ada Lovelace', group: 'Users', pill: 'User' },
  { value: 'eric', label: 'Éric Dupont', group: 'Users', inactive: true },
  { value: 'core', label: 'Core team', group: 'Teams', pill: 'Team' },
]

beforeEach(() => setLocale('en'))
afterEach(() => {
  document.body.replaceChildren()
  setLocale(null)
})

describe('search select', () => {
  it('reads the written options and sends the value', () => {
    const form = html('<tif-search-select name="c" value="de"><option value="fr">France</option><option value="de">Germany</option></tif-search-select>')
    const element = form.querySelector('tif-search-select')!
    expect(element.querySelector('option')).toBeNull()
    const select = TifSearchSelect.getInstance(element)!
    expect(select.button.textContent).toBe('Germany')
    expect(Object.fromEntries(new FormData(form))).toEqual({ c: 'de' })
  })

  it('filters by every word, without accents, and shows groups in order', () => {
    const element = h('div')
    document.body.append(element)
    const select = new TifSearchSelect(element, { options: people, groupOrder: ['Teams'] })
    select.open()
    const panel = select.panel
    expect(labels(panel)).toEqual(['Core team', 'Ada Lovelace'])
    expect([...panel.querySelectorAll('.tif-option-group')].map((g) => g.textContent)).toEqual(['Teams', 'Users'])
    panel.querySelector<HTMLInputElement>('.tif-listbox-switch input')!.click()
    expect(labels(panel)).toEqual(['Core team', 'Ada Lovelace', 'Éric Dupont'])
    search(panel, 'dup eric')
    expect(labels(panel)).toEqual(['Éric Dupont'])
    expect(panel.querySelector('.tif-listbox-count')!.textContent).toBe('1 of 3')
    search(panel, 'zzz')
    expect(panel.querySelector('.tif-no-results')).not.toBeNull()
  })

  it('chooses with the keyboard and tells the form once', () => {
    const element = h('div')
    document.body.append(element)
    const select = new TifSearchSelect(element, { name: 'owner', options: people, emptyLabel: '— None —' })
    const change = vi.fn()
    element.addEventListener('change', change)
    // « t » : seule l'équipe le contient (Éric Dupont, désactivé, est masqué).
    key(select.button, 't')
    expect(select.floating.isOpen).toBe(true)
    expect(select.panel.querySelector<HTMLInputElement>('.tif-listbox-search-input')!.value).toBe('t')
    key(select.panel, 'Enter')
    expect(select.value).toBe('core')
    expect(change).toHaveBeenCalledTimes(1)
    expect(select.button.querySelector('.tif-pill')!.textContent).toBe('Team')
    select.open()
    // Sans recherche, le choix vide est en tête et le choix courant est actif.
    expect(select.panel.querySelector('[data-active="true"] .tif-option-label')!.textContent).toBe('Core team')
    key(select.panel, 'ArrowUp')
    key(select.panel, 'ArrowUp')
    key(select.panel, 'Enter')
    expect(select.value).toBe('')
    expect(change).toHaveBeenCalledTimes(2)
  })

  it('turns orange when required and empty', () => {
    const select = new TifSearchSelect(h('div'), { options: people, required: true })
    expect(select.button.classList.contains('tif-missing')).toBe(true)
    select.value = 'ada'
    expect(select.button.classList.contains('tif-missing')).toBe(false)
  })

  it('asks a remote source after typing, and reads the current label', async () => {
    const source = vi.fn(async (query: string, { limit }: { limit: number }) => {
      const all = Array.from({ length: 50 }, (_, i) => ({ value: `c${i}`, label: `Contact ${i}` }))
      const found = all.filter((c) => c.label.includes(query))
      return { options: found.slice(0, limit), total: found.length }
    })
    const element = h('div')
    document.body.append(element)
    const select = new TifSearchSelect(element, { source, sourceLabel: async (v: string) => `Label of ${v}`, value: 'c7', limit: 5 })
    await wait()
    expect(select.button.textContent).toBe('Label of c7')
    select.open()
    expect(select.panel.querySelector('.tif-listbox-count')!.textContent).toBe('Searching…')
    await wait(10)
    expect(rows(select.panel)).toHaveLength(5)
    expect(select.panel.querySelector('.tif-listbox-count')!.textContent).toBe('First 5 of 50: refine the search')
    search(select.panel, 'Contact 4')
    await wait(250)
    expect(source).toHaveBeenLastCalledWith('Contact 4', expect.objectContaining({ limit: 5 }))
    expect(labels(select.panel)[0]).toBe('Contact 4')
    rows(select.panel)[0].dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(select.value).toBe('c4')
    expect(select.button.textContent).toBe('Contact 4')
  })

  it('dresses a native select, hidden, and gives it back', () => {
    const native = h('select', { name: 's' }, h('option', { value: 'a' }, 'A'), h('option', { value: 'b', selected: true }, 'B'))
    document.body.append(native)
    const select = new TifSearchSelect(native)
    expect(native.hidden).toBe(true)
    expect(select.button.textContent).toBe('B')
    select.dispose()
    expect(native.hidden).toBe(false)
    expect(document.querySelector('.tif-select-button')).toBeNull()
  })

  it('treats an empty written option as the empty choice, not as an option', () => {
    const form = html('<select name="s"><option value="">— None —</option><option value="a">A</option></select>')
    const select = new TifSearchSelect(form.querySelector('select')!)
    expect(select.value).toBe('')
    expect(select.button.textContent).toBe('— None —')
    select.open()
    expect(labels(select.panel)).toEqual(['— None —', 'A'])
    expect(Object.fromEntries(new FormData(form))).toEqual({ s: '' })
  })

  it('emits create from the footer button', () => {
    const element = h('div')
    document.body.append(element)
    const select = new TifSearchSelect(element, { options: people, create: true })
    const create = vi.fn()
    element.addEventListener('create.tif.search-select', create)
    select.open()
    select.panel.querySelector<HTMLButtonElement>('.tif-listbox-foot .tif-btn')!.click()
    expect(create).toHaveBeenCalledTimes(1)
    expect(select.floating.isOpen).toBe(false)
  })
})

describe('multi select', () => {
  const sectors: ListOption[] = ['Bank', 'Insurance', 'Industry'].map((label) => ({ value: label.toLowerCase(), label }))

  it('checks options without closing and sends every value', () => {
    const form = html('<div id="m"></div>')
    const multi = new TifMultiSelect(form.querySelector<HTMLElement>('#m')!, { name: 'sectors', label: 'All sectors', options: sectors })
    expect(multi.button.textContent).toBe('All sectors')
    multi.open()
    rows(multi.panel)[0].dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(multi.floating.isOpen).toBe(true)
    expect(multi.button.textContent).toBe('Bank')
    key(multi.panel, 'ArrowDown')
    key(multi.panel, ' ')
    expect(multi.value).toEqual(['bank', 'insurance'])
    expect(multi.button.textContent).toBe('2 sectors')
    expect(multi.button.title).toBe('Bank, Insurance')
    // happy-dom ne met dans FormData que la première valeur d'un <select multiple> : l'envoi réel est vérifié par Playwright.
    expect([...multi.holder.selectedOptions].map((o) => o.value)).toEqual(['bank', 'insurance'])
    expect(multi.holder.name).toBe('sectors')
    expect(form.contains(multi.holder)).toBe(true)
    expect(multi.panel.querySelector('.tif-listbox-count')!.textContent).toBe('2 checked')
    multi.panel.querySelector<HTMLButtonElement>('.tif-listbox-foot .tif-link-btn')!.click()
    expect(multi.value).toEqual([])
    multi.panel.querySelector<HTMLButtonElement>('.tif-listbox-foot .tif-link-btn')!.click()
    expect(multi.value).toEqual(['bank', 'insurance', 'industry'])
  })

  it('applies a shortcut, then empties it when chosen again', () => {
    const multi = new TifMultiSelect(h('div'), { label: 'All', options: [{ value: 'mine', label: 'Mine', selects: ['bank'] }, ...sectors] })
    document.body.append(multi.element)
    multi.value = ['industry', 'insurance']
    multi.open()
    rows(multi.panel)[0].dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(multi.value).toEqual(['bank'])
    rows(multi.panel)[0].dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(multi.value).toEqual([])
  })

  it('dresses a select multiple', () => {
    const native = h('select', { multiple: true, name: 's' }, h('option', { value: 'a', selected: true }, 'A'), h('option', { value: 'b' }, 'B'))
    document.body.append(native)
    const multi = new TifMultiSelect(native, { label: 'All letters', unit: 'letters' })
    expect(multi.value).toEqual(['a'])
    expect(multi.button.textContent).toBe('A')
    multi.value = 'a,b'
    expect(multi.button.textContent).toBe('2 letters')
  })
})

describe('lookup', () => {
  it('suggests after two letters, chooses with the keyboard and clears', async () => {
    const source = vi.fn(async (query: string) => [
      { value: '1', label: `${query} one` },
      { value: '2', label: `${query} two` },
    ])
    const form = html('<div id="l"></div>')
    const lookup = new TifLookup(form.querySelector<HTMLElement>('#l')!, { name: 'account', source, sourceLabel: async () => 'Acme' })
    const input = lookup.input
    input.focus()
    input.value = 'a'
    input.dispatchEvent(new Event('input'))
    await wait(300)
    expect(source).not.toHaveBeenCalled()
    input.value = 'ac'
    input.dispatchEvent(new Event('input'))
    await wait(300)
    expect(lookup.floating.isOpen).toBe(true)
    key(input, 'ArrowDown')
    key(input, 'Enter')
    expect(lookup.value).toBe('2')
    expect(input.value).toBe('ac two')
    expect(Object.fromEntries(new FormData(form))).toEqual({ account: '2' })
    form.querySelector<HTMLButtonElement>('.tif-lookup-clear')!.click()
    expect(lookup.value).toBe('')
    lookup.value = '9'
    await wait()
    expect(input.value).toBe('Acme')
  })
})

describe('sortable list', () => {
  const items = ['a', 'b', 'c'].map((key) => ({ key, label: key.toUpperCase() }))

  it('reads written items and sends the keys in order', () => {
    const form = html('<tif-sortable-list name="d" reorderable><li data-key="x">X</li><li data-key="y">Y</li></tif-sortable-list>')
    const list = TifSortableList.getInstance(form.querySelector('tif-sortable-list'))!
    expect(list.value).toEqual(['x', 'y'])
    expect(new FormData(form).getAll('d')).toEqual(['x', 'y'])
    expect([...form.querySelectorAll('.tif-sortable-rank')].map((r) => r.textContent)).toEqual(['1', '2'])
  })

  it('reorders with the grip and the arrows, keeping the focus', () => {
    const element = h('div')
    document.body.append(element)
    const list = new TifSortableList(element, { items, reorderable: true })
    const reorder = vi.fn()
    element.addEventListener('reorder.tif.sortable-list', reorder)
    const grip = element.querySelector<HTMLButtonElement>('[data-key="c"] .tif-sortable-grip')!
    grip.focus()
    key(grip, 'ArrowUp')
    expect(list.value).toEqual(['a', 'c', 'b'])
    expect((reorder.mock.calls[0][0] as CustomEvent).detail).toEqual({ keys: ['a', 'c', 'b'] })
    expect(document.activeElement?.closest('li')?.dataset.key).toBe('c')
  })

  it('removes after confirmation, and can be refused', async () => {
    const element = h('div')
    document.body.append(element)
    const list = new TifSortableList(element, { items: [...items, { key: 'f', label: 'F', fixed: true }] })
    expect(element.querySelector('[data-key="f"] .tif-sortable-remove')).toBeNull()
    element.querySelector<HTMLButtonElement>('[data-key="b"] .tif-sortable-remove')!.click()
    await wait()
    const dialog = document.querySelector('dialog.tif-dialog')!
    expect(dialog.textContent).toContain('Remove B from the list?')
    dialog.querySelector<HTMLButtonElement>('.tif-btn-danger')!.click()
    await wait()
    expect(list.value).toEqual(['a', 'c', 'f'])
    element.addEventListener('remove.tif.sortable-list', (event) => event.preventDefault())
    expect(await list.remove('a')).toBe(false)
    expect(list.value).toEqual(['a', 'c', 'f'])
  })

  it('asks the application to add, shows the empty state and the missing state', () => {
    const element = h('div')
    document.body.append(element)
    const list = new TifSortableList(element, { add: true, required: true })
    expect(list.root.classList.contains('tif-missing')).toBe(true)
    element.addEventListener('add.tif.sortable-list', () => list.add({ key: 'n', label: 'New' }))
    element.querySelector<HTMLButtonElement>('.tif-sortable-add')!.click()
    expect(list.value).toEqual(['n'])
    expect(list.root.classList.contains('tif-missing')).toBe(false)
    list.setOptions({ readonly: true })
    expect(element.querySelector('.tif-sortable-remove')).toBeNull()
    expect(element.querySelector<HTMLElement>('.tif-sortable-add')!.hidden).toBe(true)
  })
})
