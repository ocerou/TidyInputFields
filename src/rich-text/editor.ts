// Éditeur de texte riche à la manière de Notion (reprise de MyCRM, InputRichText), sur Tiptap (licence MIT) : pas de
// barre fixe ; une barre apparaît sur la sélection, « / » ouvre le menu des blocs, « @ » mentionne une personne (si
// `mentions` est fourni), « /: » insère un emoji, une poignée à gauche de chaque bloc le déplace (glisser) ou ouvre
// ses options (clic), « + » ajoute une ligne dessous. Tableaux à la Notion, images redimensionnables (si
// `uploadImage` est fourni), collage depuis Word ou une page web ramené aux mises en forme de l'éditeur.
//
// Valeur : le HTML nettoyé ('' quand l'éditeur est vide), dans un champ caché `name` (ou dans le <textarea> sur lequel
// le composant est posé). `input` à chaque modification, `change` en quittant la zone si le texte a changé ; Échap
// rend le texte d'avant la saisie.
import { Editor, Extension, type ChainedCommands } from '@tiptap/core'
import BubbleMenu from '@tiptap/extension-bubble-menu'
import Color from '@tiptap/extension-color'
import { Emoji, emojis, type EmojiItem } from '@tiptap/extension-emoji'
import FontFamily from '@tiptap/extension-font-family'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Mention from '@tiptap/extension-mention'
import Placeholder from '@tiptap/extension-placeholder'
import Table from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import TextAlign from '@tiptap/extension-text-align'
import TextStyle from '@tiptap/extension-text-style'
import Underline from '@tiptap/extension-underline'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { NodeSelection, TextSelection } from '@tiptap/pm/state'
import { TableMap } from '@tiptap/pm/tables'
import StarterKit from '@tiptap/starter-kit'
import Suggestion, { type SuggestionOptions, type SuggestionProps } from '@tiptap/suggestion'
import { Component, containerFor, h, t, type Options } from 'tidyinputfields'
import { cleanPastedHtml, sanitizeHtml } from './html.ts'
import { richIcon, type RichIconName } from './icons.ts'
import { EMOJI_THEMES, RichMenu, type Entry, type MenuKind } from './menu.ts'
import { TableTools, type TableAction } from './table-tools.ts'
import { BLOCK_TYPES, SelectionToolbar, type Tool } from './toolbar.ts'

/** Image rendue par `uploadImage` : son adresse, et son identifiant si c'est lui qu'il faut enregistrer. */
export type RichTextImage = { src: string; id?: string; alt?: string }
/** Personne proposée par `mentions`. `group` regroupe les résultats sous un titre, `kind` est enregistré (data-kind). */
export type RichTextMention = { id: string; label: string; detail?: string; group?: string; kind?: string }

type UploadImage = (file: File) => Promise<RichTextImage> | RichTextImage
type ImageSource = (id: string) => Promise<string | null> | string | null
type FindMentions = (query: string) => Promise<RichTextMention[]> | RichTextMention[]

type InsertKey = 'table' | 'divider' | 'image' | 'mention' | 'emoji'
type SlashItem = { key: string; icon: RichIconName; transform?: (c: ChainedCommands) => ChainedCommands; insert?: () => void }
type Block = { node: ProseMirrorNode; pos: number; dom: HTMLElement }

/** Déclencheur du sélecteur d'emojis : « /: » plutôt que « : », pour taper les deux-points librement. */
const EMOJI_CHAR = '/:'

/** Emojis Unicode standard, sans image de secours externe : le texte ne contient que des caractères. */
const emojiList: EmojiItem[] = emojis.filter((e) => e.emoji).map(({ fallbackImage: _fallbackImage, ...e }) => e)
/** Emojis du sélecteur : ceux des thèmes, sans les lettres-drapeaux. */
const pickerEmojis = emojiList.filter((e) => EMOJI_THEMES.some(([g]) => g === (e.group ?? '')) && !e.name.startsWith('regional_indicator'))

const stripAccents = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

/** Le presse-papiers contient-il du texte (brut, ou dans le HTML copié) ? */
function containsText(data: DataTransfer | null): boolean {
  if (!data) {
    return false
  }
  if (data.getData('text/plain').trim()) {
    return true
  }
  const html = data.getData('text/html')
  return !!html && !!(new DOMParser().parseFromString(html, 'text/html').body.textContent ?? '').trim()
}

/** Blocs de premier niveau, avec leur position et leur élément affiché. */
function blocksOf(e: Editor): Block[] {
  const list: Block[] = []
  e.state.doc.forEach((node, pos) => {
    const dom = e.view.nodeDOM(pos)
    if (dom instanceof HTMLElement) {
      list.push({ node, pos, dom })
    }
  })
  return list
}

/** Déplace un bloc de premier niveau devant le bloc d'indice cible (ou à la fin). */
export function moveBlock(e: Editor, source: Block, target: number): void {
  const list = blocksOf(e)
  const index = list.findIndex((b) => b.pos === source.pos)
  if (index < 0 || target === index || target === index + 1 || target < 0 || target > list.length) {
    return
  }
  const destination = target < list.length ? list[target].pos : e.state.doc.content.size
  const tr = e.state.tr.delete(source.pos, source.pos + source.node.nodeSize)
  tr.insert(tr.mapping.map(destination), source.node)
  e.view.dispatch(tr.scrollIntoView())
  e.commands.focus()
}

