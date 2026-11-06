// Barre affichée sur une sélection (reprise de MyCRM, SelectionToolbar) : type du bloc (Texte, Titre 1 à 3, listes,
// citation, code), mises en forme, puis couleur du texte et du fond, taille et police, chacune dans une petite liste
// sous la barre. La barre est redessinée à chaque transaction de l'éditeur ; la liste ouverte se referme quand la
// sélection change.
import type { ChainedCommands, Editor } from '@tiptap/core'
import { h, t } from 'tidyinputfields'
import { richIcon, type RichIconName } from './icons.ts'

type BlockKey = 'text' | 'heading1' | 'heading2' | 'heading3' | 'bulletList' | 'orderedList' | 'taskList' | 'quote' | 'code'

/** Types de bloc proposés par la barre (« Transformer en »), dans l'ordre du menu. */
export const BLOCK_TYPES: { key: BlockKey; icon: RichIconName; active: (e: Editor) => boolean; run: (c: ChainedCommands) => ChainedCommands }[] = [
  { key: 'text', icon: 'text', active: (e) => e.isActive('paragraph'), run: (c) => c.setParagraph() },
  { key: 'heading1', icon: 'heading1', active: (e) => e.isActive('heading', { level: 1 }), run: (c) => c.setHeading({ level: 1 }) },
  { key: 'heading2', icon: 'heading2', active: (e) => e.isActive('heading', { level: 2 }), run: (c) => c.setHeading({ level: 2 }) },
  { key: 'heading3', icon: 'heading3', active: (e) => e.isActive('heading', { level: 3 }), run: (c) => c.setHeading({ level: 3 }) },
  { key: 'bulletList', icon: 'bulletList', active: (e) => e.isActive('bulletList'), run: (c) => c.toggleBulletList() },
  { key: 'orderedList', icon: 'orderedList', active: (e) => e.isActive('orderedList'), run: (c) => c.toggleOrderedList() },
  { key: 'taskList', icon: 'taskList', active: (e) => e.isActive('taskList'), run: (c) => c.toggleTaskList() },
  { key: 'quote', icon: 'quote', active: (e) => e.isActive('blockquote'), run: (c) => c.toggleBlockquote() },
  { key: 'code', icon: 'code', active: (e) => e.isActive('codeBlock'), run: (c) => c.toggleCodeBlock() },
]

/**
 * Couleurs du texte et du fond : des teintes moyennes, lisibles en mode clair comme en mode sombre (le texte enregistré
 * garde la valeur, il ne suit pas le thème) ; les fonds sont translucides pour la même raison.
 */
const COLORS: { label: string; text: string | null; background: string | null }[] = [
  { label: 'default', text: null, background: null },
  { label: 'gray', text: '#8a8f98', background: 'rgba(138, 143, 152, 0.22)' },
  { label: 'brown', text: '#a27a5c', background: 'rgba(162, 122, 92, 0.22)' },
  { label: 'orange', text: '#d9822b', background: 'rgba(217, 130, 43, 0.22)' },
  { label: 'yellow', text: '#c9a227', background: 'rgba(222, 184, 46, 0.28)' },
  { label: 'green', text: '#3f9d6b', background: 'rgba(63, 157, 107, 0.22)' },
  { label: 'blue', text: '#3b82d6', background: 'rgba(59, 130, 214, 0.22)' },
  { label: 'purple', text: '#9065c8', background: 'rgba(144, 101, 200, 0.22)' },
  { label: 'pink', text: '#d0609f', background: 'rgba(208, 96, 159, 0.22)' },
  { label: 'red', text: '#d9534f', background: 'rgba(217, 83, 79, 0.22)' },
]

const SIZES: { label: string; value: string | null }[] = [
  { label: 'small', value: '11px' },
  { label: 'normal', value: null },
  { label: 'medium', value: '15px' },
  { label: 'large', value: '18px' },
  { label: 'extraLarge', value: '24px' },
]

/** Polices proposées ; sans nom, la police par défaut (libellé traduit à l'affichage). */
const FONTS: { label: string | null; value: string | null }[] = [
  { label: null, value: null },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: "'Times New Roman', serif" },
  { label: 'Courier New', value: "'Courier New', monospace" },
]

