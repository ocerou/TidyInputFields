// Menus flottants de l'éditeur riche (reprise de MyCRM) : liste des blocs (« / »), des personnes (« @ »), menu d'un
// bloc ou d'une ligne de tableau, et sélecteur d'emojis (« /: ») — un carré, les thèmes en onglets, la grille du thème
// choisi. Un seul menu ouvert à la fois ; flèches, Entrée (ou Tab) et Échap s'y appliquent.
import { h, t } from 'tidyinputfields'

export type Entry = {
  key: string
  label: string
  help?: string
  group?: string
  icon: () => Node | string
  danger?: boolean
  disabled?: boolean
  run: () => void
}

export type MenuKind = 'commands' | 'mentions' | 'emojis' | 'block'
export type MenuState = { kind: MenuKind; title: string; entries: Entry[]; choice: number; rect: DOMRect; query?: string }

/** Thèmes du sélecteur d'emojis, dans l'ordre des onglets (le thème des smileys n'a pas de nom dans les données). */
export const EMOJI_THEMES: [string, string][] = [
  ['', 'smileys'],
  ['people & body', 'people'],
  ['animals & nature', 'animals'],
  ['food & drink', 'food'],
  ['travel & places', 'travel'],
  ['activities', 'activities'],
  ['objects', 'objects'],
  ['symbols', 'symbols'],
  ['flags', 'flags'],
]

/** Emojis par ligne dans le sélecteur (les flèches haut et bas sautent d'une ligne). */
export const EMOJI_COLUMNS = 9

export class RichMenu {
  state: MenuState | null = null
  /** Thème affiché par le sélecteur d'emojis. */
  theme = EMOJI_THEMES[0][0]
  /** Menus fermés par Échap : ils ne se rouvrent qu'au prochain déclencheur tapé. */
  readonly hidden = new Set<MenuKind>()
  #element: HTMLDivElement | null = null
  readonly #container: () => HTMLElement

  constructor(container: () => HTMLElement) {
    this.#container = container
  }

  get element(): HTMLDivElement | null {
    return this.#element
  }

  open(state: MenuState): void {
    this.state = state
    this.render()
  }

  close(kind?: MenuKind): void {
    if (kind && this.state?.kind !== kind) {
      return
    }
    this.state = null
    this.#element?.remove()
    this.#element = null
  }