/**
 * Tableau dont seules certaines colonnes ont une largeur enregistrée (celles réglées en tirant leur bordure) : les autres
 * reçoivent la largeur qu'elles ont à l'écran, pour que le tableau garde ses proportions ailleurs. Sans retour dans
 * l'historique d'annulation. Rend vrai si le document a été modifié.
 */
function fillColumnWidths(editor: Editor): boolean {
  const { state, view } = editor
  const tr = state.tr
  state.doc.descendants((table, tablePos) => {
    if (table.type.name !== 'table') {
      return true
    }
    const cells: { node: ProseMirrorNode; pos: number }[] = []
    table.descendants((node, offset) => {
      if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
        cells.push({ node, pos: tablePos + 1 + offset })
        return false
      }
      return true
    })
    const known = (n: ProseMirrorNode) => Array.isArray(n.attrs.colwidth) && (n.attrs.colwidth as unknown[]).every((w) => typeof w === 'number' && w > 0)
    if (!cells.some((c) => known(c.node)) || cells.every((c) => known(c.node))) {
      return false
    }
    // Largeur affichée de chaque colonne : celle d'une cellule de la première ligne qui ne couvre qu'elle.
    const map = TableMap.get(table)
    const widths: number[] = []
    for (let column = 0; column < map.width; column++) {
      const offset = map.map[column]
      const cell = table.nodeAt(offset)
      const dom = view.nodeDOM(tablePos + 1 + offset) as HTMLElement | null
      widths.push(cell && cell.attrs.colspan === 1 && dom ? Math.round(dom.getBoundingClientRect().width) : 0)
    }
    if (widths.some((w) => w <= 0)) {
      return false
    }
    for (const { node, pos } of cells) {
      if (!known(node)) {
        const rect = map.findCell(pos - tablePos - 1)
        tr.setNodeMarkup(pos, undefined, { ...node.attrs, colwidth: widths.slice(rect.left, rect.right) })
      }
    }
    return false
  })
  if (!tr.docChanged) {
    return false
  }
  view.dispatch(tr.setMeta('addToHistory', false))
  return true
}

/** Taille du texte, portée par la marque textStyle (comme la couleur et la police). */
const FontSize = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (el) => el.style.fontSize || null,
            renderHTML: (a) => (a.fontSize ? { style: `font-size: ${a.fontSize as string}` } : {}),
          },
        },
      },
    ]
  },
})

/** Mention d'une personne, avec sa sorte (data-kind) quand `mentions` en donne une. */
const KindMention = Mention.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      kind: { default: null, parseHTML: (el) => el.getAttribute('data-kind'), renderHTML: (a) => (a.kind ? { 'data-kind': a.kind as string } : {}) },
    }
  },
})

/**
 * Image : adresse (src) ou identifiant (data-image-id) ; avec un identifiant, seul lui est enregistré et l'adresse est
 * demandée à `imageSrc`. Quatre poignées d'angle changent la largeur (la hauteur suit), enregistrée au lâcher.
 */
function imageExtension(source: () => ImageSource | null) {
  return Image.extend({
    addAttributes() {
      return {
        src: { default: null, parseHTML: (el) => el.getAttribute('src'), renderHTML: (a) => (a.src && !a.imageId ? { src: a.src as string } : {}) },
        imageId: { default: null, parseHTML: (el) => el.getAttribute('data-image-id'), renderHTML: (a) => (a.imageId ? { 'data-image-id': a.imageId as string } : {}) },
        alt: { default: '', parseHTML: (el) => el.getAttribute('alt') ?? '', renderHTML: (a) => ({ alt: a.alt as string }) },
        width: {
          default: null,
          parseHTML: (el) => (Number(el.getAttribute('width')) > 0 ? Number(el.getAttribute('width')) : null),
          renderHTML: (a) => (a.width ? { width: String(a.width) } : {}),
        },
      }
    },
    parseHTML() {
      return [{ tag: 'img[data-image-id]' }, { tag: 'img[src]' }]
    },
    addNodeView() {
      return ({ node, editor, getPos }) => {
        const frame = h('span', { class: 'tif-rich-image' })
        const img = h('img', { alt: node.attrs.alt as string, draggable: 'false' })
        const load = (n: ProseMirrorNode) => {
          const id = n.attrs.imageId as string | null
          const lookup = source()
          if (n.attrs.src) {
            img.src = n.attrs.src as string
          } else if (id && lookup) {
            const url = lookup(id)
            if (typeof url === 'string') {
              img.src = url
            } else {
              void url?.then((found) => {
                if (found) {
                  img.src = found
                }
              })
            }
          }
          img.style.width = n.attrs.width ? `${n.attrs.width as number}px` : ''
        }
        load(node)
        frame.append(img)
        for (const corner of ['nw', 'ne', 'sw', 'se']) {
          const handle = h('span', { class: `tif-rich-image-handle tif-${corner}` })
          handle.addEventListener('pointerdown', (start) => {
            start.preventDefault()
            start.stopPropagation()
            const startWidth = img.getBoundingClientRect().width
            const maximum = (frame.parentElement?.getBoundingClientRect().width ?? startWidth) - 4
            const towardsLeft = corner === 'nw' || corner === 'sw'
            const resize = (e: PointerEvent) => {
              const delta = (e.clientX - start.clientX) * (towardsLeft ? -1 : 1)
              img.style.width = `${Math.round(Math.min(maximum, Math.max(40, startWidth + delta)))}px`
            }
            const release = () => {
              window.removeEventListener('pointermove', resize)
              window.removeEventListener('pointerup', release)
              const position = typeof getPos === 'function' ? getPos() : undefined
              if (editor.isEditable && typeof position === 'number') {
                editor.view.dispatch(editor.state.tr.setNodeMarkup(position, undefined, { ...node.attrs, width: Math.round(img.getBoundingClientRect().width) }))
              }
            }
            window.addEventListener('pointermove', resize)
            window.addEventListener('pointerup', release)
          })
          frame.append(handle)
        }
        return {
          dom: frame,
          selectNode: () => frame.classList.add('tif-selected'),
          deselectNode: () => frame.classList.remove('tif-selected'),
          // La largeur changée par les poignées vient d'ici : le nœud se met à jour sans être redessiné.
          update: (updated) => {
            if (updated.type !== node.type || updated.attrs.imageId !== node.attrs.imageId || updated.attrs.src !== node.attrs.src) {
              return false
            }
            node = updated
            load(updated)
            return true
          },
        }
      }
    },
  }).configure({ inline: false, allowBase64: false })
}