/** Couleur écrite comme le navigateur la rend (« #d9534f » et « rgb(217, 83, 79) » sont la même), pour comparer. */
function sameColor(a: string | null | undefined, b: string | null): boolean {
  const normalized = (c: string) => {
    const probe = document.createElement('span')
    probe.style.color = c
    return probe.style.color
  }
  return !a || !b ? !a && !b : normalized(a) === normalized(b)
}

/**
 * Couleur, taille ou police sur la sélection (null retire la valeur), puis retrait des styles devenus vides. Le
 * removeEmptyTextStyle de Tiptap n'est pas utilisé : dans une liste, il efface les styles de toute la liste.
 */
function applyStyle(chain: ChainedCommands, values: Record<string, string | null>): ChainedCommands {
  return chain.setMark('textStyle', values).command(({ tr }) => {
    const type = tr.doc.type.schema.marks.textStyle
    const { from, to } = tr.selection
    tr.doc.nodesBetween(from, to, (node, position) => {
      if (!node.isText) {
        return true
      }
      const mark = node.marks.find((m) => m.type === type)
      if (mark && !Object.values(mark.attrs).some(Boolean)) {
        tr.removeMark(Math.max(position, from), Math.min(position + node.nodeSize, to), type)
      }
      return false
    })
    return true
  })
}

/** Un outil de la barre ; `active` : état enfoncé, à défaut celui de la marque ou du bloc de même nom que `key`. */
export type Tool = { key: string; title: string; icon: RichIconName; run: (e: Editor) => void; stateless?: boolean; active?: (e: Editor) => boolean }

type Panel = 'block' | 'color' | 'size' | 'font'

export class SelectionToolbar {
  readonly element: HTMLDivElement
  #panel: Panel | null = null
  readonly #editor: Editor
  readonly #tools: () => Tool[]

  constructor(editor: Editor, tools: () => Tool[]) {
    this.#editor = editor
    this.#tools = tools
    this.element = h('div', { class: 'tif-rich-floating tif-rich-toolbar', role: 'toolbar' })
    // Un clic dans la barre ne retire pas la sélection de l'éditeur.
    this.element.addEventListener('mousedown', (event) => {
      if (!(event.target instanceof HTMLInputElement)) {
        event.preventDefault()
      }
    })
    editor.on('selectionUpdate', () => {
      this.#panel = null
    })
  }