  /** Indices des emojis visibles : tous avec une recherche, ceux du thème sinon. */
  #visibleEmojis(m: MenuState): number[] {
    return m.entries.map((x, i) => (m.query || x.group === this.theme ? i : -1)).filter((i) => i >= 0)
  }

  /** Flèches, Entrée et Échap dans le menu ouvert ; true si la touche a été prise. */
  key(event: KeyboardEvent): boolean {
    const m = this.state
    if (!m) {
      return false
    }
    if (event.key === 'Escape') {
      this.hidden.add(m.kind)
      this.close()
      return true
    }
    if (m.kind === 'emojis' && ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      const visible = this.#visibleEmojis(m)
      const rank = Math.max(0, visible.indexOf(m.choice))
      const step = ({ ArrowRight: 1, ArrowLeft: -1, ArrowDown: EMOJI_COLUMNS, ArrowUp: -EMOJI_COLUMNS } as Record<string, number>)[event.key] ?? 0
      this.#choose(visible[Math.min(visible.length - 1, Math.max(0, rank + step))] ?? 0)
      return true
    }
    const enabled = m.entries.map((x, i) => (x.disabled ? -1 : i)).filter((i) => i >= 0)
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      const rank = enabled.indexOf(m.choice)
      this.#choose(enabled[(rank + (event.key === 'ArrowDown' ? 1 : enabled.length - 1)) % enabled.length] ?? 0)
      return true
    }
    if (event.key === 'Enter' || event.key === 'Tab') {
      m.entries[m.choice]?.run()
      return true
    }
    return false
  }

  /** Change l'option choisie sans redessiner le menu (la grille des emojis garde son défilement). */
  #choose(index: number): void {
    const m = this.state
    if (!m || m.choice === index) {
      return
    }
    m.choice = index
    for (const button of this.#element?.querySelectorAll<HTMLElement>('[data-index]') ?? []) {
      const chosen = Number(button.dataset.index) === index
      button.classList.toggle('tif-selected', chosen)
      if (button.getAttribute('role') === 'option') {
        button.setAttribute('aria-selected', String(chosen))
      }
    }
    const footer = this.#element?.querySelector('.tif-rich-emoji-footer')
    const selected = m.entries[index]
    if (footer && selected) {
      footer.textContent = `${String(selected.icon())} ${selected.label}`
    }
    this.#element?.querySelector('.tif-selected')?.scrollIntoView?.({ block: 'nearest' })
  }

  render(): void {
    const m = this.state
    if (!m) {
      return
    }
    const element = m.kind === 'emojis' ? this.#emojiPicker(m) : this.#list(m)
    // Le menu s'ouvre sous le curseur, ou au-dessus s'il n'y a pas la place.
    const width = m.kind === 'emojis' ? 342 : 262
    element.style.left = `${Math.max(8, Math.min(m.rect.left, window.innerWidth - width - 8))}px`
    if (m.rect.bottom + 340 > window.innerHeight && m.rect.top > 340) {
      element.style.bottom = `${window.innerHeight - m.rect.top + 6}px`
    } else {
      element.style.top = `${m.rect.bottom + 6}px`
    }
    // Un clic dans le menu ne retire pas le focus de l'éditeur.
    element.addEventListener('mousedown', (event) => event.preventDefault())
    if (this.#element) {
      this.#element.replaceWith(element)
    } else {
      this.#container().append(element)
    }
    this.#element = element
    // L'option choisie au clavier reste visible : le menu défile avec elle.
    element.querySelector('.tif-selected')?.scrollIntoView?.({ block: 'nearest' })
  }

  #list(m: MenuState): HTMLDivElement {
    const list = h('div', { class: 'tif tif-rich-floating tif-rich-menu', role: 'menu' })
    if (m.entries.length === 0) {
      list.append(h('div', { class: 'tif-rich-empty' }, m.kind === 'mentions' ? t('richText.menu.noPerson') : t('richText.menu.noResult')))
      return list
    }
    if (m.title && !m.entries[0].group) {
      list.append(h('div', { class: 'tif-rich-title' }, m.title))
    }
    m.entries.forEach((x, i) => {
      if (x.group && x.group !== m.entries[i - 1]?.group) {
        if (i > 0) {
          list.append(h('hr'))
        }
        list.append(h('div', { class: 'tif-rich-title' }, x.group))
      }
      const classes = [i === m.choice ? 'tif-selected' : '', x.danger ? 'tif-danger' : '', m.kind === 'block' ? 'tif-small' : ''].filter(Boolean).join(' ')
      const button = h(
        'button',
        { type: 'button', role: 'menuitem', class: classes || undefined, disabled: x.disabled, 'data-index': i },
        h('span', { class: 'tif-rich-menu-icon' }, x.icon()),
        h('span', {}, x.label, x.help ? h('small', {}, x.help) : null),
      )
      button.addEventListener('mouseenter', () => !x.disabled && this.#choose(i))
      button.addEventListener('click', x.run)
      list.append(button)
    })
    return list
  }

  #emojiPicker(m: MenuState): HTMLDivElement {
    const visible = this.#visibleEmojis(m)
    const selected = m.entries[m.choice]
    const themeName = (group: string) => t(`richText.emojis.themes.${EMOJI_THEMES.find(([g]) => g === group)?.[1] ?? 'smileys'}`)
    const picker = h('div', { class: 'tif tif-rich-floating tif-rich-emojis', role: 'dialog', 'aria-label': t('richText.emojis.title') })
    if (!m.query) {
      const tabs = h('div', { class: 'tif-rich-emoji-themes', role: 'tablist' })
      for (const [group] of EMOJI_THEMES) {
        const tab = h('button', { type: 'button', role: 'tab', 'aria-selected': String(group === this.theme), title: themeName(group), 'aria-label': themeName(group) }, m.entries.find((x) => x.group === group)?.icon() ?? '')
        tab.addEventListener('click', () => {
          this.theme = group
          m.choice = Math.max(0, m.entries.findIndex((x) => x.group === group))
          this.render()
        })
        tabs.append(tab)
      }
      picker.append(tabs)
    }
    picker.append(h('div', { class: 'tif-rich-title' }, m.query ? t('richText.emojis.search', { query: m.query }) : themeName(this.theme)))
    if (visible.length === 0) {
      picker.append(h('div', { class: 'tif-rich-empty' }, t('richText.emojis.none')))
    } else {
      const grid = h('div', { class: 'tif-rich-emoji-grid', role: 'listbox' })
      grid.style.gridTemplateColumns = `repeat(${EMOJI_COLUMNS}, 1fr)`
      for (const i of visible) {
        const entry = m.entries[i]
        const button = h('button', { type: 'button', role: 'option', 'aria-selected': String(i === m.choice), class: i === m.choice ? 'tif-selected' : undefined, title: entry.label, 'data-index': i }, entry.icon())
        button.addEventListener('mouseenter', () => this.#choose(i))
        button.addEventListener('click', entry.run)
        grid.append(button)
      }
      picker.append(grid)
    }
    picker.append(h('div', { class: 'tif-rich-emoji-footer' }, selected ? `${String(selected.icon())} ${selected.label}` : ' '))
    return picker
  }
}