export class TifRichText extends Component {
  static override NAME = 'rich-text'
  static override DEFAULTS: Options = {
    name: '',
    value: '',
    /** Aide affichée dans l'éditeur vide, avant « Taper / pour les blocs ». */
    placeholder: '',
    disabled: false,
    readonly: false,
    required: false,
    label: '',
    inputId: '',
    /** Envoi d'une image (menu « / », collage, dépôt) : (file) => { src, id?, alt? }. Sans lui, pas d'image. */
    uploadImage: null as UploadImage | null,
    /** Adresse d'une image enregistrée par son identifiant : (id) => url. */
    imageSrc: null as ImageSource | null,
    /** Formats d'image acceptés. */
    imageFormats: 'image/png,image/jpeg,image/gif,image/webp',
    /** Personnes mentionnables : (query) => { id, label, detail?, group?, kind? }[]. Sans lui, pas de « @ ». */
    mentions: null as FindMentions | null,
    /** Sélecteur d'emojis (« /: »). */
    emojis: true,
  }

  readonly surface: HTMLDivElement
  readonly editor: Editor
  readonly holder: HTMLInputElement | HTMLTextAreaElement
  readonly #zone: HTMLDivElement
  readonly #error: HTMLDivElement
  readonly #file: HTMLInputElement
  readonly #grip: HTMLButtonElement
  readonly #add: HTMLButtonElement
  readonly #marker: HTMLDivElement
  readonly #toolbar: SelectionToolbar
  readonly #menu: RichMenu
  readonly #tables: TableTools
  readonly #textarea: HTMLTextAreaElement | null
  readonly #listeners = new AbortController()
  /** Texte au début de la saisie : Échap y revient, `change` n'est émis que s'il a changé. */
  #committed = ''
  #link: string | null = null
  #handle: Block | null = null
  #dragging: { block: Block; start: number; target: number | null; moved: boolean } | null = null
  #uploading = 0