  #toggle(panel: Panel): void {
    this.#panel = this.#panel === panel ? null : panel
    this.render()
  }

  #apply(action: (c: ChainedCommands) => ChainedCommands): void {
    action(this.#editor.chain().focus()).run()
    this.#panel = null
    this.render()
  }

  #button(content: (Node | string)[], attrs: Record<string, string | boolean | undefined>, onClick: () => void): HTMLButtonElement {
    const button = h('button', { type: 'button', ...attrs }, ...content)
    button.addEventListener('click', onClick)
    return button
  }

  render(): void {
    const editor = this.#editor
    const style = editor.getAttributes('textStyle') as { color?: string; fontSize?: string; fontFamily?: string }
    const background = (editor.getAttributes('highlight') as { color?: string }).color
    const type = BLOCK_TYPES.find((x) => x.active(editor)) ?? BLOCK_TYPES[0]
    const blockLabel = (key: BlockKey) => t(`richText.blocks.${key}.label`)
    const fontLabel = (label: string | null) => label ?? t('richText.toolbar.fontDefault')
    const currentFont = FONTS.find((f) => f.value === (style.fontFamily ?? null))
    const size = SIZES.find((x) => x.value === (style.fontSize ?? null))
    const letter = (color?: string | null, back?: string | null, extra = '') => {
      const span = h('span', { class: `tif-rich-letter ${extra}` }, extra ? '' : 'A')
      if (color) {
        span.style.color = color
      }
      if (back) {
        span.style.background = back
      }
      return span
    }
    this.element.setAttribute('aria-label', t('richText.toolbar.label'))
    const parts: (Node | string)[] = [
      this.#button([blockLabel(type.key), richIcon('chevronDown')], { class: 'tif-with-label', title: t('richText.menu.transformInto'), 'aria-haspopup': 'menu', 'aria-expanded': String(this.#panel === 'block') }, () => this.#toggle('block')),
      h('span', { class: 'tif-rich-divider' }),
      ...this.#tools().map((tool) =>
        this.#button(
          [richIcon(tool.icon)],
          { title: tool.title, 'aria-label': tool.title, 'aria-pressed': tool.stateless ? undefined : String(tool.active ? tool.active(editor) : editor.isActive(tool.key)) },
          () => {
            this.#panel = null
            tool.run(editor)
          },
        ),
      ),
      h('span', { class: 'tif-rich-divider' }),
      this.#button([letter(style.color, background)], { title: t('richText.toolbar.color'), 'aria-label': t('richText.toolbar.colorLabel'), 'aria-haspopup': 'menu', 'aria-expanded': String(this.#panel === 'color') }, () => this.#toggle('color')),
      this.#button([size ? t(`richText.toolbar.sizes.${size.label}`) : (style.fontSize ?? ''), richIcon('chevronDown')], { class: 'tif-with-label', title: t('richText.toolbar.textSize'), 'aria-haspopup': 'menu', 'aria-expanded': String(this.#panel === 'size') }, () => this.#toggle('size')),
      this.#button([currentFont ? fontLabel(currentFont.label) : t('richText.toolbar.font'), richIcon('chevronDown')], { class: 'tif-with-label', title: t('richText.toolbar.font'), 'aria-haspopup': 'menu', 'aria-expanded': String(this.#panel === 'font') }, () => this.#toggle('font')),
    ]
    if (this.#panel === 'block') {
      parts.push(
        h(
          'div',
          { class: 'tif-rich-toolbar-panel', role: 'menu' },
          ...BLOCK_TYPES.map((x) => this.#button([richIcon(x.icon), blockLabel(x.key)], { role: 'menuitemradio', 'aria-checked': String(x === type) }, () => this.#apply(x.run))),
        ),
      )
    } else if (this.#panel === 'color') {
      const colorName = (label: string) => t(`richText.toolbar.colors.${label}`)
      parts.push(
        h(
          'div',
          { class: 'tif-rich-toolbar-panel tif-colors', role: 'menu' },
          h('div', { class: 'tif-rich-title' }, t('richText.toolbar.textColor')),
          h(
            'div',
            { class: 'tif-rich-swatches' },
            ...COLORS.map((c) =>
              this.#button(
                [letter(c.text)],
                { title: colorName(c.label), 'aria-label': t('richText.toolbar.textColorOf', { color: colorName(c.label).toLowerCase() }), 'aria-pressed': String(sameColor(style.color, c.text)) },
                () => this.#apply((ch) => applyStyle(ch, { color: c.text })),
              ),
            ),
          ),
          h('div', { class: 'tif-rich-title' }, t('richText.toolbar.backgroundColor')),
          h(
            'div',
            { class: 'tif-rich-swatches' },
            ...COLORS.map((c) =>
              this.#button(
                [letter(null, c.background, 'tif-background')],
                { title: colorName(c.label), 'aria-label': t('richText.toolbar.backgroundColorOf', { color: colorName(c.label).toLowerCase() }), 'aria-pressed': String(sameColor(background, c.background)) },
                () => this.#apply((ch) => (c.background ? ch.setHighlight({ color: c.background }) : ch.unsetHighlight())),
              ),
            ),
          ),
        ),
      )
    } else if (this.#panel === 'size') {
      parts.push(
        h(
          'div',
          { class: 'tif-rich-toolbar-panel', role: 'menu' },
          ...SIZES.map((x) => {
            const button = this.#button([t(`richText.toolbar.sizes.${x.label}`)], { role: 'menuitemradio', 'aria-checked': String((style.fontSize ?? null) === x.value) }, () => this.#apply((c) => applyStyle(c, { fontSize: x.value })))
            if (x.value) {
              button.style.fontSize = x.value
            }
            return button
          }),
        ),
      )
    } else if (this.#panel === 'font') {
      parts.push(
        h(
          'div',
          { class: 'tif-rich-toolbar-panel', role: 'menu' },
          ...FONTS.map((f) => {
            const button = this.#button([fontLabel(f.label)], { role: 'menuitemradio', 'aria-checked': String((style.fontFamily ?? null) === f.value) }, () => this.#apply((c) => applyStyle(c, { fontFamily: f.value })))
            if (f.value) {
              button.style.fontFamily = f.value
            }
            return button
          }),
        ),
      )
    }
    this.element.replaceChildren(...parts)
  }
}