  constructor(element: HTMLElement, options: Options = {}) {
    super(element, options)
    this.#textarea = element instanceof HTMLTextAreaElement ? element : null
    let initial = String(this.options.value ?? '')
    if (this.#textarea) {
      initial ||= this.#textarea.value
      if (!this.options.name && this.#textarea.name) {
        this.options.name = this.#textarea.name
      }
      this.#textarea.hidden = true
      this.holder = this.#textarea
    } else {
      // Contenu écrit dans l'élément (<div data-tif="rich-text"><p>…</p></div>) : valeur de départ.
      initial ||= element.innerHTML.trim()
      element.replaceChildren()
      this.holder = h('input', { type: 'hidden' })
    }
    this.#zone = h('div')
    this.#error = h('div', { class: 'tif-rich-error', role: 'alert', hidden: true })
    this.#file = h('input', { type: 'file', hidden: true })
    this.#grip = h('button', { type: 'button', class: 'tif-rich-grip', hidden: true, 'aria-haspopup': 'menu' }, richIcon('grip'))
    this.#add = h('button', { type: 'button', class: 'tif-rich-grip tif-rich-add', hidden: true }, richIcon('plus'))
    this.#marker = h('div', { class: 'tif-rich-drop-marker', hidden: true })
    this.surface = h('div', { class: 'tif tif-rich-text' }, this.#zone, this.#error, this.#file, this.#grip, this.#add, this.#marker)
    if (this.#textarea) {
      this.#textarea.after(this.surface)
    } else {
      element.append(this.surface, this.holder)
    }
    this.#menu = new RichMenu(() => containerFor(this.surface))
    const bubble = h('div', { class: 'tif tif-rich-bubble' })
    this.editor = new Editor({
      element: this.#zone,
      content: sanitizeHtml(initial),
      editable: !this.options.disabled && !this.options.readonly,
      extensions: this.#extensions(bubble),
      editorProps: {
        attributes: { class: 'tif-rich-content', role: 'textbox', 'aria-multiline': 'true' },
        handleKeyDown: (view, event) => {
          if (event.key !== 'Escape' || this.#menu.state) {
            return false
          }
          this.editor.commands.setContent(sanitizeHtml(this.#committed), false)
          this.#sync(false)
          view.dom.blur()
          return true
        },
        // Texte enrichi collé (Word, Google Docs, pages web) : ramené aux mises en forme de l'éditeur.
        transformPastedHTML: cleanPastedHtml,
        // Word, Excel, PowerPoint et OneNote joignent au texte copié une image de la sélection : s'il y a du texte,
        // c'est lui qui est collé, l'image n'est prise que pour une image seule.
        handlePaste: (_view, event) => {
          const image = this.#imageFile(event.clipboardData?.files)
          if (!image || containsText(event.clipboardData)) {
            return false
          }
          void this.#upload(image)
          return true
        },
        handleDrop: (view, event) => {
          const image = this.#imageFile(event.dataTransfer?.files)
          if (!image) {
            return false
          }
          const position = view.posAtCoords({ left: event.clientX, top: event.clientY })
          if (position) {
            this.editor.commands.setTextSelection(position.pos)
          }
          void this.#upload(image)
          return true
        },
      },
      onTransaction: () => this.#renderBubble(),
      onUpdate: ({ editor }) => {
        // Une colonne vient d'être réglée : les autres reçoivent leur largeur affichée (nouvelle mise à jour).
        if (!fillColumnWidths(editor)) {
          this.#sync(true)
        }
      },
      onFocus: () => {
        this.#committed = this.value
      },
      onBlur: () => {
        if (this.value !== this.#committed) {
          this.#committed = this.value
          this.element.dispatchEvent(new Event('change', { bubbles: true }))
        }
      },
    })
    this.#toolbar = new SelectionToolbar(this.editor, () => this.#tools())
    bubble.append(this.#toolbar.element)
    this.#tables = new TableTools(this.editor, this.surface, (actions, anchor) => this.#openActions(actions, anchor))
    this.#listen()
    this.#sync(false)
    this.#committed = this.value
    this.#apply(Object.keys(this.options))
  }

  /** HTML de l'éditeur, '' s'il est vide. */
  override get value(): string {
    return this.editor.isEmpty ? '' : this.editor.getHTML()
  }

  override set value(value: unknown) {
    this.editor.commands.setContent(sanitizeHtml(value == null ? '' : String(value)), false)
    this.#sync(false)
    this.#committed = this.value
  }

  /** Texte brut de l'éditeur (sans balises). */
  get text(): string {
    return this.editor.getText()
  }

  focus(): void {
    this.editor.commands.focus()
  }

  /** Recopie la valeur dans le champ du formulaire ; `notify` : émet `input`, comme une saisie. */
  #sync(notify: boolean): void {
    this.holder.value = this.value
    this.#validity()
    if (notify) {
      this.element.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }

  /** Champ obligatoire vide : le formulaire le signale (le champ caché ne se valide pas, la zone porte l'état). */
  #validity(): void {
    const missing = Boolean(this.options.required) && this.editor.isEmpty
    this.surface.classList.toggle('tif-invalid-empty', missing)
    if (this.#textarea) {
      this.#textarea.setCustomValidity(missing ? t('richText.required') : '')
    }
  }

  #imageFile(files: FileList | undefined | null): File | undefined {
    if (!this.options.uploadImage) {
      return undefined
    }
    const formats = String(this.options.imageFormats).split(',').map((f) => f.trim())
    return [...(files ?? [])].find((f) => formats.includes(f.type))
  }

  /** Envoie une image par `uploadImage` puis l'insère à la position courante. */
  async #upload(file: File): Promise<void> {
    const upload = this.options.uploadImage as UploadImage | null
    if (!upload) {
      return
    }
    this.#showError(null)
    this.#uploading++
    this.surface.setAttribute('aria-busy', 'true')
    try {
      const image = await upload(file)
      this.editor
        .chain()
        .focus()
        .insertContent({ type: 'image', attrs: { src: image.id ? null : image.src, imageId: image.id ?? null, alt: image.alt ?? file.name ?? t('richText.image.pastedName') } })
        .run()
      // Image enregistrée par identifiant : son adresse est déjà connue, inutile de la redemander.
      if (image.id) {
        this.#knownImages.set(image.id, image.src)
      }
    } catch (problem) {
      this.#showError(problem instanceof Error ? problem.message : String(problem))
    } finally {
      this.#uploading--
      if (!this.#uploading) {
        this.surface.removeAttribute('aria-busy')
      }
    }
  }

  /** Adresses des images envoyées pendant la saisie, par identifiant. */
  readonly #knownImages = new Map<string, string>()

  #imageSource(): ImageSource | null {
    const lookup = this.options.imageSrc as ImageSource | null
    return (id) => this.#knownImages.get(id) ?? (lookup ? lookup(id) : null)
  }

  #showError(message: string | null): void {
    this.#error.textContent = message ?? ''
    this.#error.hidden = !message
  }

  /** Suggestions communes (« / », « @ », « /: ») : le menu flottant suit la saisie. */
  #suggestions<T>(kind: MenuKind, title: () => string, entry: (item: T, choose: () => void) => Entry): SuggestionOptions<T>['render'] {
    return () => {
      const open = (p: SuggestionProps<T>) => {
        const rect = p.clientRect?.()
        if (this.#menu.hidden.has(kind) || !rect) {
          return
        }
        this.#menu.open({ kind, title: title(), rect, choice: 0, query: p.query, entries: p.items.map((item) => entry(item, () => p.command(item as never))) })
      }
      return {
        onStart: (p) => {
          this.#menu.hidden.delete(kind)
          open(p)
        },
        onUpdate: open,
        onKeyDown: ({ event }) => this.#menu.key(event),
        onExit: () => this.#menu.close(kind),
      }
    }
  }

  /** Blocs proposés par « / » : les transformations, puis ce qui s'insère. */
  #slashItems(): SlashItem[] {
    const inserts: { key: InsertKey; when: boolean; insert: () => void }[] = [
      { key: 'table', when: true, insert: () => this.editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
      { key: 'divider', when: true, insert: () => this.editor.chain().focus().setHorizontalRule().run() },
      { key: 'image', when: !!this.options.uploadImage, insert: () => this.#file.click() },
      { key: 'mention', when: !!this.options.mentions, insert: () => this.editor.chain().focus().insertContent('@').run() },
      { key: 'emoji', when: !!this.options.emojis, insert: () => this.editor.chain().focus().insertContent(EMOJI_CHAR).run() },
    ]
    return [
      ...BLOCK_TYPES.map((b) => ({ key: b.key, icon: b.icon, transform: b.run })),
      ...inserts.filter((x) => x.when).map((x) => ({ key: x.key, icon: x.key, insert: x.insert })),
    ]
  }

  #extensions(bubble: HTMLElement) {
    const blockText = (key: string, part: 'label' | 'help' | 'words') => t(`richText.blocks.${key}.${part}`)
    const slashItems = () => this.#slashItems()
    const renderSlash = this.#suggestions<SlashItem>('commands', () => t('richText.blocks.title'), (b, choose) => ({
      key: b.key,
      label: blockText(b.key, 'label'),
      help: blockText(b.key, 'help'),
      icon: () => richIcon(b.icon),
      run: choose,
    }))
    const SlashCommands = Extension.create({
      name: 'slashCommands',
      addProseMirrorPlugins() {
        return [
          Suggestion<SlashItem>({
            editor: this.editor,
            char: '/',
            // « /: » ouvre les emojis, pas les blocs.
            allow: ({ state, range }) => !state.doc.textBetween(range.from, range.to).startsWith(EMOJI_CHAR),
            items: ({ query }) => slashItems().filter((b) => stripAccents(`${blockText(b.key, 'label')} ${blockText(b.key, 'words')}`).includes(stripAccents(query))),
            command: ({ editor, range, props }) => {
              const chain = editor.chain().focus().deleteRange(range)
              if (props.transform) {
                props.transform(chain).run()
              } else {
                chain.run()
                props.insert?.()
              }
            },
            render: renderSlash,
          }),
        ]
      },
    })
    return [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'], alignments: ['left', 'center', 'right'] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontFamily,
      FontSize,
      Link.configure({ openOnClick: false, autolink: true, defaultProtocol: 'https', protocols: ['mailto'], HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      // Largeur des colonnes réglable en tirant leur bordure (attribut colwidth des cellules).
      Table.configure({ resizable: true, cellMinWidth: 60 }),
      TableRow,
      TableHeader,
      TableCell,
      imageExtension(() => this.#imageSource()),
      KindMention.configure({
        HTMLAttributes: { class: 'tif-mention' },
        suggestion: {
          char: '@',
          allow: () => !!this.options.mentions,
          items: async ({ query }) => {
            const find = this.options.mentions as FindMentions | null
            return find ? await find(query) : []
          },
          command: ({ editor, range, props }) => {
            const item = props as unknown as RichTextMention
            editor
              .chain()
              .focus()
              .insertContentAt(range, [
                { type: 'mention', attrs: { id: item.id, label: item.label, kind: item.kind ?? null } },
                { type: 'text', text: ' ' },
              ])
              .run()
          },
          render: this.#suggestions<RichTextMention>('mentions', () => t('richText.mentions.title'), (p, choose) => ({
            key: `${p.kind ?? ''}-${p.id}`,
            label: p.label,
            help: p.detail,
            group: p.group,
            icon: () => richIcon('person'),
            run: choose,
          })) as never,
        },
      }),
      Emoji.configure({
        emojis: emojiList,
        enableEmoticons: true,
        suggestion: {
          char: EMOJI_CHAR,
          allow: () => !!this.options.emojis,
          // Sans recherche, tous les emojis (le sélecteur montre ceux du thème choisi) ; avec, ceux qui correspondent.
          items: ({ query }) => {
            const q = stripAccents(query)
            return q ? pickerEmojis.filter((x) => x.shortcodes.some((s) => s.includes(q)) || x.tags.some((tag) => tag.startsWith(q))).slice(0, 160) : pickerEmojis
          },
          render: this.#suggestions<EmojiItem>('emojis', () => t('richText.emojis.title'), (x, choose) => ({
            key: x.name,
            label: `:${x.shortcodes[0]}:`,
            group: x.group ?? '',
            icon: () => x.emoji ?? '',
            run: choose,
          })),
        },
      }),
      Placeholder.configure({
        showOnlyCurrent: true,
        placeholder: ({ node, editor }) =>
          node.type.name === 'heading'
            ? t('richText.placeholder.heading')
            : editor.isEmpty
              ? t('richText.placeholder.empty', { hint: String(this.options.placeholder || t('richText.placeholder.defaultHint')) })
              : this.options.mentions
                ? t('richText.placeholder.filled')
                : t('richText.placeholder.blocksOnly'),
      }),
      BubbleMenu.configure({
        element: bubble,
        tippyOptions: {
          duration: 120,
          placement: 'top',
          theme: 'tif',
          arrow: false,
          maxWidth: 'none',
          appendTo: () => containerFor(this.surface),
          // Placée par top / left dans la fenêtre : sans la feuille de style de tippy, l'ancrage par le bas (adaptive)
          // la mettait au pied de la page.
          popperOptions: { strategy: 'fixed', modifiers: [{ name: 'computeStyles', options: { adaptive: false } }] },
          onHidden: () => {
            this.#link = null
          },
        },
        shouldShow: ({ editor, state }) => editor.isEditable && !state.selection.empty && !(state.selection instanceof NodeSelection),
      }),
      SlashCommands,
    ]
  }

  /** Outils de la barre de sélection, entre le type du bloc et les couleurs. */
  #tools(): Tool[] {
    const tool = (key: string, icon: RichIconName, run: (e: Editor) => void, more: Partial<Tool> = {}): Tool => ({ key, title: t(`richText.toolbar.tools.${key}`), icon, run, ...more })
    return [
      tool('bold', 'bold', (e) => e.chain().focus().toggleBold().run()),
      tool('italic', 'italic', (e) => e.chain().focus().toggleItalic().run()),
      tool('underline', 'underline', (e) => e.chain().focus().toggleUnderline().run()),
      tool('strike', 'strike', (e) => e.chain().focus().toggleStrike().run()),
      tool('code', 'code', (e) => e.chain().focus().toggleCode().run()),
      tool('link', 'link', (e) => {
        this.#link = (e.getAttributes('link').href as string | undefined) ?? ''
        this.#renderBubble()
      }),
      ...(['left', 'center', 'right'] as const).map((align) => ({
        key: `align-${align}`,
        title: t(`richText.toolbar.tools.align.${align}`),
        icon: `align${align[0].toUpperCase()}${align.slice(1)}` as RichIconName,
        // À gauche : aussi un bloc sans alignement.
        active: (e: Editor) => (align === 'left' ? !e.isActive({ textAlign: 'center' }) && !e.isActive({ textAlign: 'right' }) : e.isActive({ textAlign: align })),
        run: (e: Editor) => (align === 'left' ? e.chain().focus().unsetTextAlign().run() : e.chain().focus().setTextAlign(align).run()),
      })),
      tool('clear', 'clear', (e) => e.chain().focus().unsetAllMarks().run(), { stateless: true }),
    ]
  }

  /** Barre de sélection, ou saisie de l'adresse d'un lien. */
  #renderBubble(): void {
    if (this.#link === null) {
      this.#toolbar.render()
      return
    }
    const input = h('input', { type: 'url', class: 'tif-input', placeholder: t('richText.link.placeholder'), 'aria-label': t('richText.link.label') })
    input.value = this.#link
    const close = () => {
      this.#link = null
      this.#renderBubble()
    }
    const apply = () => {
      const url = input.value.trim()
      const chain = this.editor.chain().focus().extendMarkRange('link')
      this.#link = null
      if (url) {
        chain.setLink({ href: /^(https?:|mailto:)/i.test(url) ? url : `https://${url}` }).run()
      } else {
        chain.unsetLink().run()
      }
    }
    input.addEventListener('input', () => {
      this.#link = input.value
    })
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        apply()
      } else if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        close()
        this.editor.commands.focus()
      }
    })
    const confirm = h('button', { type: 'button' }, t('richText.link.confirm'))
    confirm.addEventListener('click', apply)
    const parts: Node[] = [input, confirm]
    if (this.editor.isActive('link')) {
      const remove = h('button', { type: 'button' }, t('richText.remove'))
      remove.addEventListener('click', () => {
        this.#link = null
        this.editor.chain().focus().extendMarkRange('link').unsetLink().run()
      })
      parts.push(remove)
    }
    this.#toolbar.element.replaceChildren(...parts)
    queueMicrotask(() => input.focus())
  }

  // ---- Poignée des blocs ----

  #listen(): void {
    const signal = this.#listeners.signal
    this.#file.addEventListener(
      'change',
      () => {
        const selected = this.#file.files?.[0]
        this.#file.value = ''
        if (selected) {
          void this.#upload(selected)
        }
      },
      { signal },
    )
    this.surface.addEventListener('mousemove', (event) => this.#hover(event), { signal })
    this.surface.addEventListener(
      'mouseleave',
      () => {
        if (!this.#dragging && this.#menu.state?.kind !== 'block') {
          this.#showHandle(null)
        }
      },
      { signal },
    )
    this.#grip.addEventListener(
      'pointerdown',
      (event) => {
        if (event.button === 0 && this.#handle) {
          this.#dragging = { block: this.#handle, start: event.clientY, target: null, moved: false }
          this.#grip.setPointerCapture?.(event.pointerId)
        }
      },
      { signal },
    )
    this.#grip.addEventListener('pointermove', (event) => this.#drag(event), { signal })
    this.#grip.addEventListener('pointerup', () => this.#release(), { signal })
    // Clavier : Entrée ou Espace sur la poignée ouvre le menu du bloc.
    this.#grip.addEventListener(
      'keydown',
      (event) => {
        if ((event.key === 'Enter' || event.key === ' ') && this.#handle) {
          event.preventDefault()
          this.#openBlockMenu(this.#handle, this.#grip.getBoundingClientRect())
        }
      },
      { signal },
    )
    this.#add.addEventListener('mousedown', (event) => event.preventDefault(), { signal })
    this.#add.addEventListener('click', () => this.#handle && this.#addBelow(this.#handle), { signal })
    // Menu d'un bloc ou d'un tableau ouvert : le clavier et un clic à côté le gèrent.
    document.addEventListener(
      'keydown',
      (event) => {
        if (this.#menu.state?.kind === 'block' && this.#menu.key(event)) {
          event.preventDefault()
          event.stopPropagation()
          if (event.key === 'Escape') {
            this.editor.commands.focus()
          }
        }
      },
      { signal, capture: true },
    )
    document.addEventListener(
      'mousedown',
      (event) => {
        const target = event.target as Element
        if (this.#menu.state?.kind === 'block' && !this.#menu.element?.contains(target) && !target.closest?.('.tif-rich-grip, .tif-rich-table-grip')) {
          this.#menu.close()
          this.#grip.setAttribute('aria-expanded', 'false')
        }
      },
      { signal },
    )
  }

  #hover(event: MouseEvent): void {
    // Sur la poignée ou le « + » : ils restent sur leur bloc, même si la souris passe à hauteur du suivant.
    if (!this.editor.isEditable || this.#dragging || this.#menu.state?.kind === 'block' || (event.target as Element).closest('.tif-rich-grip')) {
      return
    }
    const block = blocksOf(this.editor).find((b) => {
      const r = b.dom.getBoundingClientRect()
      return event.clientY >= r.top - 3 && event.clientY <= r.bottom + 3
    })
    if (block) {
      this.#showHandle(block)
    }
  }

  #showHandle(block: Block | null): void {
    this.#handle = block
    this.#grip.hidden = !block
    this.#add.hidden = !block
    if (!block) {
      return
    }
    const lineHeight = parseFloat(getComputedStyle(block.dom).lineHeight) || 21
    const top = block.dom.getBoundingClientRect().top - this.surface.getBoundingClientRect().top + Math.max(0, (lineHeight - 24) / 2)
    this.#grip.style.top = `${top}px`
    this.#add.style.top = `${top + 24}px`
  }

  /** « + » sous la poignée : une ligne vide sous le bloc, le curseur dedans (un paragraphe vide reçoit le curseur). */
  #addBelow(block: Block): void {
    const isEmpty = block.node.type.name === 'paragraph' && block.node.content.size === 0
    const chain = this.editor.chain().focus()
    if (isEmpty) {
      chain.setTextSelection(block.pos + 1)
    } else {
      const after = block.pos + block.node.nodeSize
      chain.insertContentAt(after, { type: 'paragraph' }).setTextSelection(after + 1)
    }
    chain.run()
    this.#showHandle(null)
  }

  #openBlockMenu(block: Block, anchor: DOMRect): void {
    const editor = this.editor
    const list = blocksOf(editor)
    const index = list.findIndex((b) => b.pos === block.pos)
    const andClose = (action: () => void) => () => {
      this.#menu.close()
      this.#grip.setAttribute('aria-expanded', 'false')
      action()
    }
    const isTable = block.node.type.name === 'table'
    // Le curseur va dans le bloc (première cellule pour un tableau) : les transformations s'y appliquent.
    const inside = editor.state.selection.from > block.pos && editor.state.selection.to < block.pos + block.node.nodeSize
    if (!inside) {
      editor.view.dispatch(editor.state.tr.setSelection(TextSelection.near(editor.state.doc.resolve(block.pos + 1))))
    }
    editor.commands.focus()
    const tableTitle = t('richText.table.title')
    const entries: Entry[] = isTable
      ? [
          { key: 'row-after', label: t('richText.table.addRow'), group: tableTitle, icon: () => richIcon('plus'), run: andClose(() => editor.chain().focus().addRowAfter().run()) },
          { key: 'column-after', label: t('richText.table.addColumn'), group: tableTitle, icon: () => richIcon('plus'), run: andClose(() => editor.chain().focus().addColumnAfter().run()) },
          { key: 'row-delete', label: t('richText.table.deleteRow'), group: tableTitle, icon: () => richIcon('delete'), run: andClose(() => editor.chain().focus().deleteRow().run()) },
          { key: 'column-delete', label: t('richText.table.deleteColumn'), group: tableTitle, icon: () => richIcon('delete'), run: andClose(() => editor.chain().focus().deleteColumn().run()) },
        ]
      : BLOCK_TYPES.map((b) => ({ key: b.key, label: t(`richText.blocks.${b.key}.label`), group: t('richText.menu.transformInto'), icon: () => richIcon(b.icon), run: andClose(() => b.run(editor.chain().focus()).run()) }))
    const blockGroup = t('richText.menu.block')
    this.#grip.setAttribute('aria-expanded', 'true')
    this.#menu.open({
      kind: 'block',
      title: '',
      rect: anchor,
      choice: 0,
      entries: [
        ...entries,
        { key: 'up', label: t('richText.menu.moveUp'), group: blockGroup, icon: () => richIcon('up'), disabled: index <= 0, run: andClose(() => moveBlock(editor, block, index - 1)) },
        { key: 'down', label: t('richText.menu.moveDown'), group: blockGroup, icon: () => richIcon('down'), disabled: index >= list.length - 1, run: andClose(() => moveBlock(editor, block, index + 2)) },
        {
          key: 'duplicate',
          label: t('richText.menu.duplicate'),
          group: blockGroup,
          icon: () => richIcon('duplicate'),
          run: andClose(() => editor.chain().focus().insertContentAt(block.pos + block.node.nodeSize, block.node.toJSON()).run()),
        },
        {
          key: 'delete',
          label: isTable ? t('richText.menu.deleteTable') : t('richText.delete'),
          group: blockGroup,
          icon: () => richIcon('delete'),
          danger: true,
          run: andClose(() => editor.chain().focus().deleteRange({ from: block.pos, to: block.pos + block.node.nodeSize }).run()),
        },
      ],
    })
  }

  #openActions(actions: TableAction[], anchor: DOMRect): void {
    const group = t('richText.table.title')
    this.#menu.open({
      kind: 'block',
      title: '',
      rect: anchor,
      choice: 0,
      entries: actions.map((a) => ({
        key: a.key,
        label: a.label,
        group,
        icon: () => richIcon(a.icon),
        danger: a.danger,
        run: () => {
          this.#menu.close()
          a.run()
        },
      })),
    })
  }

  #drag(event: PointerEvent): void {
    const g = this.#dragging
    if (!g || (!g.moved && Math.abs(event.clientY - g.start) < 4)) {
      return
    }
    g.moved = true
    g.block.dom.classList.add('tif-rich-moving')
    const list = blocksOf(this.editor)
    let target = list.length
    for (let i = 0; i < list.length; i++) {
      const r = list[i].dom.getBoundingClientRect()
      if (event.clientY < r.top + r.height / 2) {
        target = i
        break
      }
    }
    g.target = target
    const top = this.surface.getBoundingClientRect().top
    const y = target < list.length ? list[target].dom.getBoundingClientRect().top - 3 : list[list.length - 1].dom.getBoundingClientRect().bottom + 1
    this.#marker.style.top = `${y - top}px`
    this.#marker.hidden = false
  }

  #release(): void {
    const g = this.#dragging
    this.#dragging = null
    this.#marker.hidden = true
    if (!g) {
      return
    }
    g.block.dom.classList.remove('tif-rich-moving')
    if (g.moved && g.target !== null) {
      moveBlock(this.editor, g.block, g.target)
      this.#showHandle(null)
    } else {
      this.#openBlockMenu(g.block, this.#grip.getBoundingClientRect())
    }
  }

  // ---- Options ----

  protected override optionsChanged(keys: string[]): void {
    if (keys.includes('value')) {
      this.value = this.options.value
    }
    this.#apply(keys)
  }

  #apply(keys: string[]): void {
    const o = this.options
    if (keys.includes('name')) {
      if (o.name) {
        this.holder.name = String(o.name)
      } else {
        this.holder.removeAttribute('name')
      }
    }
    if (keys.includes('disabled') || keys.includes('readonly')) {
      this.editor.setEditable(!o.disabled && !o.readonly, false)
      this.surface.classList.toggle('tif-disabled', Boolean(o.disabled))
      this.surface.classList.toggle('tif-readonly', Boolean(o.readonly))
      this.holder.disabled = Boolean(o.disabled)
      this.#showHandle(null)
      this.#tables.render()
    }
    const content = this.editor.view.dom
    if (keys.includes('label')) {
      if (o.label) {
        content.setAttribute('aria-label', String(o.label))
      } else {
        content.removeAttribute('aria-label')
      }
    }
    if (keys.includes('inputId') && o.inputId) {
      content.id = String(o.inputId)
    }
    if (keys.includes('required')) {
      if (o.required) {
        content.setAttribute('aria-required', 'true')
      } else {
        content.removeAttribute('aria-required')
      }
      this.#validity()
    }
    if (keys.includes('imageFormats')) {
      this.#file.accept = String(o.imageFormats)
    }
    if (keys.includes('placeholder')) {
      this.#refresh()
    }
    this.#grip.title = t('richText.menu.grip.title')
    this.#grip.setAttribute('aria-label', t('richText.menu.grip.label'))
    this.#add.title = t('richText.menu.addBelow.title')
    this.#add.setAttribute('aria-label', t('richText.menu.addBelow.label'))
  }

  /** Redessine ce qui dépend de la langue ou des options (texte d'aide, barre de sélection). */
  #refresh(): void {
    if (!this.editor.isDestroyed) {
      this.editor.view.dispatch(this.editor.state.tr.setMeta('tifRefresh', true))
    }
  }

  protected override localeChanged(): void {
    this.#apply([])
    this.#refresh()
    this.#menu.close()
  }

  override dispose(): void {
    if (this.disposed) {
      return
    }
    this.#listeners.abort()
    this.#menu.close()
    this.#tables.dispose()
    this.editor.destroy()
    this.surface.remove()
    if (this.#textarea) {
      this.#textarea.hidden = false
      this.#textarea.value = this.holder.value
    }
    super.dispose()
  }
}
